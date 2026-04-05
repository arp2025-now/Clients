"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { searchAll } from "@/app/(admin)/admin/actions";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SearchResults = { clients: any[]; tickets: any[]; files: any[] };

const STATUS_LABELS: Record<string, string> = {
  open: "פתוח", in_progress: "בטיפול", resolved: "נפתר", closed: "סגור",
  onboarding: "קליטה", active: "פעיל", paused: "מושהה",
};

export function AdminSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      setOpen(false);
      return;
    }
    setLoading(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      const data = await searchAll(query);
      setResults(data);
      setOpen(true);
      setLoading(false);
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const total = results ? results.clients.length + results.tickets.length + results.files.length : 0;

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <div className="relative">
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">🔍</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results && setOpen(true)}
          placeholder="חיפוש לקוחות, טיקטים, קבצים..."
          className="w-full bg-secondary border border-border rounded-xl px-4 py-2 pr-9 text-sm focus:outline-none focus:border-[#1CA9C9]/50 transition-colors"
          dir="rtl"
        />
        {loading && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">טוען...</span>
        )}
      </div>

      {open && results && (
        <div className="absolute top-full mt-2 right-0 left-0 z-50 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
          {total === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">לא נמצאו תוצאות עבור &quot;{query}&quot;</p>
          ) : (
            <div className="max-h-80 overflow-y-auto divide-y divide-border">
              {/* Clients */}
              {results.clients.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground px-3 pt-2 pb-1 uppercase tracking-wider">לקוחות</p>
                  {results.clients.map((c) => (
                    <button
                      key={c.id}
                      className="w-full text-right px-3 py-2 hover:bg-[#1CA9C9]/08 transition-colors flex items-center justify-between gap-3"
                      onClick={() => { router.push(`/admin/clients/${c.id}`); setOpen(false); setQuery(""); }}
                    >
                      <span className="text-sm font-medium">{c.business_name}</span>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{STATUS_LABELS[c.status] ?? c.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Tickets */}
              {results.tickets.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground px-3 pt-2 pb-1 uppercase tracking-wider">טיקטים</p>
                  {results.tickets.map((t) => (
                    <button
                      key={t.id}
                      className="w-full text-right px-3 py-2 hover:bg-[#1CA9C9]/08 transition-colors flex items-center justify-between gap-3"
                      onClick={() => {
                        const clientId = t.client_id;
                        router.push(`/admin/clients/${clientId}`);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <div className="min-w-0">
                        <p className="text-sm truncate">{t.subject}</p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <p className="text-[10px] text-muted-foreground">{Array.isArray(t.clients) ? t.clients[0]?.business_name : (t.clients as any)?.business_name}</p>
                      </div>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">{STATUS_LABELS[t.status] ?? t.status}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Files */}
              {results.files.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground px-3 pt-2 pb-1 uppercase tracking-wider">קבצים</p>
                  {results.files.map((f) => (
                    <button
                      key={f.id}
                      className="w-full text-right px-3 py-2 hover:bg-[#1CA9C9]/08 transition-colors flex items-center gap-3"
                      onClick={() => {
                        router.push(`/admin/clients/${f.client_id}`);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="text-base flex-shrink-0">📎</span>
                      <div className="min-w-0">
                        <p className="text-sm truncate">{f.display_name || f.filename}</p>
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <p className="text-[10px] text-muted-foreground">{Array.isArray(f.clients) ? f.clients[0]?.business_name : (f.clients as any)?.business_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
