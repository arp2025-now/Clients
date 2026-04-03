"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

    revalidatePath("/tickets");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
