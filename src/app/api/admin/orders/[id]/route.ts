import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import Order from "@/models/Order";

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const body = await req.json();

    const order = await Order.findByIdAndUpdate(params.id, body, {
      new: true,
      runValidators: true,
    });

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
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    const order = await Order.findByIdAndDelete(params.id);

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
