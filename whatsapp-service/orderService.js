// ─── Order Service ──────────────────────────────────────────────────────────
// Creates orders directly in MongoDB matching the Next.js Order schema

const { ObjectId } = require("mongodb");

function generateOrderSerialNo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let serial = "ORD-";
  for (let i = 0; i < 6; i++) {
    serial += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return serial;
}

async function createWhatsAppOrder(db, {
  cart,
  customerName,
  customerEmail,
  customerPhone,
  deliveryAddress,
  paymentMethod,
  userId,
}) {
  const ordersCollection = db.collection("orders");
  const settingsCollection = db.collection("settings");

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.itemTotal, 0);

  // Delivery fee from settings or default ₦500
  let deliveryCharge = 500;
  try {
    const feeSetting = await settingsCollection.findOne({ key: "baseDeliveryFee" });
    if (feeSetting && typeof feeSetting.payload === "number") {
      deliveryCharge = feeSetting.payload;
    }
  } catch (e) {
    // Non-fatal, use default
  }

  const totalAmount = subtotal + deliveryCharge;
  const orderSerialNo = generateOrderSerialNo();

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
    customerPhone: String(customerPhone),
    orderType: "delivery",
    storeId: 0,
    items: formattedItems,
    subtotal,
    taxAmount: 0,
    discountAmount: 0,
    deliveryCharge,
    discount: 0,
    totalAmount,
    deliveryAddress: {
      address: deliveryAddress || "Address provided via WhatsApp",
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

  console.log(`📦 New WhatsApp Order created: #${orderSerialNo} (ID: ${orderDoc._id}) - ₦${totalAmount.toLocaleString()}`);

  return orderDoc;
}

module.exports = {
  createWhatsAppOrder,
};
