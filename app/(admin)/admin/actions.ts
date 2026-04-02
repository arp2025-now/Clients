"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

// Verify caller is admin using the user-facing client (has auth cookies),
// then return the admin client (service role) for DB/Storage operations.
async function requireAdmin() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    throw new Error("Unauthorized");
  }
  return createAdminClient();
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

export async function uploadClientFile(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await requireAdmin();

  const file = formData.get("file") as File;
  const clientId = formData.get("clientId") as string;
  const fileType = formData.get("fileType") as string;

  if (!file || !clientId) return { error: "Missing file or clientId" };

  // Sanitize filename for storage path (keep original name for display)
  const ext = file.name.split(".").pop() ?? "";
  const safeName = file.name
    .replace(/\.[^.]+$/, "") // remove extension
    .replace(/[^\w\-]/g, "_") // replace non-ASCII (Hebrew, spaces, etc.) with _
    .replace(/_+/g, "_") // collapse consecutive underscores
    .slice(0, 60); // limit length
  const storagePath = `${clientId}/${Date.now()}_${safeName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("client-files")
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: `Storage: ${uploadError.message}` };

  const { error: dbError } = await supabase
    .from("client_files")
    .insert({ client_id: clientId, filename: file.name, storage_path: storagePath, file_type: fileType, size_bytes: file.size });

  if (dbError) {
    await supabase.storage.from("client-files").remove([storagePath]);
    return { error: `DB: ${dbError.message}` };
  }

  revalidatePath(`/admin/clients/${clientId}`);
  return { error: null };
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
