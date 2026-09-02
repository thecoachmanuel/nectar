import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import PaymentGateway from "@/models/PaymentGateway";
import User from "@/models/User";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "nectar_secret_key_default_2026"
);

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ status: false, message: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];
    let userId;
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as string;
    } catch (e) {
      return NextResponse.json({ status: false, message: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const { reference } = body;

    if (!reference) {
      return NextResponse.json({ status: false, message: "Transaction reference is required" }, { status: 400 });
    }

    const { getPaystackConfig } = await import("@/lib/paystack");
    const { secretKey } = await getPaystackConfig();

    if (!secretKey) {
      return NextResponse.json({ status: false, message: "Paystack secret key is not configured in settings or environment" }, { status: 500 });
    }

    const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();
    if (data.status && data.data.status === "success") {
      const amountFunded = data.data.amount / 100;
      
      const user = await User.findById(userId);
      if (!user) {
        return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });
      }

      // Check if reference already processed (to prevent double funding)
      // Usually you would keep a WalletTransaction model, but for simplicity, we just add it.
      // Wait, let's create a transaction model or store it in user?
      // Without a transaction log, they could theoretically call verify twice if not tracked.
      // Let's add a `processedReferences` array to the user schema or just trust the frontend?
      // For a robust system, we should have a `WalletTransaction` model. Since we don't, 
      // let's check if the reference is in a hypothetical array, or just accept the risk for this MVP.
      // We will check user.processedReferences (we'll add it implicitly).
      if (!user.processedReferences) {
        user.processedReferences = [];
      }

      if (user.processedReferences.includes(reference)) {
        return NextResponse.json({ status: true, message: "Transaction already processed", newBalance: user.walletBalance });
      }

      user.processedReferences.push(reference);
      user.walletBalance = (user.walletBalance || 0) + amountFunded;
      await user.save();

      return NextResponse.json({ status: true, message: "Wallet funded successfully", newBalance: user.walletBalance });
    } else {
      return NextResponse.json({ status: false, message: "Payment verification failed" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Wallet Fund Verify Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
