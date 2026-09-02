// ─── User Service ───────────────────────────────────────────────────────────
// Finds and links existing registered users by their phone number with fuzzy matching

function cleanDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function isLid(phone) {
  const str = String(phone || "").trim();
  if (str.endsWith("@lid")) return true;
  const digits = cleanDigits(str);
  if (!digits) return false;
  // Standard phone numbers around the world are up to 13 digits (or 14 for Nigerian 2340...)
  // WhatsApp LIDs are internal IDs (14-18 digits e.g. 33372130783232)
  if (digits.length >= 14 && !digits.startsWith("2340")) {
    return true;
  }
  if (digits.length > 14) {
    return true;
  }
  return false;
}

function normalizeCustomerPhone(phone) {
  let digits = cleanDigits(phone);
  if (!digits || isLid(phone)) return "N/A";

  // If it's a 10-digit Nigerian number (e.g. 8012345678)
  if (digits.length === 10 && (digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9"))) {
    return "+234" + digits;
  }
  // If it starts with 0 (e.g. 08012345678)
  if (digits.startsWith("0") && digits.length === 11) {
    return "+234" + digits.slice(1);
  }
  // If it starts with 2340 (e.g. 23408012345678)
  if (digits.startsWith("2340") && digits.length === 14) {
    return "+234" + digits.slice(4);
  }
  // If starts with 234 (e.g. 2348012345678)
  if (digits.startsWith("234") && digits.length === 13) {
    return "+" + digits;
  }

  return "+" + digits;
}

function buildPhoneSearchQueries(phone) {
  if (!phone) return [];
  const digits = cleanDigits(phone);
  if (!digits || digits.length < 5) return [];

  const queries = [];
  const variants = new Set();

  const rawTrimmed = String(phone).trim();
  variants.add(rawTrimmed);
  variants.add(digits);
  variants.add(`+${digits}`);

  // Determine subscriber / core digits
  // In Nigeria: 10 subscriber digits (e.g. 8100918189)
  let sub10 = "";
  if (digits.startsWith("2340") && digits.length >= 14) {
    sub10 = digits.slice(4);
  } else if (digits.startsWith("234") && digits.length >= 13) {
    sub10 = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length >= 11) {
    sub10 = digits.slice(1);
  } else if (digits.length === 10 && (digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9"))) {
    sub10 = digits;
  } else if (digits.length >= 10) {
    sub10 = digits.slice(-10);
  }

  if (sub10 && sub10.length >= 7) {
    variants.add(sub10);
    variants.add("0" + sub10);
    variants.add("234" + sub10);
    variants.add("+234" + sub10);
    variants.add("+234 " + sub10);
    variants.add("+234-" + sub10);
    
    // Spaced variants commonly typed by users on the web app:
    // e.g. "0810 091 8189", "+234 810 091 8189"
    if (sub10.length === 10) {
      const c1 = sub10.slice(0, 3);
      const c2 = sub10.slice(3, 6);
      const c3 = sub10.slice(6);
      variants.add(`0${c1} ${c2} ${c3}`);
      variants.add(`+234 ${c1} ${c2} ${c3}`);
      variants.add(`0${c1}-${c2}-${c3}`);
      variants.add(`+234-${c1}-${c2}-${c3}`);
      variants.add(`${c1} ${c2} ${c3}`);
      variants.add(`${c1}-${c2}-${c3}`);
    }
  }

  // Exact in-array match for direct variants (fast index lookup)
  queries.push({ phone: { $in: Array.from(variants) } });
  queries.push({ "addresses.phone": { $in: Array.from(variants) } });

  // Powerful regex pattern to match any spacing/punctuation between digits:
  // e.g. "8100918189" -> "8[\s\-()]*1[\s\-()]*0..."
  const matchDigits = sub10 || (digits.length >= 8 ? digits.slice(-8) : digits);
  if (matchDigits.length >= 7) {
    const fuzzyPattern = matchDigits.split("").join("[\\s\\-\\(\\)\\.]*");
    queries.push({ phone: { $regex: fuzzyPattern, $options: "i" } });
    queries.push({ "addresses.phone": { $regex: fuzzyPattern, $options: "i" } });
  }

  // Also match the last 9 digits at end of phone string
  if (digits.length >= 9) {
    const last9 = digits.slice(-9);
    const fuzzyLast9 = last9.split("").join("[\\s\\-\\(\\)\\.]*") + "$";
    queries.push({ phone: { $regex: fuzzyLast9, $options: "i" } });
  }

  return queries;
}

async function findUserByPhone(db, phone) {
  if (!db || !phone) return null;

  try {
    let lookupPhone = String(phone).trim();

    // If incoming identifier is a WhatsApp LID (e.g. 33372130783232)
    if (isLid(lookupPhone)) {
      const lidDigits = cleanDigits(lookupPhone);
      // Check MongoDB whatsapp_lid_map to resolve real phone number
      const lidDoc = await db.collection("whatsapp_lid_map").findOne({ _id: lidDigits });
      if (lidDoc && lidDoc.phone) {
        console.log(`🔁 findUserByPhone: resolved LID ${lidDigits} → ${lidDoc.phone} from whatsapp_lid_map`);
        lookupPhone = lidDoc.phone;
      } else {
        // If unmapped LID, check if any wishlist has this LID mapped or return null
        return null;
      }
    }

    const usersCollection = db.collection("users");
    const queries = buildPhoneSearchQueries(lookupPhone);

    if (queries.length === 0) return null;

    const user = await usersCollection.findOne({ $or: queries });

    if (user) {
      console.log(`👤 Customer identified in DB: ${user.name} (${user.email || user.phone}) for query phone: ${lookupPhone}`);
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || normalizeCustomerPhone(lookupPhone),
        addresses: Array.isArray(user.addresses) ? user.addresses : [],
      };
    }
  } catch (err) {
    console.error("⚠️ Error in findUserByPhone:", err.message);
  }

  return null;
}

module.exports = {
  findUserByPhone,
  normalizeCustomerPhone,
  cleanDigits,
  isLid,
};
