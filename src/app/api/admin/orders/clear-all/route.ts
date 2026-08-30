import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";

export async function DELETE(req: Request) {
  try {
    await dbConnect();

    // Delete all orders
    const result = await Order.deleteMany({});

    return NextResponse.json({
      status: true,
      message: `Successfully cleared all ${result.deletedCount} orders. Your store order history is now reset.`,
      deletedCount: result.deletedCount,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Failed to clear orders" },
      { status: 500 }
    );
  }
}
