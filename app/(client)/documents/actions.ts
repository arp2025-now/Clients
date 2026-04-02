"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export async function getClientFiles() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!client) return [];

  const { data } = await supabase
    .from("client_files")
    .select("*")
    .eq("client_id", client.id)
    .order("uploaded_at", { ascending: false });

  return data ?? [];
}

export async function getDownloadUrl(storagePath: string) {
  // Use admin client for signed URL (private bucket)
  const supabase = await createAdminClient();
  const { data, error } = await supabase.storage
    .from("client-files")
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
