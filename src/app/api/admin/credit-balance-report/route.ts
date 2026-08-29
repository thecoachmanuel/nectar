import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import User from "@/models/User";

export async function GET(req: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const balanceStatus = searchParams.get("balanceStatus"); // "has_balance" | "zero_balance"

    let query: any = { role: "customer" };

    if (balanceStatus === "has_balance") {
      query.walletBalance = { $gt: 0 };
    } else if (balanceStatus === "zero_balance") {
      query.walletBalance = { $lte: 0 };
    }

    const customers = await User.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ status: true, data: customers });
  } catch (error: any) {
    return NextResponse.json(
      { status: false, message: error.message },
      { status: 500 }
    );
  }
}
