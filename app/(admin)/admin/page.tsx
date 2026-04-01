import { createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const supabase = await createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  // Fetch all data in parallel
  const [{ data: clients }, { data: tickets }] = await Promise.all([
    supabase
      .from("clients")
      .select("*, projects(*), payments(*), tickets(*)")
      .order("created_at"),
    supabase
      .from("tickets")
      .select("*, clients(business_name, phone)")
      .in("status", ["open", "in_progress"])
      .order("created_at", { ascending: false }),
  ]);

  return <AdminDashboard clients={clients ?? []} openTickets={tickets ?? []} />;
}
