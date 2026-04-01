"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { updateTicketStatus } from "@/app/(admin)/admin/actions";

const PAYMENT_BADGE: Record<string, { label: string; class: string }> = {
  paid:    { label: "שולם",   class: "bg-green-500/15 text-green-400 border-green-500/20" },
  pending: { label: "ממתין",  class: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  overdue: { label: "באיחור", class: "bg-red-500/15 text-red-400 border-red-500/20" },
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminDashboard({ clients, openTickets }: { clients: any[]; openTickets: any[] }) {
  const router = useRouter();
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteMsg("");
    const res = await fetch("/api/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail }),
    });
    const data = await res.json();
    if (data.success) {
      setInviteMsg(`✓ הזמנה נשלחה ל-${inviteEmail}`);
      setInviteEmail("");
    } else {
      setInviteMsg(`שגיאה: ${data.error}`);
    }
    setInviteLoading(false);
  }

  async function handleStatusChange(ticketId: string, status: string, phone?: string, name?: string, subject?: string) {
    await updateTicketStatus(ticketId, status, phone, name, subject);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black ap-gradient-text">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">AP Automations — לוח בקרה פנימי</p>
        </div>
        {/* Invite form */}
        <form onSubmit={handleInvite} className="flex gap-2 items-center">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="אימייל לקוח חדש"
            dir="ltr"
            className="bg-input border border-border rounded-lg px-3 py-2 text-sm w-48 outline-none focus:border-[#1CA9C9]"
            required
          />
          <Button type="submit" className="ap-gradient text-white text-sm" disabled={inviteLoading}>
            {inviteLoading ? "שולח..." : "הזמן לקוח"}
          </Button>
        </form>
      </div>
      {inviteMsg && (
        <p className={`text-sm ${inviteMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
          {inviteMsg}
        </p>
      )}

      {/* Clients grid */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          לקוחות ({clients.length})
        </h2>
        {clients.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין לקוחות עדיין</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => {
              const lastPayment = client.payments?.[client.payments.length - 1];
              const paymentStatus = lastPayment?.status ?? "pending";
              const payBadge = PAYMENT_BADGE[paymentStatus];
              const openCount = client.tickets?.filter(
                (t: { status: string }) => ["open", "in_progress"].includes(t.status)
              ).length ?? 0;

              return (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-[#1CA9C9]/40 transition-colors block"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm leading-tight">{client.business_name}</span>
                    <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${payBadge.class}`}>
                      {payBadge.label}
                    </Badge>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>{client.projects?.length ?? 0} פרויקטים</span>
                    {openCount > 0 && (
                      <span className="text-yellow-400 font-semibold">{openCount} טיקטים פתוחים</span>
                    )}
                  </div>
                  {lastPayment && (
                    <p className="text-[10px] text-muted-foreground">
                      תשלום אחרון: ₪{lastPayment.amount}
                    </p>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Open tickets */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          טיקטים פתוחים ({openTickets.length})
        </h2>
        {openTickets.length === 0 ? (
          <p className="text-muted-foreground text-sm">אין טיקטים פתוחים ✓</p>
        ) : (
          <div className="space-y-3">
            {openTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="bg-card border border-border rounded-xl p-4 flex items-start gap-4"
              >
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{ticket.subject}</span>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {ticket.clients?.business_name}
                    {ticket.clients?.phone && ` · ${ticket.clients.phone}`}
                  </p>
                  {ticket.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{ticket.description}</p>
                  )}
                </div>
                {/* Status changer */}
                <select
                  defaultValue={ticket.status}
                  onChange={(e) =>
                    handleStatusChange(
                      ticket.id,
                      e.target.value,
                      ticket.clients?.phone,
                      ticket.clients?.business_name,
                      ticket.subject
                    )
                  }
                  className="bg-secondary border border-border rounded-lg px-2 py-1.5 text-xs outline-none focus:border-[#1CA9C9] flex-shrink-0"
                >
                  <option value="open">פתוח</option>
                  <option value="in_progress">בטיפול</option>
                  <option value="resolved">נפתר</option>
                  <option value="closed">סגור</option>
                </select>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
