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
    
    if (orderType === "delivery" && (deliveryCharge === undefined || deliveryCharge < 0)) {
      return NextResponse.json({ status: false, message: "Your address is out of delivery range." }, { status: 400 });
    }

    if (paymentMethod === "wallet") {
      if (!userId) {
        return NextResponse.json({ status: false, message: "You must be logged in to use Wallet." }, { status: 400 });
      }
      userDoc = await User.findById(userId);
      if (!userDoc || (userDoc.walletBalance || 0) < totalAmount) {
        return NextResponse.json({ status: false, message: "Insufficient wallet balance." }, { status: 400 });
      }
    }

    const Store = (await import("@/models/Store")).default;

    // 1. Group items by storeId
    const storeGroups: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const sId = item.storeId || "admin";
      if (!storeGroups[sId]) storeGroups[sId] = [];
      storeGroups[sId].push(item);
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
      
      // Apply the delivery charge and coupon ONLY to the first order to avoid double counting
      const groupDeliveryCharge = i === 0 ? (deliveryCharge || 0) : 0;
      const groupCouponDiscount = i === 0 ? (couponDiscount || 0) : 0;
      const groupCouponCode = i === 0 ? couponCode : undefined;
      
      // Simple tax split proportional to subtotal (or just apply to all if it's a fixed rate)
      const groupTax = taxAmount ? (taxAmount * (groupSubtotal / (subtotal || 1))) : 0;
      
      const groupTotal = Math.max(0, groupSubtotal + groupTax + groupDeliveryCharge - groupCouponDiscount);
      
      const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();

      const newOrder = new Order({
        orderSerialNo: generateOrderSerial(),
        userId: userId || null,
        customerName: customerName || "Guest",
        customerEmail: customerEmail || "",
        customerPhone: customerPhone || "N/A",
        orderType,
        storeId: actualStoreId,
        items: groupItems,
        subtotal: groupSubtotal,
        taxAmount: groupTax,
        discountAmount: groupCouponDiscount,
        deliveryCharge: groupDeliveryCharge,
        commissionAmount: calculatedCommission,
        deliveryPin: orderType === "delivery" ? deliveryPin : undefined,
        totalAmount: groupTotal,
        couponCode: groupCouponCode,
        couponDiscount: groupCouponDiscount,
        deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
        deliveryTimeSlot,
        paymentMethod: paymentMethod || "cash_on_delivery",
        paymentStatus: paymentMethod === "cash_on_delivery" ? "unpaid" : "paid",
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
      const User = (await import("@/models/User")).default;
      await User.findByIdAndUpdate(userId, {
        $inc: { walletBalance: -totalAmount }
      });
    }

    if (couponCode) {
      await Coupon.findOneAndUpdate(
        { code: couponCode },
        { $inc: { usedCount: 1 } }
      );
    }

    // --- Dispatch Push Notifications ---
    try {
      const orderIdsString = createdOrders.map(o => o.orderSerialNo).join(", ");
      const notificationTitle = `New Order Placed: #${orderIdsString}`;
      const notificationBody = `Customer ${customerName || "Guest"} has placed a new order for ${formatPrice(totalAmount)}.`;
      
      // 1. Notify all Admins
      const admins = await User.find({ role: "admin", deviceToken: { $exists: true, $ne: "" } });
      for (const admin of admins) {
        sendPushNotification(admin.deviceToken, notificationTitle, notificationBody).catch(console.error);
      }

      // 2. Notify the Store Manager
      // If store is global (0), maybe no specific manager, otherwise try to find them
      if (actualStoreId && String(actualStoreId) !== "0") {
        const store = await Store.findById(actualStoreId);
        if (store && store.email) {
          const manager = await User.findOne({ email: store.email, role: "store_manager", deviceToken: { $exists: true, $ne: "" } });
          if (manager) {
            sendPushNotification(manager.deviceToken, notificationTitle, notificationBody).catch(console.error);
          }
        }
      }
    } catch (notifErr) {
      console.error("Failed to send order creation push notifications:", notifErr);
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
function formatPrice(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount || 0);
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
