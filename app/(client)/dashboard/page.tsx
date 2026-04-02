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
        {/* Welcome banner */}
        <div className="relative overflow-hidden rounded-2xl p-5 space-y-1"
          style={{ background: "linear-gradient(135deg, rgba(28,169,201,0.12) 0%, rgba(66,152,166,0.08) 100%)", border: "1px solid rgba(28,169,201,0.2)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">
                שלום, {client?.business_name ?? "לקוח"} 👋
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                ברוכים הבאים לפורטל הלקוחות של AP Automations
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl ap-gradient flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              AP
            </div>
          </div>
        </div>

        {/* Projects */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
            <span className="w-1 h-4 rounded-full ap-gradient inline-block" />
            פרויקטים פעילים
          </h2>
          {projects && projects.length > 0 ? (
            <div className="space-y-3">
              {projects.map((project) => {
                const borderColor = project.status === "live" ? "border-r-green-500" : project.status === "testing" ? "border-r-orange-400" : "border-r-[#1CA9C9]";
                return (
                <div
                  key={project.id}
                  className={`bg-card border border-border border-r-2 ${borderColor} rounded-xl p-4 space-y-2 hover:border-[#1CA9C9]/30 transition-colors`}
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
                );
              })}
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
      <div className="w-56 border-r border-border p-4 space-y-4 overflow-y-auto hidden md:block">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <span className="w-1 h-3 rounded-full ap-gradient inline-block" />
          התקדמות
        </h2>

        <div className="rounded-2xl p-5 text-center space-y-3"
          style={{ background: "linear-gradient(135deg, rgba(28,169,201,0.1) 0%, rgba(66,152,166,0.06) 100%)", border: "1px solid rgba(28,169,201,0.2)" }}>
          <div className="text-5xl font-black ap-gradient-text leading-none">{avgProgress}%</div>
          <Progress value={avgProgress} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {liveCount}/{projects?.length ?? 0} פרויקטים Live
          </p>
        </div>

        {/* Quick stats */}
        <div className="space-y-2">
          <div className="bg-card border border-border rounded-xl p-3 hover:border-yellow-500/20 transition-colors">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">טיקטים פתוחים</p>
            <p className="text-2xl font-black mt-1" style={{ color: tickets && tickets.length > 0 ? "#eab308" : "#22c55e" }}>
              {tickets?.length ?? 0}
            </p>
          </div>
          <div className="bg-card border border-border rounded-xl p-3 hover:border-[#1CA9C9]/20 transition-colors">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">פרויקטים</p>
            <p className="text-2xl font-black mt-1 text-[#1CA9C9]">
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
