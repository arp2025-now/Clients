import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (!webhookUrl) return NextResponse.json({ ok: true }); // webhook not configured

  const payload = await req.json();

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-fatal — log and continue
    console.error("[webhook] Failed to reach Make.com");
  }

  return NextResponse.json({ ok: true });
}
