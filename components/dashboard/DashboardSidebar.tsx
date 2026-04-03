"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "◉", label: "דשבורד" },
  { href: "/tickets",   icon: "◎", label: "טיקטים" },
  { href: "/documents", icon: "📎", label: "מסמכים" },
  { href: "/payments",  icon: "₪",  label: "תשלומים" },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-52 flex-col py-5 bg-sidebar border-l border-border shadow-sm flex-shrink-0">
        {/* Logo */}
        <div className="px-4 mb-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg ap-gradient flex items-center justify-center text-white font-black text-xs flex-shrink-0">
              AP
            </div>
            <div className="leading-tight">
              <p className="font-black text-sm">AP<span className="text-[#1CA9C9]">.</span>Automations</p>
              <p className="text-[10px] text-muted-foreground">פורטל לקוחות</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 px-3 flex-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[rgba(28,169,201,0.12)] text-[#1CA9C9] border border-[#1CA9C9]/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
              >
                <span className="text-base w-5 text-center flex-shrink-0">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 pt-3 border-t border-border mt-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all w-full font-medium"
          >
            <span className="text-base w-5 text-center">↩</span>
            <span>יציאה</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 right-0 left-0 z-50 bg-sidebar border-t border-border flex items-center justify-around px-2 py-2 safe-area-bottom">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                active ? "text-[#1CA9C9]" : "text-muted-foreground"
              )}
            >
              <span className="text-lg leading-none">{item.icon}</span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-muted-foreground hover:text-red-400 transition-all min-w-[52px]"
        >
          <span className="text-lg leading-none">↩</span>
          <span className="text-[10px] font-medium">יציאה</span>
        </button>
      </nav>
    </>
  );
}
