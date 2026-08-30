import { NextResponse } from "next/server";

const WA_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WA_SECRET = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";

export async function GET() {
  try {
    const res = await fetch(`${WA_URL}/status`, { cache: "no-store" });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: false, connection: "disconnected", connected: false, qrReady: false, error: "WhatsApp service not reachable" });
  }
}
