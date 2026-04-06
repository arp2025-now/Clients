import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getClientPayments } from "./actions";
import { CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  paid: "שולם", pending: "ממתין", overdue: "באיחור",
};

const STATUS_STYLES: Record<string, string> = {
  paid:    "bg-green-100 text-green-700 border-green-200",
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  overdue: "bg-red-100 text-red-600 border-red-200",
};

const STATUS_ICONS: Record<string, React.ElementType> = {
  paid: CheckCircle, pending: Clock, overdue: AlertCircle,
};

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
}

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("he-IL", { style: "currency", currency }).format(amount);
}

export default async function PaymentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const payments = await getClientPayments();

  const totalPaid    = payments.filter((p) => p.status === "paid").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalOverdue = payments.filter((p) => p.status === "overdue").reduce((s, p) => s + (p.amount ?? 0), 0);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl mx-auto w-full">

      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1CA9C9]/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-[#1CA9C9]" />
        </div>
        <div>
          <h1 className="text-lg font-black text-gray-900">תשלומים</h1>
          <p className="text-xs text-gray-400">{payments.length} רשומות · עדכני</p>
        </div>
      </div>

      {/* Stats */}
      {payments.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "שולם", amount: totalPaid, color: "text-green-600", bg: "bg-green-50 border-green-200" },
            { label: "ממתין", amount: totalPending, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
            { label: "באיחור", amount: totalOverdue, color: "text-red-500", bg: "bg-red-50 border-red-200" },
          ].map(({ label, amount, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 shadow-sm ${bg}`}>
              <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <p className={`text-lg font-black tabular-nums ${color}`}>{formatAmount(amount, "ILS")}</p>
            </div>
          ))}
        </div>
      )}

      {/* Payments list */}
      {payments.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#1CA9C9]/10 flex items-center justify-center mx-auto">
            <CreditCard className="w-6 h-6 text-[#1CA9C9]" />
          </div>
          <p className="font-bold text-gray-800">אין תשלומים עדיין</p>
          <p className="text-sm text-gray-400">פרטי תשלומים יופיעו כאן לאחר הגדרתם</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {payments.map((p) => {
              const StatusIcon = STATUS_ICONS[p.status] ?? Clock;
              return (
                <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    p.status === "paid" ? "bg-green-100" : p.status === "overdue" ? "bg-red-100" : "bg-yellow-100"
                  }`}>
                    <StatusIcon className={`w-4 h-4 ${
                      p.status === "paid" ? "text-green-600" : p.status === "overdue" ? "text-red-500" : "text-yellow-600"
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 tabular-nums">
                      {formatAmount(p.amount, p.currency ?? "ILS")}
                    </p>
                    <div className="text-[11px] text-gray-400 mt-0.5 space-y-0.5">
                      {p.due_date && <p>תאריך לתשלום: {formatDate(p.due_date)}</p>}
                      {p.paid_date && <p className="text-green-600">שולם ב: {formatDate(p.paid_date)}</p>}
                      {p.notes && <p>{p.notes}</p>}
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border flex-shrink-0 ${STATUS_STYLES[p.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABELS[p.status] ?? p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
