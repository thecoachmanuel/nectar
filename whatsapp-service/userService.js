// ─── User Service ───────────────────────────────────────────────────────────
// Finds and links existing registered users by their phone number

function normalizePhoneVariants(phone) {
  const digits = String(phone).replace(/\D/g, "");
  const variants = [digits];

  if (digits.startsWith("234") && digits.length >= 13) {
    const local = "0" + digits.slice(3); // e.g. 08012345678
    const raw = digits.slice(3);        // e.g. 8012345678
    variants.push(local, raw, `+${digits}`, `+234 ${raw}`);
  } else if (digits.startsWith("0") && digits.length >= 11) {
    const intl = "234" + digits.slice(1); // e.g. 2348012345678
    const raw = digits.slice(1);
    variants.push(intl, raw, `+${intl}`);
  }

  return [...new Set(variants)];
}

async function findUserByPhone(db, phone) {
  if (!db || !phone) return null;

  try {
    const usersCollection = db.collection("users");
    const variants = normalizePhoneVariants(phone);
    const rawDigits = String(phone).replace(/\D/g, "");
    
    const query = [{ phone: { $in: variants } }];
    if (rawDigits.length >= 7) {
      const lastDigits = rawDigits.slice(-9);
      query.push({ phone: { $regex: lastDigits + "$", $options: "i" } });
    }

    // 1. Try exact match on variants
    let user = await usersCollection.findOne({ $or: query });

    if (user) {
      return {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || phone,
        addresses: Array.isArray(user.addresses) ? user.addresses : [],
      };
    }
  } catch (err) {
    console.error("⚠️ Error finding user by phone:", err.message);
  }

  return null;
}

module.exports = {
  findUserByPhone,
  normalizePhoneVariants,
};
