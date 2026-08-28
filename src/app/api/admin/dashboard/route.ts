import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import Order from "@/models/Order";
import User from "@/models/User";
import Item from "@/models/Item";

export async function GET() {
  try {
    await connectToDatabase();

    const [
      totalOrders,
      totalCustomers,
      totalItems,
      orders,
      topCustomersData
    ] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments({ role: "customer" }),
      Item.countDocuments(),
      Order.find({}),
      Order.aggregate([
        { $group: { _id: "$customerEmail", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);

    const totalSales = orders.reduce((sum, order: any) => sum + (order.subtotal || 0) + (order.taxAmount || 0) + (order.deliveryCharge || 0) - (order.discount || order.couponDiscount || 0), 0);

    const orderStats = {
      pending: orders.filter(o => (o as any).status === "pending").length,
      accept: orders.filter(o => (o as any).status === "accept").length,
      preparing: orders.filter(o => (o as any).status === "preparing").length,
      prepared: orders.filter(o => (o as any).status === "prepared").length,
      out_for_delivery: orders.filter(o => (o as any).status === "out_for_delivery").length,
      delivered: orders.filter(o => (o as any).status === "delivered").length,
      canceled: orders.filter(o => (o as any).status === "canceled").length,
      returned: orders.filter(o => (o as any).status === "returned").length,
      rejected: orders.filter(o => (o as any).status === "rejected").length,
    };

    return NextResponse.json({
      status: true,
      data: {
        totalOrders,
        totalSales,
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
