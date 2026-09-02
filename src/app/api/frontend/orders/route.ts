import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";
import User from "@/models/User";
import Store from "@/models/Store";
import { jwtVerify } from "jose";
import { sendPushNotification } from "@/lib/push";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.split(" ")[1];
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload.userId as string;
  } catch (error) {
    return null;
  }
}

function generateOrderSerial() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${timestamp}-${random}`;
}

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    // Auth is optional for Guest Checkouts (if the UI allows it), but let's try to get it
    const userId = await getUserFromToken(req);
    
    const body = await req.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      orderType,
      items,
      subtotal,
      taxAmount,
      discountAmount,
      deliveryCharge,
      totalAmount,
      couponCode,
      couponDiscount,
      deliveryAddress,
      deliveryTimeSlot,
      paymentMethod,
      notes,
      isPos
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ status: false, message: "Cart is empty" }, { status: 400 });
    }

    if (orderType === "delivery" && !deliveryAddress) {
      return NextResponse.json({ status: false, message: "Delivery address is required" }, { status: 400 });
    }
    
    if (paymentMethod === "cash_on_delivery" && !isPos) {
      return NextResponse.json({ status: false, message: "Cash on delivery is not available for online orders." }, { status: 400 });
    }
    
    let userDoc = null;
    const User = (await import("@/models/User")).default;
    if (userId) {
      userDoc = await User.findById(userId);
    }
    
    if (orderType === "delivery" && (deliveryCharge === undefined || deliveryCharge < 0)) {
      return NextResponse.json({ status: false, message: "Your address is out of delivery range." }, { status: 400 });
    }

    if (paymentMethod === "wallet") {
      if (!userId) {
        return NextResponse.json({ status: false, message: "You must be logged in to use Wallet." }, { status: 400 });
      }
      if (!userDoc || (userDoc.walletBalance || 0) < totalAmount) {
        return NextResponse.json({ status: false, message: "Insufficient wallet balance." }, { status: 400 });
      }
    }

    const resolvedCustomerName = customerName || userDoc?.name || "Guest";
    const resolvedCustomerEmail = customerEmail || userDoc?.email || "";
    const resolvedCustomerPhone = (customerPhone && customerPhone !== "N/A" && customerPhone.trim() !== "") 
      ? customerPhone 
      : (userDoc?.phone || "N/A");

    const Store = (await import("@/models/Store")).default;

    // 1. Group items by storeId (respecting explicit POS branchId/storeId)
    const posStoreId = (isPos && (body.branchId || body.storeId) && (body.branchId || body.storeId) !== "0") 
      ? (body.branchId || body.storeId) 
      : null;

    const storeGroups: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const sId = posStoreId || item.storeId || "admin";
      if (!storeGroups[sId]) storeGroups[sId] = [];
      storeGroups[sId].push({ ...item, storeId: sId });
    });

    const storeIds = Object.keys(storeGroups);
    const createdOrders = [];

    // Process each store group as a separate order
    for (let i = 0; i < storeIds.length; i++) {
      const sId = storeIds[i];
      const groupItems = storeGroups[sId];
      
      // Calculate group subtotal
      const groupSubtotal = groupItems.reduce((acc, item) => acc + (item.itemTotal || (item.price * item.quantity)), 0);
      
      let commissionRate = 0;
      let actualStoreId: any = sId;
      
      if (sId === "admin" || sId === "0" || !sId) {
        // Fallback to first active store
        let defaultStore = await Store.findOne({ status: true });
        if (!defaultStore) {
          defaultStore = await Store.create({
            name: "Main Store",
            email: "contact@mainstore.com",
            phone: "+1234567890",
            address: "Main Center",
            status: true,
            city: "Main City",
            latitude: 23.8,
            longitude: 90.3,
            zone: {
              type: "Polygon",
              coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
            }
          });
        }
        actualStoreId = defaultStore._id.toString();
      } else {
        try {
          const store = await Store.findById(sId);
          if (store) {
            commissionRate = store.commissionRate || 0;
            actualStoreId = store._id.toString();
          } else {
            // fallback if not found
            let defaultStore = await Store.findOne({ status: true });
            if (defaultStore) actualStoreId = defaultStore._id.toString();
          }
        } catch (e) {
          // invalid ObjectId, fallback to global
          let defaultStore = await Store.findOne({ status: true });
          if (defaultStore) actualStoreId = defaultStore._id.toString();
        }
      }

      const calculatedCommission = (groupSubtotal * commissionRate) / 100;
      
      // Apply the delivery charge and discount ONLY to the first order to avoid double counting
      const effectiveDiscount = Number(discountAmount) || Number(couponDiscount) || 0;
      const groupDeliveryCharge = i === 0 ? (Number(deliveryCharge) || 0) : 0;
      const groupDiscount = i === 0 ? effectiveDiscount : 0;
      const groupCouponCode = i === 0 ? couponCode : undefined;
      
      // Simple tax split proportional to subtotal (or just apply to all if it's a fixed rate)
      const groupTax = taxAmount ? (taxAmount * (groupSubtotal / (subtotal || 1))) : 0;
      
      const groupTotal = Math.max(0, groupSubtotal + groupTax + groupDeliveryCharge - groupDiscount);
      
      const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

      const newOrder = new Order({
        orderSerialNo: generateOrderSerial(),
        userId: userId || null,
        customerName: resolvedCustomerName,
        customerEmail: resolvedCustomerEmail,
        customerPhone: resolvedCustomerPhone,
        orderType,
        storeId: actualStoreId,
        items: groupItems,
        subtotal: groupSubtotal,
        taxAmount: groupTax,
        discountAmount: groupDiscount,
        deliveryCharge: groupDeliveryCharge,
        commissionAmount: calculatedCommission,
        deliveryPin: orderType === "delivery" ? deliveryPin : undefined,
        totalAmount: groupTotal,
        couponCode: groupCouponCode,
        couponDiscount: groupDiscount,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
        deliveryTimeSlot,
        paymentMethod: paymentMethod || (isPos ? "cash" : "cash_on_delivery"),
        paymentStatus: (isPos || paymentMethod === "wallet") ? "paid" : (body.paymentStatus || "unpaid"),
        paymentReference: body.paymentReference || undefined,
        posReceivedAmount: body.posReceivedAmount ? Number(body.posReceivedAmount) : undefined,
        posChangeAmount: body.posChangeAmount ? Number(body.posChangeAmount) : undefined,
        orderStatus: isPos ? "accepted" : "pending",
        statusTimeline: [
          { status: isPos ? "accepted" : "pending", timestamp: new Date(), note: isPos ? "POS Order placed" : "Order placed by customer" }
        ],
        notes,
        isPos: !!isPos
      });

      const savedOrder = await newOrder.save();
      createdOrders.push(savedOrder);
    }
    if (userId && paymentMethod === "wallet" && userDoc) {
      await User.findByIdAndUpdate(userId, {
        $inc: { walletBalance: -totalAmount }
      });
    }

    if (couponCode) {
      const userIdentifiersToPush: string[] = [];
      if (userId) userIdentifiersToPush.push(String(userId));
      if (resolvedCustomerEmail) userIdentifiersToPush.push(String(resolvedCustomerEmail).toLowerCase().trim());
      if (resolvedCustomerPhone) {
        const cleanP = String(resolvedCustomerPhone).replace(/\D/g, "");
        if (cleanP.length >= 7) userIdentifiersToPush.push(cleanP.slice(-10));
      }

      await Coupon.findOneAndUpdate(
        { code: String(couponCode).toUpperCase() },
        {
          $inc: { usedCount: 1 },
          $addToSet: { usedBy: { $each: userIdentifiersToPush } },
        }
      );
    }

    // --- Dispatch Push Notifications ---
    try {
      const orderIdsString = createdOrders.map(o => o.orderSerialNo).join(", ");
      const notificationTitle = `New Order Placed: #${orderIdsString}`;
      const notificationBody = `Customer ${resolvedCustomerName} has placed a new order for ${formatPrice(totalAmount)}.`;
      
      // 1. Notify all Admins
      const admins = await User.find({ role: "admin", deviceToken: { $exists: true, $ne: "" } });
      for (const admin of admins) {
        if (admin.deviceToken) {
          sendPushNotification(admin.deviceToken, notificationTitle, notificationBody).catch(console.error);
        }
      }

      // 2. Notify the Store Managers
      const uniqueStoreIds = Array.from(new Set(createdOrders.map(o => o.storeId?.toString()).filter(Boolean)));
      for (const sId of uniqueStoreIds) {
        if (sId !== "0" && sId !== "admin") {
          const store = await Store.findById(sId);
          if (store && store.email) {
            const manager = await User.findOne({ email: store.email, role: "store_manager", deviceToken: { $exists: true, $ne: "" } });
            if (manager && manager.deviceToken) {
              sendPushNotification(manager.deviceToken, notificationTitle, notificationBody).catch(console.error);
            }
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to send order creation push notifications:", notifErr);
    }
    
    // --- WhatsApp Notification via sidecar service ---
    try {
      const rawUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
      const waServiceUrl = rawUrl.replace(/\/+$/, "");
      const waSecret = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";
      const whatsappPromises: Promise<any>[] = [];

      const Setting = (await import("@/models/Setting")).default;
      const adminPhoneSetting = await Setting.findOne({
        key: { $in: ["admin_notification_whatsapp_number", "wa_admin_notification_phone", "company_phone"] }
      });
      const adminTargetPhone = adminPhoneSetting?.payload ? String(adminPhoneSetting.payload).trim() : null;
      
      for (const order of createdOrders) {
        const phone = order.customerPhone || resolvedCustomerPhone;

        // 1. Notify Customer on WhatsApp
        if (phone && phone !== "N/A" && phone.trim() !== "") {
          console.log(`[WhatsApp Dispatch] Sending initial receipt to ${phone} via ${waServiceUrl}/send`);
          whatsappPromises.push(
            fetch(`${waServiceUrl}/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-secret": waSecret,
              },
              body: JSON.stringify({
                phone: phone,
                orderSerialNo: order.orderSerialNo,
                orderStatus: "pending",
                customerName: order.customerName || resolvedCustomerName,
                totalAmount: order.totalAmount,
              }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.status) console.log(`✅ Initial WhatsApp sent to ${phone} for order ${order.orderSerialNo}`);
                else console.warn(`⚠️  Initial WhatsApp response: ${JSON.stringify(d)}`);
              })
              .catch((e) => console.error(`❌ Initial WhatsApp error:`, e.message))
          );
        } else {
          console.warn(`⚠️ Skipping WhatsApp notification: customer phone is missing or "N/A" (order: ${order.orderSerialNo})`);
        }

        // 2. Notify Admin on WhatsApp (Custom order notification with full details)
        if (adminTargetPhone && adminTargetPhone.length >= 7) {
          const appOrigin = process.env.NEXT_PUBLIC_APP_URL || "https://nectar-groceries.vercel.app";
          const adminAlertText = buildCustomAdminOrderNotification(order, appOrigin, phone || resolvedCustomerPhone);

          console.log(`[Admin Alert Dispatch] Sending custom new order alert to Admin (${adminTargetPhone}) for #${order.orderSerialNo}`);
          whatsappPromises.push(
            fetch(`${waServiceUrl}/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-secret": waSecret,
              },
              body: JSON.stringify({
                phone: adminTargetPhone,
                message: adminAlertText,
              }),
            })
              .then((r) => r.json())
              .then((d) => {
                if (d.status) console.log(`✅ Admin WhatsApp alert delivered to ${adminTargetPhone} for #${order.orderSerialNo}`);
                else console.warn(`⚠️ Admin WhatsApp alert response: ${JSON.stringify(d)}`);
              })
              .catch((e) => console.error(`❌ Admin WhatsApp alert error:`, e.message))
          );
        }
      }
      // Await all WhatsApp messages so Vercel Serverless doesn't kill the thread early
      await Promise.all(whatsappPromises);
    } catch (waErr) {
      console.error("Failed to trigger WhatsApp on creation:", waErr);
    }
    // -----------------------------------

    return NextResponse.json({ 
      status: true, 
      message: "Order placed successfully", 
      orderId: createdOrders[0]._id, // Return first orderId for tracking/redirect
      orderSerialNo: createdOrders.map(o => o.orderSerialNo).join(", "),
      allOrderIds: createdOrders.map(o => o._id)
    }, { status: 201 });

  } catch (error: any) {
    console.error("Order Checkout Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

// Format price helper for notifications
function formatPrice(amount: number | string | undefined | null) {
  const num = typeof amount === "string" ? parseFloat(amount) : Number(amount || 0);
  return `₦${(isNaN(num) ? 0 : num).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// ── Custom Rich Admin Order Notification Generator ─────────────────────────────
function buildCustomAdminOrderNotification(order: any, appOrigin: string, fallbackPhone?: string) {
  const customerName = order.customerName || "Customer";
  const customerPhone = order.customerPhone || fallbackPhone || "N/A";
  const customerEmail = order.customerEmail || "N/A";

  const items = Array.isArray(order.items) ? order.items : [];
  const totalItemQuantity = items.reduce((sum: number, i: any) => sum + (Number(i.quantity) || 1), 0);

  const itemsText = items.length > 0
    ? items.map((item: any, idx: number) => {
        const itemQty = item.quantity || 1;
        const itemTotal = item.itemTotal
          ? ` (${formatPrice(item.itemTotal)})`
          : item.price
          ? ` (${formatPrice(item.price * itemQty)})`
          : "";
        const itemVar = item.itemVariation ? ` [${item.itemVariation}]` : "";
        return `${idx + 1}. *${item.name}*${itemVar} x${itemQty}${itemTotal}`;
      }).join("\n")
    : "• Standard Grocery Basket";

  const subtotal = Number(order.subtotal || 0);
  const deliveryCharge = Number(order.deliveryCharge || 0);
  const discount = Number(order.discount || order.discountAmount || order.couponDiscount || 0);
  const total = Number(order.totalAmount || 0);

  const formattedPaymentMethod = (() => {
    switch (order.paymentMethod) {
      case "bank_transfer": return "🏦 Bank Transfer";
      case "paystack": return "💳 Paystack (Online)";
      case "cash_on_delivery": return "💵 Cash on Delivery";
      case "wallet": return "👛 Wallet Balance";
      default: return String(order.paymentMethod || "Bank Transfer").toUpperCase();
    }
  })();

  const paymentStatusBadge = order.paymentStatus === "paid" ? "✅ PAID" : "⏳ UNPAID / PENDING";
  const orderType = order.orderType === "takeaway" ? "🛍️ Takeaway / Pickup" : "🚚 Home Delivery";
  const deliveryAddress = order.deliveryAddress?.address || "Pickup at Store";
  const timeSlot = order.deliveryTimeSlot ? `\n• *Delivery Slot:* ${order.deliveryTimeSlot}` : "";
  const notesText = order.notes && order.notes.trim() ? `\n📝 *Customer Note:* _"${order.notes.trim()}"_` : "";

  const dateStr = new Date().toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    `🚨 *NEW ORDER RECEIVED!* 🛒✨\n` +
    `━━━━━━━━━━━━━━━━━━━━━\n` +
    `📋 *Order ID:* #${order.orderSerialNo}\n` +
    `📅 *Date:* ${dateStr}\n\n` +
    `👤 *CUSTOMER INFORMATION*\n` +
    `• *Name:* ${customerName}\n` +
    `• *Phone:* ${customerPhone}\n` +
    `• *Email:* ${customerEmail}\n\n` +
    `🛍️ *ORDERED ITEMS (${totalItemQuantity} item${totalItemQuantity === 1 ? "" : "s"})*\n` +
    `${itemsText}\n\n` +
    `💰 *BILLING & SUMMARY*\n` +
    `• *Subtotal:* ${formatPrice(subtotal)}\n` +
    `• *Delivery Fee:* ${formatPrice(deliveryCharge)}\n` +
    (discount > 0 ? `• *Discount Applied:* -${formatPrice(discount)}\n` : "") +
    `• *TOTAL PAYABLE:* *${formatPrice(total)}*\n\n` +
    `💳 *PAYMENT & FULFILLMENT*\n` +
    `• *Payment Method:* ${formattedPaymentMethod}\n` +
    `• *Payment Status:* ${paymentStatusBadge}\n` +
    `• *Order Type:* ${orderType}\n` +
    `• *Delivery Address:* ${deliveryAddress}` +
    timeSlot +
    notesText +
    `\n\n━━━━━━━━━━━━━━━━━━━━━\n` +
    `👉 *Open Admin Dashboard to Manage:*\n` +
    `${appOrigin}/admin/orders`
  );
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    
    const userId = await getUserFromToken(req);
    if (!userId) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }

    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    
    return NextResponse.json({ status: true, data: orders });
  } catch (error: any) {
    console.error("Order Fetch Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
