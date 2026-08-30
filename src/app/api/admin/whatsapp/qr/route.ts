import { NextResponse } from "next/server";

const WA_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";

export async function GET() {
  try {
    const res = await fetch(`${WA_URL}/qr`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: false, message: "WhatsApp service not reachable" }, { status: 503 });
  }
}
