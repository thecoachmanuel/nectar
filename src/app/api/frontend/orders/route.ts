import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "foodappi_secret_key_default_2026"
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
      storeId,
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
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ status: false, message: "Cart is empty" }, { status: 400 });
    }
    
    if (!storeId) {
      return NextResponse.json({ status: false, message: "Store selection is required" }, { status: 400 });
    }

    // Fetch the Store to get the commission rate
    const Store = (await import("@/models/Store")).default;
    const store = await Store.findById(storeId);
    if (!store) {
      return NextResponse.json({ status: false, message: "Invalid store selected" }, { status: 400 });
    }

    if (orderType === "delivery" && !deliveryAddress) {
      return NextResponse.json({ status: false, message: "Delivery address is required" }, { status: 400 });
    }

    const deliveryPin = Math.floor(1000 + Math.random() * 9000).toString();
    const calculatedCommission = ((subtotal || 0) * (store.commissionRate || 0)) / 100;

    const newOrder = new Order({
      orderSerialNo: generateOrderSerial(),
      userId: userId || null,
      customerName: customerName || "Guest",
      customerEmail: customerEmail || "",
      customerPhone: customerPhone || "N/A",
      orderType,
      storeId,
      items,
      subtotal,
      taxAmount: taxAmount || 0,
      discountAmount: discountAmount || 0,
      deliveryCharge: deliveryCharge || 0,
      commissionAmount: calculatedCommission,
      deliveryPin: orderType === "delivery" ? deliveryPin : undefined,
      totalAmount,
      couponCode,
      couponDiscount: couponDiscount || 0,
      deliveryAddress: orderType === "delivery" ? deliveryAddress : undefined,
      deliveryTimeSlot,
      paymentMethod: paymentMethod || "cash_on_delivery",
      paymentStatus: "unpaid",
      orderStatus: "pending",
      statusTimeline: [
        { status: "pending", timestamp: new Date(), note: "Order placed by customer" }
      ],
      notes,
    });

    await newOrder.save();

    return NextResponse.json({ 
      status: true, 
      message: "Order placed successfully", 
      orderId: newOrder._id,
      orderSerialNo: newOrder.orderSerialNo
    }, { status: 201 });

  } catch (error: any) {
    console.error("Order Checkout Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
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
