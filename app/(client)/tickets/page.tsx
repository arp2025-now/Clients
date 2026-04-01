import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TicketsList } from "@/components/tickets/TicketsList";

export default async function TicketsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .single();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <TicketsList
      tickets={tickets ?? []}
      clientId={client?.id ?? ""}
    />
  );
}
