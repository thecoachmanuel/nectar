import { NextResponse } from "next/server";

const WA_URL = process.env.WHATSAPP_SERVICE_URL || "http://localhost:3001";
const WA_SECRET = process.env.WHATSAPP_API_SECRET || "wa_secret_change_me";

export async function POST() {
  try {
    const res = await fetch(`${WA_URL}/logout`, {
      method: "POST",
      headers: { "x-api-secret": WA_SECRET },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ status: false, message: "WhatsApp service not reachable" }, { status: 503 });
  }
}
