import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const resolvedParams = await params;
    const body = await req.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount === 0) {
      return NextResponse.json({ status: false, message: "Invalid amount" }, { status: 400 });
    }

    const user = await User.findById(resolvedParams.id);
    if (!user || user.role !== "customer") {
      return NextResponse.json({ status: false, message: "Customer not found" }, { status: 404 });
    }

    user.walletBalance = (user.walletBalance || 0) + amount;
    
    // Prevent negative balance
    if (user.walletBalance < 0) {
      user.walletBalance = 0;
    }

    await user.save();

    return NextResponse.json({ 
      status: true, 
      message: amount > 0 ? "Credit added successfully" : "Credit deducted successfully", 
      data: user 
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
