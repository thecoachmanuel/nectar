import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PayoutRequest from "@/models/PayoutRequest";
import User from "@/models/User";
import Store from "@/models/Store";

export async function POST(req: Request) {
  try {
    await dbConnect();

    // In a real application, you'd extract admin role from headers or JWT here
    const { userId, userRole, amount, paymentMethod, notes } = await req.json();

    if (!userId || !userRole || !amount || amount <= 0) {
      return NextResponse.json(
        { status: false, message: "Invalid payout parameters provided." },
        { status: 400 }
      );
    }

    // Determine which collection to update
    const isStore = userRole === "store_manager";
    const ModelToUpdate = isStore ? Store : User;

    const account = await ModelToUpdate.findById(userId);

    if (!account) {
      return NextResponse.json(
        { status: false, message: "Account not found." },
        { status: 404 }
      );
    }

    if ((account.walletBalance || 0) < amount) {
      return NextResponse.json(
        { status: false, message: "Insufficient wallet balance to pay this amount." },
        { status: 400 }
      );
    }

    // Create the approved payout
    const payout = await PayoutRequest.create({
      userId,
      userRole,
      amount,
      paymentMethod: paymentMethod || "manual",
      status: "approved",
      notes: notes || "Initiated by admin",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Deduct from wallet balance
    await ModelToUpdate.findByIdAndUpdate(userId, {
      $inc: { walletBalance: -amount }
    });

    return NextResponse.json({
      status: true,
      message: "Payout successfully recorded.",
      data: payout
    });

  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
