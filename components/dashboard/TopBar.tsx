"use client";

import { usePathname } from "next/navigation";
import { NotificationBell } from "./NotificationBell";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "דשבורד",
  "/tickets": "הטיקטים שלי",
  "/documents": "המסמכים שלי",
  "/payments": "התשלומים שלי",
  "/onboarding": "קליטת לקוח",
};

export function TopBar() {
  const pathname = usePathname();
  const title = PAGE_TITLES[pathname] ?? "פורטל לקוחות";

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-border bg-background/80 backdrop-blur-sm flex-shrink-0">
      <h1 className="font-bold text-base">{title}</h1>
      <div className="flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}
