import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import { Folders, TicketCheck, FileStack, Clock, ArrowLeft } from "lucide-react";

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
  created: "נוצר",
  updated: "עודכן",
  status_changed: "שינוי סטטוס",
  commented: "תגובה חדשה",
  uploaded: "קובץ הועלה",
};

const ENTITY_LABELS: Record<string, string> = {
  ticket: "טיקט",
  project: "פרויקט",
  payment: "תשלום",
  file: "קובץ",
  comment: "הערה",
};

const ENTITY_ICONS: Record<string, string> = {
  ticket: "🎫",
  project: "📁",
  payment: "💳",
  file: "📎",
  comment: "💬",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: client },
    { data: projects },
    { data: tickets },
    { data: files },
    { data: activity },
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("user_id", user.id).single(),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("tickets").select("*").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }),
    supabase.from("client_files").select("id").limit(100),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(6),
  ]);

  const avgProgress =
    projects && projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_pct ?? 0), 0) / projects.length)
      : 0;

  const liveCount = projects?.filter((p) => p.status === "live").length ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">

      {/* Welcome banner */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-gray-400 mb-0.5">ברוכים הבאים</p>
          <h1 className="text-xl font-black text-gray-900">{client?.business_name ?? "לקוח"}</h1>
          <p className="text-sm text-gray-500 mt-0.5">פורטל AP Automations</p>
        </div>
        <div className="text-left flex-shrink-0">
          <p className="text-[11px] text-gray-400 mb-1 text-center">התקדמות כוללת</p>
          <p className="text-4xl font-black text-[#1CA9C9] leading-none text-center">{avgProgress}%</p>
          <p className="text-[10px] text-gray-400 mt-1 text-center">{liveCount}/{projects?.length ?? 0} Live</p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "פרויקטים", value: projects?.length ?? 0, sub: `${liveCount} פעילים`, icon: Folders, color: "#1CA9C9" },
          { label: "טיקטים פתוחים", value: tickets?.length ?? 0, sub: "דורשים מענה", icon: TicketCheck, color: (tickets?.length ?? 0) > 0 ? "#f97316" : "#22c55e" },
          { label: "מסמכים", value: files?.length ?? 0, sub: "קבצים ונכסים", icon: FileStack, color: "#6366f1" },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}18` }}>
                <Icon className="w-3.5 h-3.5" style={{ color }} />
              </div>
            </div>
            <p className="text-3xl font-black" style={{ color }}>{value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* Projects */}
      <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-[#1CA9C9]" />
            <h2 className="font-bold text-sm text-gray-800">פרויקטים פעילים</h2>
          </div>
          <span className="text-xs text-gray-400 font-medium">{projects?.length ?? 0} סה"כ</span>
        </div>

        {projects && projects.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {projects.map((project) => (
              <div key={project.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Color dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  project.status === "live" ? "bg-green-400" :
                  project.status === "testing" ? "bg-orange-400" : "bg-[#1CA9C9]"
                }`} />

                {/* Name + description */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{project.name}</p>
                  {project.description && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{project.description}</p>
                  )}
                </div>

                {/* Progress */}
                <div className="hidden sm:flex items-center gap-2 w-28">
                  <Progress value={project.progress_pct} className="h-1.5 flex-1" />
                  <span className="text-xs font-bold text-[#1CA9C9] w-8 text-left tabular-nums">
                    {project.progress_pct}%
                  </span>
                </div>

                {/* Status badge */}
                <StatusBadge status={project.status} />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-sm text-gray-400">
            הפרויקטים יופיעו כאן לאחר שיפתחו עבורך
          </div>
        )}
      </section>

      {/* Tickets + Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* Open tickets */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-1 h-4 rounded-full bg-orange-400" />
              <h2 className="font-bold text-sm text-gray-800">טיקטים פתוחים</h2>
            </div>
            <Link href="/tickets" className="text-xs text-[#1CA9C9] hover:underline flex items-center gap-0.5">
              הכל <ArrowLeft className="w-3 h-3" />
            </Link>
          </div>

          {tickets && tickets.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {tickets.slice(0, 4).map((t) => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-700 truncate">{t.subject}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">אין טיקטים פתוחים ✓</div>
          )}

          <div className="px-5 py-3 border-t border-gray-100">
            <Link
              href="/tickets"
              className="block w-full text-center py-2 rounded-xl border border-[#1CA9C9]/30 text-[#1CA9C9] text-sm font-semibold hover:bg-[#1CA9C9]/5 transition-colors"
            >
              + פתיחת טיקט חדש
            </Link>
          </div>
        </section>

        {/* Recent activity */}
        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-indigo-400" />
            <h2 className="font-bold text-sm text-gray-800">פעילות אחרונה</h2>
          </div>

          {activity && activity.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {activity.map((entry) => (
                <div key={entry.id} className="px-5 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors">
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {ENTITY_ICONS[entry.entity_type] ?? "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-700">
                      {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}{" "}
                      {ACTION_LABELS[entry.action] ?? entry.action}
                      {entry.details?.subject ? `: ${entry.details.subject}` : ""}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-gray-300" />
                      <p className="text-[10px] text-gray-400">
                        {entry.actor === "admin" ? "הצוות" : "את"} · {timeAgo(entry.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-400">אין פעילות עדיין</div>
          )}
        </section>
      </div>
    </div>
  );
}
