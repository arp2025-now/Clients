import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email. Never throws — logs and swallows errors so callers aren't blocked.
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<void> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn("[email] RESEND_API_KEY not set — skipping email");
      return;
    }
    await resend.emails.send({
      from: "AP Automations <noreply@apauto.co.il>",
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error("[email] Failed to send:", err);
  }
}
