import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { ticketCreatedAdminEmail } from "@/lib/email-templates";

export async function POST(req: NextRequest) {
  const payload = await req.json();

  // Email admin when a new ticket is created
  if (payload.event === "ticket_created") {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const tmpl = ticketCreatedAdminEmail({
        clientName:  payload.client_name  ?? "לקוח",
        subject:     payload.subject      ?? "(ללא נושא)",
        priority:    payload.priority     ?? "low",
        description: payload.description,
        ticketId:    payload.ticket_id    ?? "",
      });
      await sendEmail({ to: adminEmail, ...tmpl });
    }
  }

  // Forward to Make.com
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (webhookUrl) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      console.error("[webhook] Failed to reach Make.com");
    }
  }

  return NextResponse.json({ ok: true });
}
