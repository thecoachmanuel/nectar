import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import { getPaystackConfig } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { reference, orderId } = body;

    if (!reference) {
      return NextResponse.json({ status: false, message: "Reference is required" }, { status: 400 });
    }

    // Get Paystack secret key (Admin settings override env, fallback to env)
    const { secretKey } = await getPaystackConfig();

    if (!secretKey) {
      return NextResponse.json(
        { status: false, message: "Paystack secret key is not configured in settings or environment." },
        { status: 500 }
      );
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
      },
    });

    const data = await res.json();

    if (data.status && data.data.status === "success") {
      const targetOrderId = orderId || data.data.metadata?.orderId;
      if (targetOrderId) {
        const order = await Order.findById(targetOrderId);
        if (order) {
          order.paymentStatus = "paid";
          order.paymentMethod = "paystack";
          order.paymentReference = reference;
          order.statusTimeline.push({
            status: "paid",
            timestamp: new Date(),
            note: `Payment verified via Paystack ref: ${reference}`,
          });
          await order.save();
        }
      }

      return NextResponse.json({
        status: true,
        message: "Payment verified successfully",
        data: data.data,
      });
    } else {
      return NextResponse.json(
        { status: false, message: data.message || "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Paystack Verify Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
