"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";
import { sendEmail } from "@/lib/email";
import {
  ticketCreatedAdminEmail,
  ticketStatusChangedClientEmail,
  adminCommentClientEmail,
  clientCommentAdminEmail,
} from "@/lib/email-templates";

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

export async function deleteProject(projectId: string, clientId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", projectId);
    if (error) return { error: error.message };
    revalidatePath(`/admin/clients/${clientId}`);
    revalidatePath("/admin");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function addProject(clientId: string, name: string, description: string) {
  const supabase = await requireAdmin();
  const { error } = await supabase
    .from("projects")
    .insert({ client_id: clientId, name, description });
  if (error) throw new Error(error.message);
  revalidatePath("/admin");
}

export async function addPayment(clientId: string, amount: number, status: string, dueDate?: string, notes?: string): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase
      .from("payments")
      .insert({
        client_id: clientId,
        amount,
        status,
        due_date: dueDate || null,
        notes: notes || null,
      });
    if (error) return { error: error.message };
    revalidatePath(`/admin/clients/${clientId}`);
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
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

  const file        = formData.get("file")        as File;
  const clientId    = formData.get("clientId")    as string;
  const fileType    = formData.get("fileType")    as string;
  const displayName = (formData.get("displayName") as string | null)?.trim() || null;
  const note        = (formData.get("note")        as string | null)?.trim() || null;
  const tagsRaw     = formData.get("tags") as string | null;
  const tags        = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  if (!file || !clientId) return { error: "Missing file or clientId" };

  const ext = file.name.split(".").pop() ?? "";
  const safeName = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[^\w\-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 60);
  const storagePath = `${clientId}/${Date.now()}_${safeName}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("client-files")
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: `Storage: ${uploadError.message}` };

  const { error: dbError } = await supabase
    .from("client_files")
    .insert({
      client_id:    clientId,
      filename:     file.name,
      display_name: displayName,
      note,
      tags,
      storage_path: storagePath,
      file_type:    fileType,
      size_bytes:   file.size,
    });

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

// ============================================================
// TICKET COMMENTS (ADMIN REPLY)
// ============================================================

export async function getTicketComments(ticketId: string) {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from("ticket_comments")
    .select("*")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

export async function addAdminTicketComment(
  ticketId: string,
  body: string,
  clientId: string
): Promise<{ error: string | null }> {
  try {
    if (!body.trim()) return { error: "ההערה ריקה" };
    const supabase = await requireAdmin();

    const { error } = await supabase.from("ticket_comments").insert({
      ticket_id: ticketId,
      author: "admin",
      body: body.trim(),
    });
    if (error) return { error: error.message };

    // Fetch ticket subject + client email for notification
    const [{ data: ticket }, { data: clientRow }] = await Promise.all([
      supabase.from("tickets").select("subject").eq("id", ticketId).single(),
      supabase
        .from("clients")
        .select("id, business_name, user_id")
        .eq("id", clientId)
        .single(),
    ]);

    // In-app notification
    await createNotification(
      clientId,
      "תגובה חדשה על הטיקט שלך",
      body.trim().slice(0, 80),
      "/tickets"
    );

    // Email notification to client
    if (clientRow && ticket) {
      const { data: authUser } = await supabase.auth.admin.getUserById(clientRow.user_id);
      const clientEmail = authUser?.user?.email;
      if (clientEmail) {
        const tmpl = adminCommentClientEmail({
          clientName:  clientRow.business_name,
          subject:     ticket.subject,
          commentBody: body.trim(),
        });
        await sendEmail({ to: clientEmail, ...tmpl });
      }
    }

    // Audit log
    await supabase.from("audit_log").insert({
      client_id: clientId,
      entity_type: "comment",
      action: "commented",
      details: { body: body.trim().slice(0, 80) },
      actor: "admin",
    });

    revalidatePath(`/admin/clients/${clientId}`);
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

// ============================================================
// PROJECT IMAGE UPLOAD
// ============================================================

export async function uploadProjectImage(projectId: string, formData: FormData): Promise<{ error: string | null; url?: string }> {
  try {
    const supabase = await requireAdmin();
    const file = formData.get("file") as File;
    if (!file) return { error: "לא נבחר קובץ" };

    const ext = file.name.split(".").pop() ?? "jpg";
    const storagePath = `projects/${projectId}/cover.${ext}`;

    // Remove old cover if exists
    await supabase.storage.from("client-files").remove([storagePath]);

    const { error: uploadError } = await supabase.storage
      .from("client-files")
      .upload(storagePath, file, { upsert: true, contentType: file.type });
    if (uploadError) return { error: uploadError.message };

    const { data: signedData } = await supabase.storage
      .from("client-files")
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    const url = signedData?.signedUrl ?? "";

    const { error: dbError } = await supabase
      .from("projects")
      .update({ image_url: url })
      .eq("id", projectId);
    if (dbError) return { error: dbError.message };

    revalidatePath("/admin");
    return { error: null, url };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

// ============================================================
// NOTIFICATIONS & AUDIT LOG
// ============================================================

async function createNotification(clientId: string, title: string, body: string, link?: string) {
  try {
    const supabase = await requireAdmin();
    await supabase.from("notifications").insert({ client_id: clientId, title, body, link: link ?? null });
  } catch {
    // Non-fatal
  }
}

export async function updateTicketStatusWithAudit(
  ticketId: string,
  status: string,
  clientId: string,
  prevStatus: string,
  subject: string,
  clientPhone?: string,
  clientName?: string
) {
  const supabase = await requireAdmin();

  const { error } = await supabase
    .from("tickets")
    .update({ status })
    .eq("id", ticketId);
  if (error) throw new Error(error.message);

  // Audit log
  await supabase.from("audit_log").insert({
    client_id: clientId,
    entity_type: "ticket",
    entity_id: ticketId,
    action: "status_changed",
    details: { from: prevStatus, to: status, subject },
    actor: "admin",
  });

  // In-app notification
  await createNotification(
    clientId,
    `סטטוס הטיקט עודכן`,
    `"${subject}" שונה מ-${prevStatus} ל-${status}`,
    "/tickets"
  );

  // Email notification to client
  const { data: clientRow } = await supabase
    .from("clients")
    .select("business_name, user_id")
    .eq("id", clientId)
    .single();
  if (clientRow) {
    const { data: authUser } = await supabase.auth.admin.getUserById(clientRow.user_id);
    const clientEmail = authUser?.user?.email;
    if (clientEmail) {
      const tmpl = ticketStatusChangedClientEmail({
        clientName: clientRow.business_name,
        subject,
        newStatus: status,
      });
      await sendEmail({ to: clientEmail, ...tmpl });
    }
  }

  // Make.com webhook
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
  revalidatePath(`/admin/clients/${clientId}`);
}

export async function getAuditLog(clientId: string) {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from("audit_log")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

// ============================================================
// CREDENTIALS (ADMIN)
// ============================================================

export async function addAdminCredential(
  clientId: string,
  systemName: string,
  url: string,
  username: string,
  password: string,
  notes: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();
    const { encrypt } = await import("@/lib/crypto");
    const { error } = await supabase.from("credentials").insert({
      client_id: clientId,
      system_name: systemName,
      url: url || null,
      username: username || null,
      encrypted_password: password ? encrypt(password) : null,
      notes: notes || null,
    });
    if (error) return { error: error.message };
    revalidatePath(`/admin/clients/${clientId}`);
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function updateAdminCredential(
  credId: string,
  clientId: string,
  systemName: string,
  url: string,
  username: string,
  password: string,
  notes: string
): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();
    const { encrypt } = await import("@/lib/crypto");

    // Only re-encrypt if password was actually changed (non-empty)
    const updateData: Record<string, string | null> = {
      system_name: systemName,
      url: url || null,
      username: username || null,
      notes: notes || null,
    };
    if (password) {
      updateData.encrypted_password = encrypt(password);
    }

    const { error } = await supabase
      .from("credentials")
      .update(updateData)
      .eq("id", credId);
    if (error) return { error: error.message };
    revalidatePath(`/admin/clients/${clientId}`);
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function deleteAdminCredential(credId: string, clientId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();
    const { error } = await supabase.from("credentials").delete().eq("id", credId);
    if (error) return { error: error.message };
    revalidatePath(`/admin/clients/${clientId}`);
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

// ============================================================
// SEARCH (Feature 4)
// ============================================================

export async function searchAll(query: string) {
  if (!query.trim()) return { clients: [], tickets: [], files: [] };
  const supabase = await requireAdmin();
  const q = `%${query.trim()}%`;

  const [clientsRes, ticketsRes, filesRes] = await Promise.all([
    supabase
      .from("clients")
      .select("id, business_name, phone, status")
      .or(`business_name.ilike.${q},phone.ilike.${q}`)
      .limit(10),
    supabase
      .from("tickets")
      .select("id, subject, status, client_id, clients(business_name)")
      .or(`subject.ilike.${q},description.ilike.${q}`)
      .limit(10),
    supabase
      .from("client_files")
      .select("id, filename, display_name, client_id, clients(business_name)")
      .or(`filename.ilike.${q},note.ilike.${q},display_name.ilike.${q}`)
      .limit(10),
  ]);

  return {
    clients: clientsRes.data ?? [],
    tickets: ticketsRes.data ?? [],
    files:   filesRes.data   ?? [],
  };
}

// ============================================================
// CSV EXPORT (Feature 5)
// ============================================================

function toCSV(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v).replace(/"/g, '""');
    return `"${s}"`;
  };
  return [
    headers.map(escape).join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\r\n");
}

export async function exportClientsCSV(): Promise<string> {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from("clients")
    .select("id, business_name, phone, website_url, status, created_at")
    .order("created_at", { ascending: false });
  return toCSV((data ?? []) as Record<string, unknown>[]);
}

export async function exportTicketsCSV(status?: string): Promise<string> {
  const supabase = await requireAdmin();
  let q = supabase
    .from("tickets")
    .select("id, subject, priority, status, description, created_at, updated_at, clients(business_name)");
  if (status) q = q.eq("status", status);
  const { data } = await q.order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rows = (data ?? []).map((t: any) => ({
    id:          t.id,
    client_name: Array.isArray(t.clients) ? (t.clients[0]?.business_name ?? "") : (t.clients?.business_name ?? ""),
    subject:     t.subject,
    priority:    t.priority,
    status:      t.status,
    description: t.description,
    created_at:  t.created_at,
    updated_at:  t.updated_at,
  }));
  return toCSV(rows);
}

export async function exportClientFilesCSV(clientId: string): Promise<string> {
  const supabase = await requireAdmin();
  const { data } = await supabase
    .from("client_files")
    .select("id, filename, display_name, tags, note, file_type, uploaded_by, size_bytes, uploaded_at")
    .eq("client_id", clientId)
    .order("uploaded_at", { ascending: false });

  const rows = (data ?? []).map((f: Record<string, unknown> & { tags?: string[] | null }) => ({
    ...f,
    tags: (f.tags ?? []).join("; "),
  }));
  return toCSV(rows as Record<string, unknown>[]);
}

export async function setClientPassword(userId: string, password: string): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();
    // email_confirm: true ensures the account is fully active regardless of
    // whether the client completed the original invite/onboarding flow.
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });
    return { error: error?.message ?? null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}

export async function deleteClient(clientId: string, userId: string): Promise<{ error: string | null }> {
  try {
    const supabase = await requireAdmin();

    // Delete all storage files for this client
    const { data: files } = await supabase
      .from("client_files")
      .select("storage_path")
      .eq("client_id", clientId);

    if (files && files.length > 0) {
      const paths = files.map((f) => f.storage_path);
      await supabase.storage.from("client-files").remove(paths);
    }

    // Delete the auth user — cascades to clients row via FK
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };

    revalidatePath("/admin");
    return { error: null };
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }
}
