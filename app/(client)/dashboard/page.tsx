import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: client }, { data: projects }, { data: tickets }] = await Promise.all([
    supabase.from("clients").select("*").eq("user_id", user.id).single(),
    supabase.from("projects").select("*").order("created_at"),
    supabase.from("tickets").select("*").in("status", ["open", "in_progress"]).order("created_at", { ascending: false }),
  ]);

  // Calculate overall progress from projects
  const avgProgress =
    projects && projects.length > 0
      ? Math.round(projects.reduce((sum, p) => sum + (p.progress_pct ?? 0), 0) / projects.length)
      : 0;

  const liveCount = projects?.filter((p) => p.status === "live").length ?? 0;

  return (
    <div className="flex h-full">
      {/* CENTER — projects + tickets */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-bold">
            שלום, {client?.business_name ?? "לקוח"} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            הנה סיכום הפרויקטים שלך
          </p>
        </div>

        {/* Projects */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            פרויקטים פעילים
          </h2>
          {projects && projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="bg-card border border-border rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-sm">{project.name}</span>
                    <StatusBadge status={project.status} />
                  </div>
                  {project.description && (
                    <p className="text-xs text-muted-foreground">{project.description}</p>
                  )}
                  <div className="flex items-center gap-3">
                    <Progress value={project.progress_pct} className="flex-1 h-1.5" />
                    <span className="text-xs font-bold text-[#1CA9C9] tabular-nums w-8 text-left">
                      {project.progress_pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              הפרויקטים יופיעו כאן לאחר שענת תפתח אותם
            </div>
          )}
        </section>

        {/* Open tickets */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              טיקטים פתוחים
            </h2>
            <Link
              href="/tickets"
              className="text-xs text-[#1CA9C9] hover:underline"
            >
              כל הטיקטים ←
            </Link>
          </div>

          {tickets && tickets.length > 0 ? (
            <div className="space-y-2">
              {tickets.slice(0, 3).map((t) => (
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
            <div className="bg-card border border-border rounded-xl p-4 text-center text-muted-foreground text-sm">
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
      </div>

      {/* RIGHT PANEL — progress */}
      <div className="w-52 border-r border-border p-4 space-y-4 overflow-y-auto hidden md:block">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          התקדמות
        </h2>

        <div className="bg-card border border-border rounded-xl p-4 text-center space-y-3">
          <div className="text-4xl font-black ap-gradient-text">{avgProgress}%</div>
          <Progress value={avgProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {liveCount} מתוך {projects?.length ?? 0} פרויקטים Live
          </p>
        </div>

        {/* Quick stats */}
        <div className="space-y-2">
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">טיקטים פתוחים</p>
            <p className="text-2xl font-bold mt-1" style={{ color: tickets && tickets.length > 0 ? "#eab308" : "#22c55e" }}>
              {tickets?.length ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">פרויקטים</p>
            <p className="text-2xl font-bold mt-1 text-[#1CA9C9]">
              {projects?.length ?? 0}
            </p>
          </div>
        </div>

        {/* Onboarding reminder if no client record */}
        {!client && (
          <div className="bg-[rgba(28,169,201,0.08)] border border-[#1CA9C9]/30 rounded-xl p-3 text-xs text-[#1CA9C9]">
            <p className="font-semibold mb-1">טרם מילאת את הטופס</p>
            <Link href="/onboarding" className="underline">
              לחצי כאן להשלמה ←
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
