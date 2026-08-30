// ─── Order Service ──────────────────────────────────────────────────────────
// Creates orders directly in MongoDB matching the Next.js Order schema with dynamic delivery calculation

const { ObjectId } = require("mongodb");
const { normalizeCustomerPhone } = require("./userService");

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function generateOrderSerialNo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let serial = "ORD-";
  for (let i = 0; i < 6; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

async function calculateDeliveryFee(db, { subtotal, latitude, longitude }) {
  const settingsCollection = db.collection("settings");
  let baseFee = 500;
  let feePerKm = 100;
  let orderValueFeePercent = 0;
  let largeOrderThreshold = 0;
  let largeOrderFeePercent = 0;
  let freeDeliveryThreshold = 0;
  let companyLat = null;
  let companyLng = null;

  try {
    const allSettings = await settingsCollection.find({}).toArray();
    for (const s of allSettings) {
      if (s.key === "baseDeliveryFee") baseFee = parseFloat(s.payload) || 500;
      if (s.key === "feePerKm") feePerKm = parseFloat(s.payload) || 100;
      if (s.key === "orderValueFeePercent") orderValueFeePercent = parseFloat(s.payload) || 0;
      if (s.key === "largeOrderThreshold") largeOrderThreshold = parseFloat(s.payload) || 0;
      if (s.key === "largeOrderFeePercent") largeOrderFeePercent = parseFloat(s.payload) || 0;
      if (s.key === "freeDeliveryThreshold") freeDeliveryThreshold = parseFloat(s.payload) || 0;
      if (s.key === "company_latitude") companyLat = parseFloat(s.payload);
      if (s.key === "company_longitude") companyLng = parseFloat(s.payload);
    }
  } catch (e) {
    // Non-fatal
  }

  // Free delivery threshold check
  if (freeDeliveryThreshold > 0 && subtotal >= freeDeliveryThreshold) {
    return {
      deliveryCharge: 0,
      isFree: true,
      distanceKm: null,
      breakdown: "Free Delivery applied (over threshold)",
    };
  }

  let distanceKm = null;
  let distanceFee = 0;

  if (latitude !== undefined && longitude !== undefined && companyLat !== null && companyLng !== null) {
    const d = haversineDistance(latitude, longitude, companyLat, companyLng);
    if (!isNaN(d) && d > 0) {
      distanceKm = Math.round(d * 10) / 10;
      distanceFee = Math.round(distanceKm * feePerKm);
    }
  }

  const rawDelivery = baseFee + distanceFee;
  const orderValueFee = Math.round((subtotal * orderValueFeePercent) / 100);
  let largeOrderSurcharge = 0;
  if (largeOrderThreshold > 0 && subtotal >= largeOrderThreshold) {
    largeOrderSurcharge = Math.round((subtotal * largeOrderFeePercent) / 100);
  }

  const totalDelivery = rawDelivery + orderValueFee + largeOrderSurcharge;

  return {
    deliveryCharge: totalDelivery,
    isFree: false,
    distanceKm,
    baseFee,
    distanceFee,
    orderValueFee,
    largeOrderSurcharge,
  };
}

async function createWhatsAppOrder(db, {
  cart,
  customerName,
  customerEmail,
  customerPhone,
  deliveryAddress,
  latitude,
  longitude,
  deliveryCharge,
  paymentMethod,
  userId,
}) {
  const ordersCollection = db.collection("orders");

  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // If deliveryCharge not passed in, compute it dynamically
  let finalDeliveryCharge = Number(deliveryCharge);
  if (isNaN(finalDeliveryCharge) || finalDeliveryCharge < 0) {
    const calc = await calculateDeliveryFee(db, { subtotal, latitude, longitude });
    finalDeliveryCharge = calc.deliveryCharge;
  }

  const totalAmount = subtotal + finalDeliveryCharge;
  const orderSerialNo = generateOrderSerialNo();
  const validPhone = normalizeCustomerPhone(customerPhone);

  const formattedItems = cart.map((item) => ({
    itemId: String(item.itemId || item.id),
    name: item.name,
    price: Number(item.price),
    quantity: Number(item.quantity) || 1,
    itemTotal: Number(item.itemTotal),
  }));

  const orderDoc = {
    orderSerialNo,
    userId: userId ? (ObjectId.isValid(userId) ? new ObjectId(userId) : userId) : null,
    customerName: customerName || "WhatsApp Customer",
    customerEmail: customerEmail || `customer_${orderSerialNo.toLowerCase()}@nectargroceries.com`,
    customerPhone: validPhone,
    orderType: "delivery",
    storeId: 0,
    items: formattedItems,
    subtotal,
    taxAmount: 0,
    discountAmount: 0,
    deliveryCharge: finalDeliveryCharge,
    discount: 0,
    totalAmount,
    deliveryAddress: {
      address: deliveryAddress || "Address provided via WhatsApp",
      latitude: latitude !== undefined ? Number(latitude) : undefined,
      longitude: longitude !== undefined ? Number(longitude) : undefined,
    },
    paymentMethod: paymentMethod || "bank_transfer",
    paymentStatus: "unpaid",
    orderStatus: "pending",
    statusTimeline: [
      {
        status: "pending",
        timestamp: new Date(),
        note: "Order placed via Nectar WhatsApp Bot",
      },
    ],
    notes: "Placed via Nectar WhatsApp Bot",
    isPos: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const insertResult = await ordersCollection.insertOne(orderDoc);
  orderDoc._id = insertResult.insertedId;

  console.log(`📦 New WhatsApp Order #${orderSerialNo} (Phone: ${validPhone}) - Total: ₦${totalAmount.toLocaleString()} (Delivery: ₦${finalDeliveryCharge})`);

  return orderDoc;
}

module.exports = {
  createWhatsAppOrder,
  calculateDeliveryFee,
  haversineDistance,
};
