import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import User from "@/models/User";
import PayoutRequest from "@/models/PayoutRequest";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await dbConnect();

    // 1. Fetch all non-canceled orders
    const allOrders = await Order.find({
      orderStatus: { $ne: "canceled" },
    });

    // Paid orders (either paymentStatus === 'paid' or marked as delivered)
    const paidOrders = allOrders.filter(
      (o) => o.paymentStatus === "paid" || o.orderStatus === "delivered"
    );

    // Delivered orders
    const deliveredOrders = allOrders.filter((o) => o.orderStatus === "delivered");

    // Pending / In-progress orders (not yet paid or delivered)
    const pendingOrders = allOrders.filter(
      (o) => o.paymentStatus !== "paid" && o.orderStatus !== "delivered"
    );

    const grossRevenue = paidOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const deliveredOrdersTotal = deliveredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const pendingRevenue = pendingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalDeliveryCharges = paidOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);
    const totalCommissions = paidOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);

    // 2. Fetch Payouts
    const allPayouts = await PayoutRequest.find({ status: "approved" });
    const storePayoutsTotal = allPayouts
      .filter((p) => p.userRole === "store_manager")
      .reduce((sum, p) => sum + (p.amount || 0), 0);
    const deliveryPayoutsTotal = allPayouts
      .filter((p) => p.userRole === "delivery_boy")
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    // 3. Store Breakdown
    const stores = await Store.find();
    const storeBreakdown = stores.map((store) => {
      const storePaid = allPayouts
        .filter(
          (p) =>
            p.userRole === "store_manager" &&
            String(p.userId) === String(store._id)
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        id: store._id,
        name: store.name,
        walletBalance: store.walletBalance || 0,
        totalPaid: storePaid,
      };
    });

    // 4. Delivery Boy Breakdown
    const deliveryBoys = await User.find({ role: "delivery_boy" });
    const deliveryBoyBreakdown = deliveryBoys.map((boy) => {
      const boyPaid = allPayouts
        .filter(
          (p) =>
            p.userRole === "delivery_boy" && String(p.userId) === String(boy._id)
        )
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      return {
        id: boy._id,
        name: boy.name,
        email: boy.email,
        walletBalance: boy.walletBalance || 0,
        totalPaid: boyPaid,
      };
    });

    return NextResponse.json({
      status: true,
      data: {
        overview: {
          grossRevenue,
          deliveredOrdersTotal,
          pendingRevenue,
          totalCommissions,
          totalDeliveryCharges,
          storePayoutsTotal,
          deliveryPayoutsTotal,
          totalOrdersCount: allOrders.length,
          paidOrdersCount: paidOrders.length,
          deliveredOrdersCount: deliveredOrders.length,
          pendingOrdersCount: pendingOrders.length,
        },
        stores: storeBreakdown,
        deliveryBoys: deliveryBoyBreakdown,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
