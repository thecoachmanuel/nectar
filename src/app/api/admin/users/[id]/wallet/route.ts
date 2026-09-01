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
    const { action, amount } = body; // action: "add" | "deduct" | "set"
    const parsedAmount = Number(amount);

    if (isNaN(parsedAmount) || parsedAmount < 0) {
      return NextResponse.json({ status: false, message: "Invalid amount" }, { status: 400 });
    }

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });
    }

    const currentBal = Number(user.walletBalance || 0);
    let newBal = currentBal;

    if (action === "add") {
      newBal = currentBal + parsedAmount;
    } else if (action === "deduct") {
      newBal = Math.max(0, currentBal - parsedAmount);
    } else if (action === "set") {
      newBal = parsedAmount;
    } else {
      // Default fallback: if signed amount
      newBal = Math.max(0, currentBal + parsedAmount);
    }

    user.walletBalance = newBal;
    await user.save();

    return NextResponse.json({
      status: true,
      message: action === "deduct" 
        ? `Deducted ₦${parsedAmount.toLocaleString()} from ${user.name}'s wallet`
        : `Added ₦${parsedAmount.toLocaleString()} to ${user.name}'s wallet`,
      newBalance: user.walletBalance,
      data: user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message || "Failed to update wallet balance" },
      { status: 500 }
    );
  }
}
