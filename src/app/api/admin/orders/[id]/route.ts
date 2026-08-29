import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import User from "@/models/User";
import Store from "@/models/Store";
import { sendSMS } from "@/lib/sms";
import { sendPushNotification } from "@/lib/push";

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

    if (order && body.orderStatus && oldOrder.orderStatus !== body.orderStatus) {
      // Order status has changed! Dispatch notifications.
      try {
        const user = await User.findById(order.userId);
        if (user) {
          const messageBody = `Hi ${user.name}, your order #${order.orderSerialNo} status is now: ${body.orderStatus.replace("_", " ")}.`;
          
          if (user.phone) {
            sendSMS(user.phone, messageBody).catch(console.error);
          }
          if (user.deviceToken) {
            sendPushNotification(
              user.deviceToken,
              "Order Status Updated",
              messageBody,
              { orderId: order.orderSerialNo }
            ).catch(console.error);
          }
        }
      } catch (err) {
        console.error("Failed to send order notifications", err);
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
    }

    if (!order) {
      return NextResponse.json(
        { status: false, message: "Order not found" },
        { status: 404 }
      );
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
