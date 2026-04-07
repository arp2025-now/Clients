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

// ── Presigned upload URL (bypasses Vercel body limit entirely) ──────────────
export async function getUploadUrl(filename: string): Promise<{
  signedUrl: string; token: string; path: string; error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { signedUrl: "", token: "", path: "", error: "לא מחובר" };

    const { data: client } = await supabase
      .from("clients").select("id").eq("user_id", user.id).single();
    if (!client) return { signedUrl: "", token: "", path: "", error: "לקוח לא נמצא" };

    const safeName = filename.replace(/[^\w\-\.]/g, "_").slice(0, 80);
    const path = `${client.id}/${Date.now()}_${safeName}`;

    const admin = createAdminClient();
    const { data, error } = await admin.storage
      .from("client-files")
      .createSignedUploadUrl(path);
    if (error) return { signedUrl: "", token: "", path: "", error: error.message };
    return { signedUrl: data.signedUrl, token: data.token, path, error: null };
  } catch (e: unknown) {
    return { signedUrl: "", token: "", path: "", error: (e as Error).message };
  }
}

export async function recordUploadedFile(params: {
  path: string; filename: string; displayName: string | null;
  note: string | null; tags: string[]; sizeBytes: number;
}): Promise<{ error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "לא מחובר" };

    const { data: client } = await supabase
      .from("clients").select("id").eq("user_id", user.id).single();
    if (!client) return { error: "לקוח לא נמצא" };

    const admin = createAdminClient();
    const { error } = await admin.from("client_files").insert({
      client_id:    client.id,
      filename:     params.filename,
      display_name: params.displayName,
      note:         params.note,
      tags:         params.tags,
      storage_path: params.path,
      file_type:    "other",
      size_bytes:   params.sizeBytes,
      uploaded_by:  "client",
    });
    if (error) return { error: error.message };
    revalidatePath("/documents");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

// ── Legacy fallback (kept for compatibility) ─────────────────────────────────
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

    // Upload via admin client to bypass Storage RLS (server action is already auth-gated above)
    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("client-files")
      .upload(storagePath, file, { upsert: false });
    if (uploadError) return { error: uploadError.message };

    // DB insert via admin client
    const { error: dbError } = await admin.from("client_files").insert({
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
      await admin.storage.from("client-files").remove([storagePath]);
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
