"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/dashboard", icon: "◉", label: "דשבורד" },
  { href: "/tickets",   icon: "◎", label: "טיקטים" },
  { href: "/documents", icon: "📎", label: "מסמכים" },
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
    <aside className="w-14 flex flex-col items-center py-4 gap-3 bg-sidebar border-l border-border shadow-sm">
      {/* Logo */}
      <div className="w-8 h-8 rounded-lg ap-gradient flex items-center justify-center text-white font-black text-xs mb-2">
        AP
      </div>

      <div className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(
                "w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all",
                active
                  ? "bg-[rgba(28,169,201,0.15)] text-[#1CA9C9] border border-[#1CA9C9]/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {item.icon}
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        title="יציאה"
        className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-all text-base"
      >
        ↩
      </button>
    </aside>
  );
}
