import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import Store from "@/models/Store";
import { sendSMS } from "@/lib/sms";
import { sendPushNotification } from "@/lib/push";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    let order = await Order.findById(id).lean();
    if (!order) {
      order = await Order.findOne({ orderSerialNo: id }).lean();
    }

    if (!order) {
      return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });
    }

    // Populate Store info if applicable
    let storeInfo = null;
    if (order.storeId && String(order.storeId) !== "0" && String(order.storeId) !== "admin") {
      try {
        storeInfo = await Store.findById(order.storeId).select("name email phone address latitude longitude profileImage").lean();
      } catch (e) {}
    }

    // Populate Delivery Agent info if applicable
    let deliveryAgent = null;
    if (order.deliveryBoyId) {
      try {
        deliveryAgent = await User.findById(order.deliveryBoyId).select("name phone email image role").lean();
      } catch (e) {}
    }

    return NextResponse.json({
      status: true,
      data: {
        ...order,
        storeInfo,
        deliveryAgent,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    const body = await req.json();

    const oldOrder = await Order.findById(id);
    if (!oldOrder) {
      return NextResponse.json({ status: false, message: "Order not found" }, { status: 404 });
    }

    const order = await Order.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    });

    if (!order) {
      return NextResponse.json(
        { status: false, message: "Order not found" },
        { status: 404 }
      );
    }

    if (body.orderStatus && oldOrder.orderStatus !== body.orderStatus) {
      // Order status has changed! Dispatch notifications.
      try {
        const user = await User.findById(order.userId);
        const messageBody = `Hi ${user?.name || order.customerName}, your order #${order.orderSerialNo} status is now: ${body.orderStatus.replace("_", " ")}.`;

        if (user?.phone) {
          sendSMS(user.phone, messageBody).catch(console.error);
        }
        if (user?.deviceToken) {
          sendPushNotification(
            user.deviceToken,
            "Order Status Updated",
            messageBody,
            { orderId: order.orderSerialNo }
          ).catch(console.error);
        }

        // ── WhatsApp Notification via sidecar service ──────────────────────
        const rawUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
        const waServiceUrl = rawUrl.replace(/\/+$/, "");
        const waSecret = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";
        const customerPhone = order.customerPhone || user?.phone;

        if (customerPhone && customerPhone !== "N/A" && customerPhone.trim() !== "") {
          console.log(`[Admin WhatsApp Dispatch] Sending status (${body.orderStatus}) to ${customerPhone} via ${waServiceUrl}/send`);
          await fetch(`${waServiceUrl}/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-secret": waSecret,
            },
            body: JSON.stringify({
              phone: customerPhone,
              orderSerialNo: order.orderSerialNo,
              orderStatus: body.orderStatus,
              customerName: order.customerName || user?.name,
              totalAmount: order.totalAmount,
            }),
          })
            .then((r) => r.json())
            .then((d) => {
              if (d.status) console.log(`✅ WhatsApp sent to ${customerPhone} for order ${order.orderSerialNo}`);
              else console.warn(`⚠️  WhatsApp not sent: ${JSON.stringify(d)}`);
            })
            .catch((err) =>
              console.warn("⚠️  WhatsApp service unreachable (is it running?):", err.message)
            );
        } else {
          console.warn(`⚠️ Skipping WhatsApp status update: customer phone is missing or "N/A"`);
        }
        // ───────────────────────────────────────────────────────────────────
      } catch (err) {
        console.error("Failed to send order notifications", err);
      }
    }

    // ── Payment Status Change Notification ───────────────────────────────
    if (body.paymentStatus && oldOrder.paymentStatus !== body.paymentStatus) {
      try {
        const rawUrl = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
        const waServiceUrl = rawUrl.replace(/\/+$/, "");
        const waSecret = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";
        const user = await User.findById(order.userId);
        const customerPhone = order.customerPhone || user?.phone;

        if (customerPhone && customerPhone !== "N/A" && customerPhone.trim() !== "") {
          let paymentMessage = "";
          if (body.paymentStatus === "paid") {
            const formattedTotal = Number(order.totalAmount || 0).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            });
            paymentMessage = `✅ *Payment Confirmed!*\n\nHi ${order.customerName || "Customer"}, your payment of *₦${formattedTotal}* for order *#${order.orderSerialNo}* has been verified by our team!\n\nWe are preparing your fresh groceries for delivery. 🥑📦`;
          } else if (body.paymentStatus === "unpaid") {
            paymentMessage = `⚠️ *Payment Status Update*\n\nHi ${order.customerName || "Customer"}, payment status for order *#${order.orderSerialNo}* has been updated to *Unpaid*. Please contact support if you need assistance.`;
          }

          if (paymentMessage) {
            await fetch(`${waServiceUrl}/send`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-api-secret": waSecret,
              },
              body: JSON.stringify({
                phone: customerPhone,
                message: paymentMessage,
              }),
            }).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Failed to send payment status notification", err);
      }
    }

    if (body.orderStatus === "delivered") {
      try {
        if (order.deliveryBoyId) {
          await User.findByIdAndUpdate(order.deliveryBoyId, {
            $inc: { walletBalance: order.deliveryCharge || 0 }
          });
        }
        if (order.storeId && String(order.storeId) !== "0") {
          const storeEarnings = (order.totalAmount || 0) - (order.commissionAmount || 0) - (order.deliveryCharge || 0);
          await Store.findByIdAndUpdate(order.storeId, {
            $inc: { walletBalance: storeEarnings }
          });
        }
      } catch (walletErr) {
        console.error("Failed to update wallet balances", walletErr);
      }
    }

    return NextResponse.json({
      status: true,
      message: "Order updated successfully",
      data: order,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await dbConnect();
    
    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json(
        { status: false, message: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      status: true,
      message: "Order deleted successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
