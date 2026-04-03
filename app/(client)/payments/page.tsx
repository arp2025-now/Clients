import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getClientPayments } from "./actions";

const STATUS_LABELS: Record<string, string> = {
  paid: "שולם",
  pending: "ממתין",
  overdue: "באיחור",
};

const STATUS_STYLES: Record<string, string> = {
  paid: "bg-green-500/15 text-green-600 border-green-500/25",
  pending: "bg-yellow-500/15 text-yellow-600 border-yellow-500/25",
  overdue: "bg-red-500/15 text-red-500 border-red-500/25",
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency }).format(amount);
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payments = await getClientPayments();

  const totalPaid = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto w-full">
      {/* Stats */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">שולם</p>
            <p className="text-xl font-black text-green-600 tabular-nums">
              {formatAmount(totalPaid, "ILS")}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">ממתין</p>
            <p className="text-xl font-black text-yellow-600 tabular-nums">
              {formatAmount(totalPending, "ILS")}
            </p>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">באיחור</p>
            <p className="text-xl font-black text-red-500 tabular-nums">
              {formatAmount(totalOverdue, "ILS")}
            </p>
          </div>
        </div>
      )}

      {/* Payments list */}
      {payments.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-3">
          <p className="text-3xl">₪</p>
          <p className="font-semibold">אין תשלומים עדיין</p>
          <p className="text-sm text-muted-foreground">
            פרטי תשלומים יופיעו כאן לאחר הגדרתם
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center justify-between gap-4 hover:border-[#1CA9C9]/30 transition-colors"
            >
              <div className="space-y-1 min-w-0">
                <p className="font-semibold text-lg tabular-nums">
                  {formatAmount(p.amount, p.currency ?? "ILS")}
                </p>
                <div className="text-xs text-muted-foreground space-y-0.5">
                  {p.due_date && (
                    <p>תאריך לתשלום: {formatDate(p.due_date)}</p>
                  )}
                  {p.paid_date && (
                    <p className="text-green-600">שולם ב: {formatDate(p.paid_date)}</p>
                  )}
                  {p.notes && <p className="text-muted-foreground">{p.notes}</p>}
                </div>
              </div>
              <span
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${
                  STATUS_STYLES[p.status] ?? "bg-gray-500/15 text-gray-500"
                }`}
              >
                {STATUS_LABELS[p.status] ?? p.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
