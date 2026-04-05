import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

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
  status_changed: "שונה סטטוס",
  commented: "הוסף תגובה",
  uploaded: "הועלה קובץ",
};

const ENTITY_LABELS: Record<string, string> = {
  ticket: "טיקט",
  project: "פרויקט",
  payment: "תשלום",
  file: "קובץ",
  comment: "הערה",
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
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("tickets").select("*").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }),
    supabase.from("client_files").select("id").limit(100),
    supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const avgProgress =
    projects && projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_pct ?? 0), 0) / projects.length)
      : 0;

  const liveCount = projects?.filter((p) => p.status === "live").length ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl mx-auto w-full">
      {/* Welcome banner */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: "linear-gradient(135deg, rgba(28,169,201,0.15) 0%, rgba(66,152,166,0.08) 100%)",
          border: "1px solid rgba(28,169,201,0.25)",
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">שלום, {client?.business_name ?? "לקוח"} 👋</h2>
            <p className="text-sm text-muted-foreground mt-1">
              ברוכים הבאים לפורטל AP Automations
            </p>
          </div>
          <div className="text-3xl sm:text-5xl font-black ap-gradient-text leading-none flex-shrink-0">
            {avgProgress}%
          </div>
        </div>
        <Progress value={avgProgress} className="mt-4 h-1.5" />
        <p className="text-xs text-muted-foreground mt-2">
          {liveCount} מתוך {projects?.length ?? 0} פרויקטים Live
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">פרויקטים</p>
          <p className="text-3xl font-black text-[#1CA9C9]">{projects?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">{liveCount} Live</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">טיקטים פתוחים</p>
          <p className="text-3xl font-black" style={{ color: (tickets?.length ?? 0) > 0 ? "#eab308" : "#22c55e" }}>
            {tickets?.length ?? 0}
          </p>
          <p className="text-xs text-muted-foreground">דורשים מענה</p>
        </div>
        <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">קבצים</p>
          <p className="text-3xl font-black text-foreground">{files?.length ?? 0}</p>
          <p className="text-xs text-muted-foreground">מסמכים ונכסים</p>
        </div>
      </div>

      {/* Projects grid */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-4 rounded-full ap-gradient inline-block" />
          פרויקטים פעילים
        </h2>
        {projects && projects.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {projects.map((project) => {
              const borderColor =
                project.status === "live"
                  ? "border-t-green-500"
                  : project.status === "testing"
                  ? "border-t-orange-400"
                  : "border-t-[#1CA9C9]";
              return (
                <div
                  key={project.id}
                  className={`bg-card border border-border border-t-2 ${borderColor} rounded-2xl overflow-hidden hover:shadow-md transition-shadow`}
                >
                  {/* Cover image */}
                  {project.image_url ? (
                    <img
                      src={project.image_url}
                      alt={project.name}
                      className="w-full h-36 object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-36 flex items-center justify-center text-4xl"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(28,169,201,0.12) 0%, rgba(66,152,166,0.06) 100%)",
                      }}
                    >
                      ◎
                    </div>
                  )}
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm leading-tight">{project.name}</span>
                      <StatusBadge status={project.status} />
                    </div>
                    {project.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{project.description}</p>
                    )}
                    <div className="flex items-center gap-3">
                      <Progress value={project.progress_pct} className="flex-1 h-1.5" />
                      <span className="text-xs font-bold text-[#1CA9C9] tabular-nums w-8 text-left">
                        {project.progress_pct}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">
            הפרויקטים יופיעו כאן לאחר שיפתחו עבורך
          </div>
        )}
      </section>

      {/* Open tickets + recent activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Open tickets */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              טיקטים פתוחים
            </h2>
            <Link href="/tickets" className="text-xs text-[#1CA9C9] hover:underline">
              כל הטיקטים ←
            </Link>
          </div>
          {tickets && tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-sm truncate">{t.subject}</span>
                  <PriorityBadge priority={t.priority} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground text-sm">
              אין טיקטים פתוחים ✓
            </div>
          )}
          <Link
            href="/tickets"
            className="mt-3 block w-full text-center py-2.5 rounded-xl border border-[#1CA9C9]/30 text-[#1CA9C9] text-sm font-semibold hover:bg-[rgba(28,169,201,0.08)] transition-colors"
          >
            פתיחת טיקט חדש +
          </Link>
        </section>

        {/* Recent activity */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            פעילות אחרונה
          </h2>
          {activity && activity.length > 0 ? (
            <div className="space-y-2">
              {activity.map((entry) => (
                <div
                  key={entry.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3"
                >
                  <span className="text-base mt-0.5 flex-shrink-0">
                    {entry.entity_type === "ticket" ? "◎" :
                     entry.entity_type === "file" ? "📎" :
                     entry.entity_type === "comment" ? "💬" :
                     entry.entity_type === "project" ? "◉" : "·"}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-medium">
                      {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type}{" "}
                      {ACTION_LABELS[entry.action] ?? entry.action}
                      {entry.details?.subject ? `: ${entry.details.subject}` : ""}
                    </p>
                    {entry.details?.from && entry.details?.to && (
                      <p className="text-[10px] text-muted-foreground">
                        {entry.details.from} ← {entry.details.to}
                      </p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {entry.actor === "admin" ? "הצוות" : "את"} · {timeAgo(entry.created_at)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-5 text-center text-muted-foreground text-sm">
              אין פעילות עדיין
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
