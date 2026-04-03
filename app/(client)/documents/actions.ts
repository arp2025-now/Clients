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
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "לא מחובר" };

    const { data: client } = await supabase
      .from("clients").select("id").eq("user_id", user.id).single();
    if (!client) return { error: "לקוח לא נמצא" };

    const file = formData.get("file") as File;
    if (!file || !file.name) return { error: "לא נבחר קובץ" };

    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^\w\-]/g, "_")
      .replace(/_+/g, "_")
      .slice(0, 60);
    const ext = file.name.split(".").pop() ?? "bin";
    const storagePath = `${client.id}/${Date.now()}_${safeName}.${ext}`;

    const admin = createAdminClient();
    const { error: uploadError } = await admin.storage
      .from("client-files")
      .upload(storagePath, file, { upsert: false });
    if (uploadError) return { error: uploadError.message };

    const { error: dbError } = await admin.from("client_files").insert({
      client_id: client.id,
      filename: file.name,
      storage_path: storagePath,
      file_type: "other",
      size_bytes: file.size,
      uploaded_by: "client",
    });
    if (dbError) return { error: dbError.message };

    revalidatePath("/documents");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function getDownloadUrl(storagePath: string) {
  // Use admin client for signed URL (private bucket)
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from("client-files")
    .createSignedUrl(storagePath, 3600);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
