// ─── User Service ───────────────────────────────────────────────────────────
// Finds and links existing registered users by their phone number with fuzzy matching

function cleanDigits(phone) {
  return String(phone || "").replace(/\D/g, "");
}

function normalizeCustomerPhone(phone) {
  let digits = cleanDigits(phone);
  if (!digits) return "N/A";

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
  const digits = cleanDigits(phone);
  const queries = [];

  if (!digits || digits.length < 5) return queries;

  // 1. Direct variants
  const variants = new Set([
    digits,
    `+${digits}`,
    phone.trim(),
  ]);

  // If Nigerian phone format
  let raw10 = "";
  if (digits.startsWith("2340") && digits.length >= 14) {
    raw10 = digits.slice(4);
  } else if (digits.startsWith("234") && digits.length >= 13) {
    raw10 = digits.slice(3);
  } else if (digits.startsWith("0") && digits.length >= 11) {
    raw10 = digits.slice(1);
  } else if (digits.length === 10 && (digits.startsWith("7") || digits.startsWith("8") || digits.startsWith("9"))) {
    raw10 = digits;
  }

  if (raw10) {
    variants.add(raw10);
    variants.add("0" + raw10);
    variants.add("234" + raw10);
    variants.add("+234" + raw10);
    variants.add("+234 " + raw10);
    variants.add("+234-" + raw10);
    variants.add("0" + raw10.slice(0, 3) + " " + raw10.slice(3, 6) + " " + raw10.slice(6));
  }

  queries.push({ phone: { $in: Array.from(variants) } });

  // 2. Fuzzy regex matching on the last 8-10 digits (matches spaced, hyphenated, or bracketed numbers)
  const matchDigits = raw10 || (digits.length >= 8 ? digits.slice(-8) : digits);
  if (matchDigits.length >= 7) {
    // e.g. "8012345678" -> "8[\s\-()]*0[\s\-()]*1[\s\-()]*..."
    const fuzzyPattern = matchDigits.split("").join("[\\s\\-\\(\\)]*");
    queries.push({ phone: { $regex: fuzzyPattern, $options: "i" } });
  }

  return queries;
}

async function findUserByPhone(db, phone) {
  if (!db || !phone) return null;

  try {
    const usersCollection = db.collection("users");
    const queries = buildPhoneSearchQueries(phone);

    if (queries.length === 0) return null;

    const user = await usersCollection.findOne({ $or: queries });

      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || normalizeCustomerPhone(phone),
        walletBalance: Number(user.walletBalance || 0),
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
};
