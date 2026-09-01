import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const body = await req.json();
    const amount = Number(body.amount);

    if (isNaN(amount) || amount === 0) {
      return NextResponse.json({ status: false, message: "Invalid amount" }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ status: false, message: "Customer not found" }, { status: 404 });
    }

    const currentBal = Number(user.walletBalance || 0);
    const newBal = Math.max(0, currentBal + amount);
    user.walletBalance = newBal;
    await user.save();

    return NextResponse.json({ 
      status: true, 
      message: amount > 0 
        ? `Added ₦${amount.toLocaleString()} to ${user.name}'s wallet` 
        : `Deducted ₦${Math.abs(amount).toLocaleString()} from ${user.name}'s wallet`, 
      newBalance: user.walletBalance,
      data: user 
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
