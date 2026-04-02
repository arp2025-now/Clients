"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

// Verify caller is admin
async function requireAdmin() {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }
  return supabase;
}

export async function updateTicketStatus(ticketId: string, status: string, clientPhone?: string, clientName?: string, subject?: string) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId);

  if (error) throw new Error(error.message);

  // Fire Make.com webhook
  const webhookUrl = process.env.MAKE_WEBHOOK_URL;
  if (webhookUrl) {
    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "ticket_status_changed",
        ticket_id: ticketId,
        status,
        client_name: clientName,
        client_phone: clientPhone,
        subject,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});
  }

  revalidatePath("/admin");
}

export async function updateProjectProgress(projectId: string, status: string, progress: number) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("projects")
    .update({ status, progress_pct: progress })
    .eq("id", projectId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function addProject(clientId: string, name: string, description: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, name, description });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function addPayment(clientId: string, amount: number, status: string, dueDate?: string, notes?: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("payments")
    .insert({ client_id: clientId, amount, status, due_date: dueDate || null, notes });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clients/${clientId}`);
}

// Returns decrypted credentials — server-only
export async function getDecryptedCredentials(clientId: string) {
  const supabase = await requireAdmin();

  const { data, error } = await supabase
    .from("credentials")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at");

  if (error) throw new Error(error.message);

  return (data ?? []).map((cred) => ({
    ...cred,
    password: cred.encrypted_password ? decrypt(cred.encrypted_password) : null,
  }));
}

// ============================================================
// CLIENT STATUS & NOTES
// ============================================================

export async function updateClientStatus(clientId: string, status: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("clients")
    .update({ status })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clients/${clientId}`);
  revalidatePath("/admin");
}

export async function updateClientNotes(clientId: string, notes: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("clients")
    .update({ admin_notes: notes })
    .eq("id", clientId);
  if (error) throw new Error(error.message);
}

// ============================================================
// FILE MANAGEMENT
// ============================================================

export async function uploadClientFile(
  clientId: string,
  filename: string,
  fileBase64: string,
  mimeType: string,
  fileType: "contract" | "spec" | "other",
  sizeBytes: number
) {
  const supabase = await requireAdmin();

  // Decode base64 to buffer
  const buffer = Buffer.from(fileBase64, "base64");
  const storagePath = `${clientId}/${Date.now()}_${filename}`;

  const { error: uploadError } = await supabase.storage
    .from("client-files")
    .upload(storagePath, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const { error: dbError } = await supabase
    .from("client_files")
    .insert({ client_id: clientId, filename, storage_path: storagePath, file_type: fileType, size_bytes: sizeBytes });

  if (dbError) {
    // Rollback storage upload
    await supabase.storage.from("client-files").remove([storagePath]);
    throw new Error(dbError.message);
  }

  revalidatePath(`/admin/clients/${clientId}`);
}

export async function deleteClientFile(fileId: string, storagePath: string, clientId: string) {
  const supabase = await requireAdmin();

  await supabase.storage.from("client-files").remove([storagePath]);

  const { error } = await supabase
    .from("client_files")
    .delete()
    .eq("id", fileId);

  if (error) throw new Error(error.message);
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function getSignedDownloadUrl(storagePath: string) {
  const supabase = await requireAdmin();
  const { data, error } = await supabase.storage
    .from("client-files")
    .createSignedUrl(storagePath, 3600); // 1 hour
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
