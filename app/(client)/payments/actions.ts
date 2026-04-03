"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getClientPayments() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();
  if (!client) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("payments")
    .select("*")
    .eq("client_id", client.id)
    .order("created_at", { ascending: false });

  return data ?? [];
}
