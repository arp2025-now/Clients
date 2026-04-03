import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export default async function AdminPage() {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();

  if (!user || user.email !== process.env.ADMIN_EMAIL) {
    redirect("/dashboard");
  }

  const supabase = createAdminClient();

  const [{ data: clients }, { data: tickets }, { data: allPayments }, { data: recentActivity }] = await Promise.all([
    supabase.from("clients").select("*, projects(*), payments(*), tickets(*)").order("created_at"),
    supabase.from("tickets").select("*, clients(business_name, phone)").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }),
    supabase.from("payments").select("amount, status"),
    supabase.from("audit_log").select("*, clients(business_name)").order("created_at", { ascending: false }).limit(10),
  ]);

  const totalRevenue = (allPayments ?? []).filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <AdminDashboard
      clients={clients ?? []}
      openTickets={tickets ?? []}
      totalRevenue={totalRevenue}
      recentActivity={recentActivity ?? []}
    />
  );
}
