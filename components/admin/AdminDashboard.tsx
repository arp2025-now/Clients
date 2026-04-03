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

const CLIENT_STATUS_STYLES: Record<string, string> = {
  onboarding: "border-r-[#1CA9C9]",
  active:     "border-r-green-500",
  paused:     "border-r-yellow-500",
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  onboarding: "קליטה",
  active:     "פעיל",
  paused:     "מושהה",
};

const CLIENT_STATUS_BADGE: Record<string, string> = {
  onboarding: "bg-[rgba(28,169,201,0.15)] text-[#1CA9C9] border-[#1CA9C9]/30",
  active:     "bg-green-500/15 text-green-400 border-green-500/20",
  paused:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  return `לפני ${Math.floor(hours / 24)} ימים`;
}

const ACTION_LABELS: Record<string, string> = {
  created: "נוצר", updated: "עודכן", status_changed: "שינוי סטטוס", commented: "תגובה", uploaded: "קובץ הועלה",
};
const ENTITY_LABELS: Record<string, string> = {
  ticket: "טיקט", project: "פרויקט", payment: "תשלום", file: "קובץ", comment: "הערה",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminDashboard({ clients, openTickets, totalRevenue = 0, recentActivity = [] }: { clients: any[]; openTickets: any[]; totalRevenue?: number; recentActivity?: any[] }) {
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

  const activeCount = clients.filter((c) => c.status === "active").length;
  const totalOpenTickets = openTickets.length;

  return (
    <div className="p-6 space-y-8 max-w-5xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-2xl font-black ap-gradient-text">AP Automations</h1>
          <p className="text-sm text-muted-foreground mt-0.5">לוח בקרה פנימי</p>
        </div>
        {/* Invite form — card style */}
        <div className="bg-card border border-border rounded-xl p-4 space-y-3 w-72 flex-shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">הזמנת לקוח חדש</p>
          <form onSubmit={handleInvite} className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="אימייל"
              dir="ltr"
              className="bg-input border border-border rounded-lg px-3 py-2 text-sm flex-1 outline-none focus:border-[#1CA9C9] transition-colors"
              required
            />
            <Button type="submit" className="ap-gradient text-white text-sm px-4" disabled={inviteLoading}>
              {inviteLoading ? "..." : "שלח"}
            </Button>
          </form>
          {inviteMsg && (
            <p className={`text-xs ${inviteMsg.startsWith("✓") ? "text-green-400" : "text-red-400"}`}>
              {inviteMsg}
            </p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">סה״כ לקוחות</p>
          <p className="text-3xl font-black text-foreground">{clients.length}</p>
        </div>
        <div className="bg-card border border-[#1CA9C9]/20 rounded-xl p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">לקוחות פעילים</p>
          <p className="text-3xl font-black text-[#1CA9C9]">{activeCount}</p>
        </div>
        <div className={`bg-card border rounded-xl p-4 space-y-1 ${totalOpenTickets > 0 ? "border-yellow-500/20" : "border-green-500/20"}`}>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">טיקטים פתוחים</p>
          <p className={`text-3xl font-black ${totalOpenTickets > 0 ? "text-yellow-400" : "text-green-400"}`}>{totalOpenTickets}</p>
        </div>
        <div className="bg-card border border-green-500/20 rounded-xl p-4 space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">הכנסה (שולם)</p>
          <p className="text-2xl font-black text-green-400 tabular-nums">
            ₪{totalRevenue.toLocaleString("he-IL")}
          </p>
        </div>
      </div>

      {/* Clients grid */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full ap-gradient inline-block" />
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

              const clientStatus = client.status ?? "onboarding";

              return (
                <Link
                  key={client.id}
                  href={`/admin/clients/${client.id}`}
                  className={`bg-card border border-border border-r-2 rounded-xl p-4 space-y-3 hover:border-[#1CA9C9]/40 transition-colors block ${CLIENT_STATUS_STYLES[clientStatus]}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm leading-tight">{client.business_name}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${CLIENT_STATUS_BADGE[clientStatus]}`}>
                        {CLIENT_STATUS_LABELS[clientStatus]}
                      </Badge>
                      <Badge variant="outline" className={`text-[10px] px-2 py-0.5 ${payBadge.class}`}>
                        {payBadge.label}
                      </Badge>
                    </div>
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

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full bg-purple-500 inline-block" />
            פעילות אחרונה
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {recentActivity.map((entry) => (
              <div key={entry.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                <span className="text-base mt-0.5 flex-shrink-0">
                  {entry.entity_type === "ticket" ? "◎" : entry.entity_type === "file" ? "📎" : entry.entity_type === "comment" ? "💬" : "◉"}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium">
                    {entry.clients?.business_name && <span className="text-[#1CA9C9]">{entry.clients.business_name} · </span>}
                    {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type} {ACTION_LABELS[entry.action] ?? entry.action}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(entry.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Open tickets */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full bg-yellow-500 inline-block" />
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
