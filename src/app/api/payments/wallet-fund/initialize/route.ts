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

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ status: false, message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount < 100) {
      return NextResponse.json({ status: false, message: "Minimum amount is 100" }, { status: 400 });
    }

    const { getPaystackConfig } = await import("@/lib/paystack");
    const { secretKey, isEnabled } = await getPaystackConfig();

    if (!isEnabled) {
      return NextResponse.json({ status: false, message: "Paystack wallet funding is currently disabled." }, { status: 400 });
    }

    if (!secretKey) {
      return NextResponse.json({ status: false, message: "Paystack secret key is not configured in settings or environment" }, { status: 500 });
    }

    const reference = `WLFND-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    const host = req.headers.get("host") || "localhost:3000";
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const res = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: Math.round(amount * 100), 
        reference,
        callback_url: `${baseUrl}/account/wallet?payment=paystack&ref=${reference}`,
        metadata: {
          custom_fields: [
            {
              display_name: "Fund Type",
              variable_name: "fund_type",
              value: "Wallet Top-up"
            },
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user._id.toString()
            }
          ]
        }
      }),
    });

    const data = await res.json();
    if (data.status) {
      return NextResponse.json({ status: true, authorizationUrl: data.data.authorization_url });
    } else {
      return NextResponse.json({ status: false, message: data.message || "Failed to initialize Paystack payment" }, { status: 400 });
    }
  } catch (error: any) {
    console.error("Wallet Fund Init Error:", error);
    return NextResponse.json({ status: false, message: error.message }, { status: 500 });
  }
}
