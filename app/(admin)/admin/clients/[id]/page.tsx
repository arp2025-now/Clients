import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getDecryptedCredentials } from "../../actions";
import { ClientDetail } from "@/components/admin/ClientDetail";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const [{ data: client }, { data: projects }, { data: payments }, { data: files }, credentials] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("projects").select("*").eq("client_id", id).order("created_at"),
      supabase.from("payments").select("*").eq("client_id", id).order("created_at"),
      supabase.from("client_files").select("*").eq("client_id", id).order("uploaded_at", { ascending: false }),
      getDecryptedCredentials(id),
    ]);

  if (!client) redirect("/admin");

  return (
    <ClientDetail
      client={client}
      projects={projects ?? []}
      payments={payments ?? []}
      files={files ?? []}
      credentials={credentials}
    />
  );
}
