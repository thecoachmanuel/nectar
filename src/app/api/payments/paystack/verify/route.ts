import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import PaymentGateway from "@/models/PaymentGateway";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { reference, orderId } = body;

    if (!reference) {
      return NextResponse.json({ status: false, message: "Reference is required" }, { status: 400 });
    }

    const paystackGateway = await PaymentGateway.findOne({ slug: "paystack" });
    let secretKey = process.env.PAYSTACK_SECRET_KEY || "";

    if (paystackGateway && paystackGateway.options) {
      const secretOption = paystackGateway.options.find((opt) => opt.option === "paystack_secret_key");
      if (secretOption && secretOption.value) {
        secretKey = secretOption.value;
      }
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
