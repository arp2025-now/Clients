const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? "https://clients-green-seven.vercel.app";

function layout(content: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AP Automations</title>
</head>
<body style="margin:0;padding:0;background:#0f1117;font-family:Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1117;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#1a1d27;border-radius:16px;border:1px solid rgba(28,169,201,0.2);overflow:hidden;max-width:100%;">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,rgba(28,169,201,0.15) 0%,rgba(66,152,166,0.08) 100%);padding:24px 32px;border-bottom:1px solid rgba(28,169,201,0.15);">
            <span style="font-size:18px;font-weight:900;color:#ffffff;">AP <span style="color:#1CA9C9;">Automations</span></span>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${content}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
            <p style="margin:0;font-size:11px;color:#6b7280;">AP Automations · ענת רפאלי פלד · office@apauto.co.il</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:linear-gradient(135deg,#1CA9C9,#4298A6);color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${text}</a>`;
}

// ── 1. לקוח פתח טיקט → שולח לאדמין ──────────────────────────────────────
export function ticketCreatedAdminEmail(opts: {
  clientName: string;
  subject: string;
  priority: string;
  description?: string;
  ticketId: string;
}): { subject: string; html: string } {
  const priorityLabel: Record<string, string> = { low: "נמוכה", high: "גבוהה", urgent: "דחוף" };
  return {
    subject: `🎫 טיקט חדש: ${opts.subject}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">טיקט חדש נפתח</h2>
      <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;">הלקוח <strong style="color:#1CA9C9;">${opts.clientName}</strong> פתח טיקט חדש.</p>
      <table cellpadding="0" cellspacing="0" style="background:rgba(28,169,201,0.06);border:1px solid rgba(28,169,201,0.15);border-radius:8px;padding:16px;width:100%;">
        <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">נושא:</span>&nbsp;<span style="color:#ffffff;font-size:14px;font-weight:600;">${opts.subject}</span></td></tr>
        <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">עדיפות:</span>&nbsp;<span style="color:#f59e0b;font-size:14px;">${priorityLabel[opts.priority] ?? opts.priority}</span></td></tr>
        ${opts.description ? `<tr><td style="padding:8px 0 0;"><p style="margin:0;color:#9ca3af;font-size:13px;">${opts.description}</p></td></tr>` : ""}
      </table>
      ${btn("צפה בטיקט", `${BASE_URL}/admin`)}
    `),
  };
}

// ── 2. אדמין שינה סטטוס → שולח ללקוח ────────────────────────────────────
export function ticketStatusChangedClientEmail(opts: {
  clientName: string;
  subject: string;
  newStatus: string;
}): { subject: string; html: string } {
  const statusLabel: Record<string, string> = {
    open: "פתוח", in_progress: "בטיפול", resolved: "נפתר", closed: "סגור",
  };
  const statusColor: Record<string, string> = {
    open: "#6b7280", in_progress: "#1CA9C9", resolved: "#10b981", closed: "#6b7280",
  };
  const label = statusLabel[opts.newStatus] ?? opts.newStatus;
  const color = statusColor[opts.newStatus] ?? "#6b7280";

  return {
    subject: `עדכון בטיקט: ${opts.subject}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">הטיקט שלך עודכן</h2>
      <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;">שלום ${opts.clientName}, הסטטוס של הטיקט שלך השתנה.</p>
      <table cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;width:100%;">
        <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">נושא:</span>&nbsp;<span style="color:#ffffff;font-size:14px;font-weight:600;">${opts.subject}</span></td></tr>
        <tr><td style="padding:4px 0;"><span style="color:#6b7280;font-size:13px;">סטטוס חדש:</span>&nbsp;<span style="color:${color};font-size:14px;font-weight:700;">${label}</span></td></tr>
      </table>
      ${btn("צפה בטיקט", `${BASE_URL}/tickets`)}
    `),
  };
}

// ── 3. אדמין הוסיף תגובה → שולח ללקוח ───────────────────────────────────
export function adminCommentClientEmail(opts: {
  clientName: string;
  subject: string;
  commentBody: string;
}): { subject: string; html: string } {
  return {
    subject: `תגובה חדשה על הטיקט: ${opts.subject}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">קיבלת תגובה על הטיקט שלך</h2>
      <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;">שלום ${opts.clientName}, הצוות שלנו הגיב לטיקט שלך.</p>
      <div style="background:rgba(28,169,201,0.06);border:1px solid rgba(28,169,201,0.15);border-radius:8px;padding:16px;margin-bottom:8px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">נושא: ${opts.subject}</p>
        <p style="margin:0;color:#ffffff;font-size:14px;line-height:1.6;">${opts.commentBody}</p>
      </div>
      ${btn("צפה בטיקט והשב", `${BASE_URL}/tickets`)}
    `),
  };
}

// ── 4. לקוח הוסיף תגובה → שולח לאדמין ───────────────────────────────────
export function clientCommentAdminEmail(opts: {
  clientName: string;
  subject: string;
  commentBody: string;
}): { subject: string; html: string } {
  return {
    subject: `💬 תגובת לקוח: ${opts.subject}`,
    html: layout(`
      <h2 style="margin:0 0 8px;color:#ffffff;font-size:20px;">תגובה חדשה מהלקוח</h2>
      <p style="margin:0 0 20px;color:#9ca3af;font-size:14px;"><strong style="color:#1CA9C9;">${opts.clientName}</strong> הגיב על טיקט.</p>
      <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:8px;padding:16px;margin-bottom:8px;">
        <p style="margin:0 0 4px;color:#6b7280;font-size:11px;">נושא: ${opts.subject}</p>
        <p style="margin:0;color:#ffffff;font-size:14px;line-height:1.6;">${opts.commentBody}</p>
      </div>
      ${btn("צפה בטיקט", `${BASE_URL}/admin`)}
    `),
  };
}
