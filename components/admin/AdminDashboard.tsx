"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { updateTicketStatus } from "@/app/(admin)/admin/actions";
import { AdminSearch } from "@/components/admin/AdminSearch";
import { ExportButton } from "@/components/admin/ExportButton";
import { Users, TicketCheck, Banknote, UserPlus, Send } from "lucide-react";

const PAYMENT_BADGE: Record<string, { label: string; class: string }> = {
  paid:    { label: "שולם",   class: "bg-green-100 text-green-700 border-green-200" },
  pending: { label: "ממתין",  class: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  overdue: { label: "באיחור", class: "bg-red-100 text-red-600 border-red-200" },
};

const CLIENT_STATUS_DOT: Record<string, string> = {
  onboarding: "bg-[#1CA9C9]",
  active:     "bg-green-400",
  paused:     "bg-yellow-400",
};

const CLIENT_STATUS_BADGE: Record<string, string> = {
  onboarding: "bg-[#1CA9C9]/10 text-[#1CA9C9] border-[#1CA9C9]/30",
  active:     "bg-green-100 text-green-700 border-green-200",
  paused:     "bg-yellow-100 text-yellow-700 border-yellow-200",
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  onboarding: "קליטה", active: "פעיל", paused: "מושהה",
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

const ENTITY_ICONS: Record<string, string> = {
  ticket: "🎫", project: "📁", payment: "💳", file: "📎", comment: "💬",
};
const ENTITY_LABELS: Record<string, string> = {
  ticket: "טיקט", project: "פרויקט", payment: "תשלום", file: "קובץ", comment: "הערה",
};
const ACTION_LABELS: Record<string, string> = {
  created: "נוצר", updated: "עודכן", status_changed: "שינוי סטטוס", commented: "תגובה", uploaded: "קובץ הועלה",
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

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-6xl">

      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">לוח בקרה</h1>
          <p className="text-xs text-gray-400 mt-0.5">AP Automations — ניהול פנימי</p>
        </div>
        <AdminSearch />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "סה״כ לקוחות",   value: clients.length,    color: "text-gray-800",    icon: Users,       accent: "#6366f1" },
          { label: "לקוחות פעילים", value: activeCount,        color: "text-[#1CA9C9]",  icon: Users,       accent: "#1CA9C9" },
          { label: "טיקטים פתוחים", value: openTickets.length, color: openTickets.length > 0 ? "text-orange-500" : "text-green-600", icon: TicketCheck, accent: openTickets.length > 0 ? "#f97316" : "#22c55e" },
          { label: "הכנסה (שולם)",  value: `₪${totalRevenue.toLocaleString("he-IL")}`, color: "text-green-600", icon: Banknote, accent: "#22c55e" },
        ].map(({ label, value, color, icon: Icon, accent }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
              </div>
            </div>
            <p className={`text-2xl font-black tabular-nums ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Clients + Invite */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Clients list */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-[#1CA9C9]" />
              <h2 className="font-bold text-sm text-gray-800">לקוחות ({clients.length})</h2>
            </div>
            <ExportButton type="clients" label="ייצא" />
          </div>
          {clients.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">אין לקוחות עדיין</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {clients.map((client) => {
                const lastPayment = client.payments?.[client.payments.length - 1];
                const payBadge = PAYMENT_BADGE[lastPayment?.status ?? "pending"];
                const openCount = client.tickets?.filter((t: { status: string }) => ["open", "in_progress"].includes(t.status)).length ?? 0;
                const clientStatus = client.status ?? "onboarding";

                return (
                  <Link
                    key={client.id}
                    href={`/admin/clients/${client.id}`}
                    className="px-5 py-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors block"
                  >
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${CLIENT_STATUS_DOT[clientStatus] ?? "bg-gray-300"}`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-800 truncate">{client.business_name}</p>
                      <p className="text-[11px] text-gray-400">
                        {client.projects?.length ?? 0} פרויקטים
                        {openCount > 0 && <span className="text-orange-500 font-medium"> · {openCount} טיקטים פתוחים</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CLIENT_STATUS_BADGE[clientStatus]}`}>
                        {CLIENT_STATUS_LABELS[clientStatus]}
                      </span>
                      {lastPayment && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${payBadge.class}`}>
                          {payBadge.label}
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Invite + Activity */}
        <div className="space-y-4">
          {/* Invite form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-[#1CA9C9]/10 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-[#1CA9C9]" />
              </div>
              <h2 className="font-bold text-sm text-gray-800">הזמנת לקוח</h2>
            </div>
            <form onSubmit={handleInvite} className="space-y-2">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="כתובת מייל"
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1CA9C9]/50 focus:ring-1 focus:ring-[#1CA9C9]/20"
                required
              />
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1CA9C9] text-white text-sm font-semibold hover:bg-[#1898B5] transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {inviteLoading ? "שולח..." : "שליחת הזמנה"}
              </button>
            </form>
            {inviteMsg && (
              <p className={`text-xs mt-2 ${inviteMsg.startsWith("✓") ? "text-green-600" : "text-red-500"}`}>
                {inviteMsg}
              </p>
            )}
          </div>

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                <div className="w-1 h-4 rounded-full bg-indigo-400" />
                <h2 className="font-bold text-sm text-gray-800">פעילות אחרונה</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {recentActivity.slice(0, 5).map((entry) => (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-2.5">
                    <span className="text-sm flex-shrink-0">{ENTITY_ICONS[entry.entity_type] ?? "·"}</span>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-700">
                        {entry.clients?.business_name && <span className="text-[#1CA9C9]">{entry.clients.business_name} · </span>}
                        {ENTITY_LABELS[entry.entity_type]} {ACTION_LABELS[entry.action]}
                      </p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(entry.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Open tickets */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-orange-400" />
            <h2 className="font-bold text-sm text-gray-800">טיקטים פתוחים ({openTickets.length})</h2>
          </div>
          <ExportButton type="tickets" label="ייצא" />
        </div>
        {openTickets.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">אין טיקטים פתוחים ✓</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {openTickets.map((ticket) => (
              <div key={ticket.id} className="px-5 py-3.5 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm text-gray-800 truncate">{ticket.subject}</span>
                    <PriorityBadge priority={ticket.priority} />
                    <StatusBadge status={ticket.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {ticket.clients?.business_name}
                    {ticket.clients?.phone && ` · ${ticket.clients.phone}`}
                  </p>
                </div>
                <select
                  defaultValue={ticket.status}
                  onChange={(e) => handleStatusChange(ticket.id, e.target.value, ticket.clients?.phone, ticket.clients?.business_name, ticket.subject)}
                  className="border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs outline-none focus:border-[#1CA9C9] bg-white text-gray-700 flex-shrink-0"
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
