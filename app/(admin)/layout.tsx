export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center justify-between">
        <span className="font-black text-lg">
          AP<span className="text-[#1CA9C9]">.</span>Automations{" "}
          <span className="text-xs font-normal text-muted-foreground">Admin</span>
        </span>
        <span className="text-xs text-muted-foreground">פנימי בלבד</span>
      </header>
      <main>{children}</main>
    </div>
  );
}
