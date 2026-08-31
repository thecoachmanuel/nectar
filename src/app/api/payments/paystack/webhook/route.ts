import { NextResponse } from "next/server";
import crypto from "crypto";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import PaymentGateway from "@/models/PaymentGateway";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // 1. Read raw body as text for HMAC computation
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    if (!signature) {
      return NextResponse.json(
        { status: false, message: "Missing x-paystack-signature header" },
        { status: 400 }
      );
    }

    // 2. Fetch Paystack Secret Key from PaymentGateway or Environment
    const paystackGateway = await PaymentGateway.findOne({ slug: "paystack" });
    let secretKey = process.env.PAYSTACK_SECRET_KEY || "";

    if (paystackGateway && paystackGateway.options) {
      const secretOption = paystackGateway.options.find(
        (opt: any) => opt.option === "paystack_secret_key"
      );
      if (secretOption && secretOption.value) {
        secretKey = secretOption.value;
      }
    }

    if (!secretKey) {
      console.error("Paystack secret key is not configured");
      return NextResponse.json(
        { status: false, message: "Payment gateway secret not configured" },
        { status: 500 }
      );
    }

    // 3. Compute HMAC SHA-512 hash and verify signature
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      console.warn("⚠️ Invalid Paystack webhook HMAC signature received");
      return NextResponse.json(
        { status: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    // 4. Parse verified payload
    const event = JSON.parse(rawBody);

    if (event.event === "charge.success") {
      const data = event.data;
      const reference = data.reference;
      const metadata = data.metadata || {};

      console.log(`✅ Verified Paystack webhook for reference: ${reference}`);

      // Case A: Regular Store Order Payment
      const targetOrderId = metadata.orderId || metadata.order_id;
      let order = null;

      if (targetOrderId) {
        order = await Order.findById(targetOrderId);
      }
      if (!order && reference) {
        order = await Order.findOne({
          $or: [
            { paymentReference: reference },
            { orderSerialNo: reference },
          ],
        });
      }

      if (order) {
        if (order.paymentStatus !== "paid") {
          order.paymentStatus = "paid";
          order.paymentMethod = "paystack";
          order.paymentReference = reference;
          order.statusTimeline.push({
            status: "paid",
            timestamp: new Date(),
            note: `Payment verified via Paystack Webhook (Ref: ${reference})`,
          });
          await order.save();
          console.log(`📦 Order #${order.orderSerialNo} marked as PAID via Paystack webhook.`);

          // Dispatch confirmation WhatsApp message to customer
          const customerPhone = order.customerPhone;
          if (customerPhone && customerPhone !== "N/A") {
            const rawUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
            const waServiceUrl = rawUrl.replace(/\/+$/, "");
            const waSecret = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";

            fetch(`${waServiceUrl}/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-secret": waSecret,
              },
              body: JSON.stringify({
                phone: customerPhone,
                message:
                  `✅ *Payment Confirmed!* 💳✨\n\n` +
                  `We have verified your payment of *₦${Number(order.totalAmount || 0).toLocaleString()}* for Order *#${order.orderSerialNo}* (Ref: ${reference}).\n\n` +
                  `Our store team is now preparing your fresh groceries for delivery! 🥦🚚`,
              }),
            }).catch(() => {});
          }
        }
      }

      // Case B: Wallet Funding Payment
      if (metadata.isWalletFunding && metadata.userId) {
        const amount = Number(data.amount) / 100; // Paystack returns amount in kobo
        await User.findByIdAndUpdate(metadata.userId, {
          $inc: { walletBalance: amount },
        });
        console.log(`💰 User ${metadata.userId} wallet credited with ₦${amount.toLocaleString()} via webhook.`);
      }
    }

    return NextResponse.json({ status: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Paystack webhook processing error:", error);
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
