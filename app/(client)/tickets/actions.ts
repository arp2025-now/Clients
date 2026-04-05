"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import { clientCommentAdminEmail } from "@/lib/email-templates";

export async function getTicketComments(ticketId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addTicketComment(ticketId: string, body: string): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "לא מחובר" };
    if (!body.trim()) return { error: "ההערה ריקה" };

    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticketId,
      author: "client",
      body: body.trim(),
    });
    if (error) return { error: error.message };

    // Email admin
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const admin = createAdminClient();
      const [{ data: ticket }, { data: client }] = await Promise.all([
        admin.from("tickets").select("subject").eq("id", ticketId).single(),
        admin.from("clients").select("business_name").eq("user_id", user.id).single(),
      ]);
      if (ticket && client) {
        const tmpl = clientCommentAdminEmail({
          clientName:  client.business_name,
          subject:     ticket.subject,
          commentBody: body.trim(),
        });
        await sendEmail({ to: adminEmail, ...tmpl });
      }
    }

    revalidatePath("/tickets");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
