// ΓöÇΓöÇΓöÇ Order Service ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ
// Creates orders directly in MongoDB matching the Next.js Order schema with exact online delivery calculation

const { ObjectId } = require("mongodb");
const { normalizeCustomerPhone } = require("./userService");
const { getFrontendAppUrl } = require("./paymentService");

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

async function calculateDeliveryFee(db, { cart, subtotal, latitude, longitude, address }) {
  // Strategy 1: Attempt calling Next.js checkout calculate API for 100% exact parity
  try {
    const frontendUrl = await getFrontendAppUrl(db);
    const formattedCart = (cart || []).map((item) => ({
      _id: String(item.itemId || item.id),
      name: item.name,
      price: Number(item.price),
      quantity: Number(item.quantity) || 1,
      itemTotal: Number(item.itemTotal || item.price * item.quantity),
    }));

    const res = await fetch(`${frontendUrl}/api/frontend/checkout/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: formattedCart,
        orderType: "delivery",
        deliveryAddress: {
          address: address || "WhatsApp Delivery Address",
          latitude: latitude !== undefined ? parseFloat(latitude) : undefined,
          longitude: longitude !== undefined ? parseFloat(longitude) : undefined,
        },
      }),
    });

    const data = await res.json();
    if (data.status && typeof data.deliveryCharge === "number") {
      return {
        deliveryCharge: data.deliveryCharge,
        isFree: data.deliveryCharge === 0 && subtotal > 0,
        distanceKm: data.distanceKm || null,
      };
    }
  } catch (apiErr) {
    // Non-fatal, proceed to internal calculation
  }

  // Strategy 2: Internal identical calculation engine matching checkout/calculate/route.ts
  const settingsCollection = db.collection("settings");
  let baseFee = 1500;
  let feePerKm = 100;
  let multiStoreExtraFee = 0;
  let freeThreshold = undefined;
  let adminLat = undefined;
  let adminLng = undefined;
  let orderValueFeePercent = 2; // Default 2% handling fee
  let largeOrderThreshold = 20000; // Default Γéª20,000 threshold
  let largeOrderFeePercent = 3; // Default 3% extra for large orders

  try {
    const allSettings = await settingsCollection.find({}).toArray();
    for (const s of allSettings) {
      if (s.key === "baseDeliveryFee") baseFee = parseFloat(s.payload) || 1500;
      if (s.key === "feePerKm") feePerKm = parseFloat(s.payload) || 100;
      if (s.key === "multiStoreExtraFee") multiStoreExtraFee = parseFloat(s.payload) || 0;
      if (s.key === "freeDeliveryThreshold" && s.payload) freeThreshold = parseFloat(s.payload);
      if (s.key === "company_latitude" && s.payload) adminLat = parseFloat(s.payload);
      if (s.key === "company_longitude" && s.payload) adminLng = parseFloat(s.payload);
      if (s.key === "orderValueFeePercent") orderValueFeePercent = parseFloat(s.payload) ?? 2;
      if (s.key === "largeOrderThreshold") largeOrderThreshold = parseFloat(s.payload) ?? 20000;
      if (s.key === "largeOrderFeePercent") largeOrderFeePercent = parseFloat(s.payload) ?? 3;
    }
  } catch (e) {
    // Non-fatal
  }

  // Fallback store coordinates if admin coordinates not in settings
  if (adminLat === undefined || adminLng === undefined || isNaN(adminLat) || isNaN(adminLng)) {
    try {
      const defaultStore = await db.collection("stores").findOne({
        latitude: { $exists: true, $ne: null },
        longitude: { $exists: true, $ne: null },
      });
      if (defaultStore && defaultStore.latitude && defaultStore.longitude) {
        adminLat = parseFloat(defaultStore.latitude);
        adminLng = parseFloat(defaultStore.longitude);
      }
    } catch (e) {}
  }

  // Free delivery threshold check
  if (freeThreshold !== undefined && freeThreshold > 0 && subtotal >= freeThreshold) {
    return {
      deliveryCharge: 0,
      isFree: true,
      distanceKm: null,
    };
  }

  let maxDistance = 0;
  let distanceKm = null;

  if (
    latitude !== undefined &&
    longitude !== undefined &&
    adminLat !== undefined &&
    adminLng !== undefined &&
    !isNaN(adminLat) &&
    !isNaN(adminLng)
  ) {
    const userLat = parseFloat(latitude);
    const userLng = parseFloat(longitude);
    const dist = haversineDistance(userLat, userLng, adminLat, adminLng);
    if (!isNaN(dist) && dist > 0) {
      maxDistance = dist;
      distanceKm = Math.round(dist * 10) / 10;
    }
  }

  let rawDeliveryFee = baseFee + (maxDistance * feePerKm);

  // Auto-scale delivery fee based on order magnitude (exact parity with web app):
  // 1. Order Value Handling Fee (% of order subtotal)
  const orderValueFee = Math.round((subtotal * orderValueFeePercent) / 100);

  // 2. Large Order Surcharge (Applied when subtotal exceeds largeOrderThreshold)
  let largeOrderSurcharge = 0;
  if (largeOrderThreshold > 0 && subtotal >= largeOrderThreshold) {
    largeOrderSurcharge = Math.round((subtotal * largeOrderFeePercent) / 100);
  }

  const totalDelivery = rawDeliveryFee + orderValueFee + largeOrderSurcharge;

  console.log(`≡ƒÜÜ [Live DB Delivery Calculation] Base: Γéª${baseFee}, PerKm: Γéª${feePerKm}, Distance: ${distanceKm || 0}km (Fee: Γéª${Math.round(maxDistance * feePerKm)}), Handling: Γéª${orderValueFee}, LargeOrderSurcharge: Γéª${largeOrderSurcharge} Γ₧ö Total Delivery: Γéª${totalDelivery}`);

  return {
    deliveryCharge: totalDelivery,
    isFree: false,
    distanceKm,
    baseFee,
    distanceFee: Math.round(maxDistance * feePerKm),
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
    const calc = await calculateDeliveryFee(db, { cart, subtotal, latitude, longitude, address: deliveryAddress });
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

  console.log(`≡ƒôª New WhatsApp Order #${orderSerialNo} (Phone: ${validPhone}) - Total: Γéª${totalAmount.toLocaleString()} (Delivery: Γéª${finalDeliveryCharge})`);

  return orderDoc;
}

module.exports = {
  createWhatsAppOrder,
  calculateDeliveryFee,
  haversineDistance,
};
