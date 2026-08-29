import { NextResponse } from "next/server";
import dbConnect from "@/lib/dbConnect";
import PayoutRequest from "@/models/PayoutRequest";
import User from "@/models/User";
import Store from "@/models/Store";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await dbConnect();
    const id = (await params).id;
    const body = await req.json();

    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });

    const { payload } = await jwtVerify(token, JWT_SECRET);
    if (payload.role !== "admin") {
      return NextResponse.json({ status: false, message: "Forbidden" }, { status: 403 });
    }

    const payout = await PayoutRequest.findById(id);
    if (!payout) return NextResponse.json({ status: false, message: "Payout not found" }, { status: 404 });

    // If changing to approved, deduct balance
    if (body.status === "approved" && payout.status !== "approved") {
      if (payout.userRole === "store_manager") {
        await Store.findByIdAndUpdate(payout.userId, {
          $inc: { walletBalance: -payout.amount }
        });
      } else {
        await User.findByIdAndUpdate(payout.userId, {
          $inc: { walletBalance: -payout.amount }
        });
      }
    }

    const updated = await PayoutRequest.findByIdAndUpdate(id, body, { new: true });
    return NextResponse.json({ status: true, message: "Payout updated successfully", data: updated });
  } catch (error: any) {
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
