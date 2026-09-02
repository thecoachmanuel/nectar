import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import { getPaystackConfig } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ status: false, message: "Order ID is required" }, { status: 400 });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });
    }

    // Get Paystack secret key (Admin settings override env, fallback to env)
    const { secretKey, isEnabled } = await getPaystackConfig();

    if (!isEnabled) {
      return NextResponse.json(
        { status: false, message: "Paystack payments are currently disabled by administrator." },
        { status: 400 }
      );
    }

    if (!secretKey) {
      return NextResponse.json(
        { status: false, message: "Paystack secret key is not configured in settings or environment." },
        { status: 400 }
      );
    }

    const reference = `ps_${order._id}_${Date.now()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const payload = {
      amount: Math.round(order.totalAmount * 100), // convert to subunit (kobo / cents)
      email: order.customerEmail || "customer@example.com",
      reference: reference,
      callback_url: `${baseUrl}/order/${order._id}?payment=paystack&ref=${reference}`,
      metadata: {
        orderId: order._id.toString(),
        orderSerialNo: order.orderSerialNo,
      },
    };

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.status) {
      // Save reference on order
      order.paymentReference = reference;
      await order.save();

      return NextResponse.json({
        status: true,
        authorizationUrl: data.data.authorization_url,
        reference: reference,
      });
    } else {
      return NextResponse.json(
        { status: false, message: data.message || "Failed to initialize Paystack payment" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Paystack Initialize Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
