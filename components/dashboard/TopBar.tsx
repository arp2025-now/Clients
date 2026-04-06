"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";
import { ChevronLeft } from "lucide-react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "דשבורד",
  "/tickets":   "טיקטים",
  "/documents": "מסמכים",
  "/payments":  "תשלומים",
  "/onboarding":"קליטת לקוח",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "פורטל לקוחות";

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-gray-200 bg-white flex-shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm text-gray-400">
        <span className="font-medium text-gray-700">{title}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <NotificationBell />
      </div>
    </header>
  );
}
