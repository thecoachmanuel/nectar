import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import Coupon from "@/models/Coupon";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const {
      userId,
      customerName,
      customerEmail,
      customerPhone,
      orderType,
      branchId,
      items,
      deliveryAddress,
      deliveryTimeSlot,
      paymentMethod,
      couponCode,
      notes,
    } = body;

    if (!customerName || !customerPhone || !items || items.length === 0 || !branchId) {
      return NextResponse.json(
        { status: false, message: "Missing required order information" },
        { status: 400 }
      );
    }

    // Compute order subtotal
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const extraTotal = (item.extras || []).reduce((acc: number, e: any) => acc + e.price, 0);
      const addonTotal = (item.addons || []).reduce((acc: number, a: any) => acc + a.price, 0);
      const unitPrice = item.price + extraTotal + addonTotal;
      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;
      return {
        itemId: item.itemId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        variationName: item.variationName || "",
        extras: item.extras || [],
        addons: item.addons || [],
        itemTotal,
      };
    });

    // Check Coupon Discount
    let discountAmount = 0;
    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), status: true });
      if (coupon) {
        if (coupon.discountType === "percentage") {
          discountAmount = (subtotal * coupon.discount) / 100;
          if (coupon.maximumDiscount && discountAmount > coupon.maximumDiscount) {
            discountAmount = coupon.maximumDiscount;
          }
        } else {
          discountAmount = coupon.discount;
        }
        // Increment coupon used count
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    const deliveryCharge = orderType === "delivery" ? 5 : 0;
    const taxAmount = parseFloat(((subtotal * 5) / 100).toFixed(2)); // 5% default tax
    const totalAmount = parseFloat(Math.max(0, subtotal + taxAmount + deliveryCharge - discountAmount).toFixed(2));

    const count = await Order.countDocuments();
    const orderSerialNo = `ORD-${1000 + count + 1}`;

    const newOrder = await Order.create({
      orderSerialNo,
      userId: userId || null,
      customerName,
      customerEmail: customerEmail || "",
      customerPhone,
      orderType: orderType || "delivery",
      branchId,
      items: processedItems,
      subtotal,
      taxAmount,
      discountAmount,
      deliveryCharge,
      totalAmount,
      couponCode: couponCode || "",
      couponDiscount: discountAmount,
      deliveryAddress,
      deliveryTimeSlot: deliveryTimeSlot || "As soon as possible",
      paymentMethod: paymentMethod || "cash_on_delivery",
      paymentStatus: paymentMethod === "cash_on_delivery" ? "unpaid" : "unpaid",
      orderStatus: "pending",
      statusTimeline: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order placed successfully",
        },
      ],
      notes: notes || "",
    });

    return NextResponse.json({
      status: true,
      message: "Order placed successfully",
      data: newOrder,
    });
  } catch (error: any) {
    console.error("Order Creation Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const branchId = searchParams.get("branchId");
    const statusFilter = searchParams.get("status");

    const query: any = {};

    if (userId) query.userId = userId;
    if (branchId && branchId !== "0") query.branchId = branchId;
    if (statusFilter) query.orderStatus = statusFilter;

    const orders = await Order.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ status: true, data: orders });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { orderId, action } = body;

    if (!orderId || action !== "cancel") {
      return NextResponse.json({ status: false, message: "Invalid cancel request" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });
    }

    if (order.orderStatus !== "pending") {
      return NextResponse.json(
        { status: false, message: "Order can only be canceled while in Pending status" },
        { status: 400 }
      );
    }

    order.orderStatus = "canceled";
    order.statusTimeline.push({
      status: "canceled",
      timestamp: new Date(),
      note: "Order canceled by customer",
    });

    await order.save();

    return NextResponse.json({ status: true, message: "Order canceled successfully", data: order });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
