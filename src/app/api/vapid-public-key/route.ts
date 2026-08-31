import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const publicKey =
    process.env.VAPID_PUBLIC_KEY ||
    "BBqSh1B05Gx9Z5OgJACy4vEH1BCxpaXc9oFsWAnzEQbWECJqPcxO0-QK-iqQuWJwmQS2VBsGeZZUhHrD9maRRCc";
  return NextResponse.json({ status: true, publicKey });
}
