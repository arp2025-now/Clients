"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  MessageCircle,
  FileText,
  CreditCard,
  LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "דשבורד" },
  { href: "/tickets",   icon: MessageCircle,   label: "טיקטים" },
  { href: "/documents", icon: FileText,         label: "מסמכים" },
  { href: "/payments",  icon: CreditCard,       label: "תשלומים" },
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
      <aside className="hidden md:flex w-56 flex-col bg-white border-l border-gray-200 shadow-sm flex-shrink-0 h-full">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl ap-gradient flex items-center justify-center text-white font-black text-sm flex-shrink-0">
              AP
            </div>
            <div className="leading-tight">
              <p className="font-black text-sm text-gray-900">AP<span className="text-[#1CA9C9]">.</span>Automations</p>
              <p className="text-[10px] text-gray-400 font-medium">פורטל לקוחות</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-1 p-3 flex-1 mt-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  active
                    ? "bg-[#1CA9C9] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:text-red-500 hover:bg-red-50 transition-all w-full font-medium"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span>יציאה</span>
          </button>
        </div>
      </aside>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 right-0 left-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                active ? "text-[#1CA9C9]" : "text-gray-400"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl text-gray-400 hover:text-red-400 transition-all min-w-[52px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">יציאה</span>
        </button>
      </nav>
    </>
  );
}
