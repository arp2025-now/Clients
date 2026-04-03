import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDecryptedCredentials, getAuditLog } from "../../actions";
import { ClientDetail } from "@/components/admin/ClientDetail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  const [{ data: client }, { data: projects }, { data: payments }, { data: files }, { data: tickets }, credentials, auditLog] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("projects").select("*").eq("client_id", id).order("created_at"),
      supabase.from("payments").select("*").eq("client_id", id).order("created_at"),
      supabase.from("client_files").select("*").eq("client_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("tickets").select("*").eq("client_id", id).order("created_at", { ascending: false }),
      getDecryptedCredentials(id),
      getAuditLog(id),
    ]);

  if (!client) redirect("/admin");

  return (
    <ClientDetail
      client={client}
      projects={projects ?? []}
      payments={payments ?? []}
      files={files ?? []}
      credentials={credentials}
      tickets={tickets ?? []}
      auditLog={auditLog}
    />
  );
}
