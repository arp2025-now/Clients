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

  const [{ data: client }, { data: projects }, { data: payments }, { data: customFields }, credentials] =
    await Promise.all([
      supabase.from("clients").select("*").eq("id", id).single(),
      supabase.from("projects").select("*").eq("client_id", id).order("created_at"),
      supabase.from("payments").select("*").eq("client_id", id).order("created_at"),
      supabase.from("onboarding_custom_fields").select("*").eq("client_id", id).order("sort_order"),
      getDecryptedCredentials(id),
    ]);

  if (!client) redirect("/admin");

  return (
    <ClientDetail
      client={client}
      projects={projects ?? []}
      payments={payments ?? []}
      customFields={customFields ?? []}
      credentials={credentials}
    />
  );
}
