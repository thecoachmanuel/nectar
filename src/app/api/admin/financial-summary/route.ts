import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";
import Store from "@/models/Store";
import User from "@/models/User";
import PayoutRequest from "@/models/PayoutRequest";

export async function GET() {
  try {
    await dbConnect();

    // 1. Gross Revenue (Delivered Orders)
    const allOrders = await Order.find({ 
      orderStatus: { $in: ["delivered", "completed"] }
    });
    
    const grossRevenue = allOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const totalCommissions = allOrders.reduce((sum, o) => sum + (o.commissionAmount || 0), 0);
    const totalDeliveryCharges = allOrders.reduce((sum, o) => sum + (o.deliveryCharge || 0), 0);

    // 2. Fetch Payouts
    const allPayouts = await PayoutRequest.find({ status: "approved" });
    const storePayoutsTotal = allPayouts
      .filter(p => p.userRole === "store_manager")
      .reduce((sum, p) => sum + p.amount, 0);
    const deliveryPayoutsTotal = allPayouts
      .filter(p => p.userRole === "delivery_boy")
      .reduce((sum, p) => sum + p.amount, 0);

    // 3. Store Breakdown
    const stores = await Store.find();
    const storeBreakdown = stores.map(store => {
      const storePaid = allPayouts
        .filter(p => p.userRole === "store_manager" && String(p.userId) === String(store._id))
        .reduce((sum, p) => sum + p.amount, 0);
      
      return {
        id: store._id,
        name: store.name,
        walletBalance: store.walletBalance || 0,
        totalPaid: storePaid
      };
    });

    // 4. Delivery Boy Breakdown
    const deliveryBoys = await User.find({ role: "delivery_boy" });
    const deliveryBoyBreakdown = deliveryBoys.map(boy => {
      const boyPaid = allPayouts
        .filter(p => p.userRole === "delivery_boy" && String(p.userId) === String(boy._id))
        .reduce((sum, p) => sum + p.amount, 0);
      
      return {
        id: boy._id,
        name: boy.name,
        email: boy.email,
        walletBalance: boy.walletBalance || 0,
        totalPaid: boyPaid
      };
    });

    return NextResponse.json({
      status: true,
      data: {
        overview: {
          grossRevenue,
          totalCommissions,
          totalDeliveryCharges,
          storePayoutsTotal,
          deliveryPayoutsTotal,
        },
        stores: storeBreakdown,
        deliveryBoys: deliveryBoyBreakdown
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
