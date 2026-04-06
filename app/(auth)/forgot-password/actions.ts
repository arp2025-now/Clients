"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export type ResetState = { success: true; email: string } | { error: string } | null;

export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData
): Promise<ResetState> {
  const email = (formData.get("email") as string)?.trim();
  if (!email) return { error: "נא להכניס כתובת אימייל." };

  console.log("[reset-password] server action for:", email);

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "recovery",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?type=recovery&next=/reset-password`,
    },
  });

  if (error || !data) {
    console.error("[reset-password] generateLink error:", error);
    // Don't reveal whether the email exists — always show success
    return { success: true, email };
  }

  const resetLink = data.properties.action_link;
  console.log("[reset-password] link generated, sending email...");

  await sendEmail({
    to: email,
    subject: "איפוס סיסמה — AP Automations",
    html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 16px; direction: rtl; }
    .card { background: #fff; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 40px 32px; }
    .logo { font-size: 28px; font-weight: 900; color: #111; margin-bottom: 24px; }
    .logo span { color: #1CA9C9; }
    p { color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1CA9C9, #4298a6); color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; }
    .footer { text-align: center; color: #aaa; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">AP<span>.</span>Automations</div>
    <p>קיבלנו בקשה לאיפוס הסיסמה שלך. לחצי על הכפתור להמשך:</p>
    <a href="${resetLink}" class="btn">איפוס סיסמה →</a>
    <p style="margin-top:24px; font-size:12px; color:#aaa;">הקישור תקף לשעה אחת. אם לא ביקשת איפוס סיסמה — התעלמי ממייל זה.</p>
  </div>
  <div class="footer">AP Automations © ${new Date().getFullYear()}</div>
</body>
</html>`,
  });

  return { success: true, email };
}
