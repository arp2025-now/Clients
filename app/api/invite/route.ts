import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  const userClient = await createClient();
  const {
    data: { user },
  } = await userClient.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, businessName } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Generate invite link without sending email via Supabase
  const { data, error } = await supabase.auth.admin.generateLink({
    type: "invite",
    email,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?next=/onboarding`,
      data: { business_name: businessName ?? "" },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Build link directly with hashed_token — bypasses Supabase redirect (which adds hash fragments the server can't read)
  const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback?token_hash=${data.properties.hashed_token}&type=invite&next=/onboarding`;
  const name = businessName || email;

  // Send invite email via Resend
  await sendEmail({
    to: email,
    subject: "הוזמנת לפורטל AP Automations",
    html: `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f5; margin: 0; padding: 40px 16px; direction: rtl; }
    .card { background: #fff; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 40px 32px; }
    .logo { font-size: 28px; font-weight: 900; color: #111; margin-bottom: 24px; }
    .logo span { color: #1CA9C9; }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { color: #555; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #1CA9C9, #4298a6); color: #fff !important; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; }
    .footer { text-align: center; color: #aaa; font-size: 12px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">AP<span>.</span>Automations</div>
    <h1>ברוכים הבאים, ${name}!</h1>
    <p>הוזמנת לפורטל הלקוחות של AP Automations.<br/>לחצי על הכפתור להלן כדי להגדיר את הסיסמה שלך ולהיכנס למערכת.</p>
    <a href="${inviteLink}" class="btn">כניסה לפורטל →</a>
    <p style="margin-top:24px; font-size:12px; color:#aaa;">הקישור תקף ל-24 שעות. אם לא ביקשת גישה — התעלמי ממייל זה.</p>
  </div>
  <div class="footer">AP Automations © ${new Date().getFullYear()}</div>
</body>
</html>`,
  });

  return NextResponse.json({ success: true, userId: data.user.id });
}
