"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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

export async function uploadClientDocument(formData: FormData): Promise<{ error: string | null }> {
  try {
    // Use the user-session client so Storage RLS policies apply
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "לא מחובר" };

    const { data: client } = await supabase
      .from("clients").select("id").eq("user_id", user.id).single();
    if (!client) return { error: "לקוח לא נמצא" };

    const file = formData.get("file") as File;
    if (!file || !file.name) return { error: "לא נבחר קובץ" };

    // Feature 1: extra metadata fields
    const displayName = (formData.get("displayName") as string | null)?.trim() || null;
    const note        = (formData.get("note")        as string | null)?.trim() || null;
    const tagsRaw     = formData.get("tags") as string | null;
    const tags        = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w\-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 60);
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${client.id}/${Date.now()}_${safeName}.${ext}`;

    // Upload via user-session client → Storage RLS "storage_insert_own" policy enforced
    const { error: uploadError } = await supabase.storage
      .from("client-files")
      .upload(storagePath, file, { upsert: false });
    if (uploadError) return { error: uploadError.message };

    // DB insert via user-session client → "files_insert_own" RLS policy enforced
    const { error: dbError } = await supabase.from("client_files").insert({
      client_id:    client.id,
      filename:     file.name,
      display_name: displayName,
      note,
      tags,
      storage_path: storagePath,
      file_type:    "other",
      size_bytes:   file.size,
      uploaded_by:  "client",
    });
    if (dbError) {
      // Clean up orphaned storage object if DB insert failed
      await supabase.storage.from("client-files").remove([storagePath]);
      return { error: dbError.message };
    }

    revalidatePath("/documents");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function getDownloadUrl(storagePath: string) {
  // Signed URLs are generated server-side with admin client (private bucket)
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("client-files")
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
