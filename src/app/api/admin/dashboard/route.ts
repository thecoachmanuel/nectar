import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Item from "@/models/Item";
import { jwtVerify } from "jose";
import { cookies } from "next/headers";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function GET() {
  try {
    await connectToDatabase();
    
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    let storeIdFilter: any = {};
    let isStoreManager = false;

    if (token) {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (payload.role === "store_manager" && payload.storeId) {
        storeIdFilter = { storeId: payload.storeId };
        isStoreManager = true;
      }
    }

    const [
      totalOrders,
      totalCustomers,
      totalItems,
      orders,
      topCustomersData
    ] = await Promise.all([
      Order.countDocuments(storeIdFilter),
      User.countDocuments({ role: "customer" }),
      Item.countDocuments(storeIdFilter),
      Order.find(storeIdFilter),
      Order.aggregate([
        { $match: storeIdFilter },
        { $group: { _id: "$customerEmail", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalSales = orders.reduce((sum, order: any) => sum + (order.totalAmount || 0), 0);
    const totalCommission = orders.reduce((sum, order: any) => sum + (order.commissionAmount || 0), 0);
    const totalDeliveryCharges = orders.reduce((sum, order: any) => sum + (order.deliveryCharge || 0), 0);
    const storeManagerEarnings = totalSales - totalCommission - totalDeliveryCharges;

    const orderStats = {
      pending: orders.filter(o => (o as any).orderStatus === "pending").length,
      accept: orders.filter(o => (o as any).orderStatus === "accepted").length,
      preparing: orders.filter(o => (o as any).orderStatus === "preparing").length,
      ready: orders.filter(o => (o as any).orderStatus === "ready").length,
      out_for_delivery: orders.filter(o => (o as any).orderStatus === "out_for_delivery").length,
      delivered: orders.filter(o => (o as any).orderStatus === "delivered").length,
      canceled: orders.filter(o => (o as any).orderStatus === "canceled").length,
      returned: orders.filter(o => (o as any).orderStatus === "returned").length,
      rejected: orders.filter(o => (o as any).orderStatus === "rejected").length,
    };

    return NextResponse.json({
      status: true,
      data: {
        totalOrders,
        totalSales,
        totalCommission,
        totalDeliveryCharges,
        storeManagerEarnings,
        totalCustomers,
        totalItems,
        orderStats,
        topCustomersData
      }
    });

  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
