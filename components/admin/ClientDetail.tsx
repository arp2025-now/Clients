"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import { addProject, addPayment, updateProjectProgress } from "@/app/(admin)/admin/actions";

const PAYMENT_BADGE: Record<string, string> = {
  paid:    "bg-green-500/15 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  overdue: "bg-red-500/15 text-red-400 border-red-500/20",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientDetail({ client, projects, payments, customFields, credentials }: any) {
  const router = useRouter();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [addingProject, setAddingProject] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", status: "pending", due_date: "", notes: "" });

  async function handleAddProject() {
    await addProject(client.id, projectForm.name, projectForm.description);
    setProjectForm({ name: "", description: "" });
    setAddingProject(false);
    router.refresh();
  }

  async function handleAddPayment() {
    await addPayment(client.id, parseFloat(paymentForm.amount), paymentForm.status, paymentForm.due_date, paymentForm.notes);
    setPaymentForm({ amount: "", status: "pending", due_date: "", notes: "" });
    setAddingPayment(false);
    router.refresh();
  }

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      {/* Back */}
      <Link href="/admin" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
        → חזרה לדשבורד
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-black">{client.business_name}</h1>
        <div className="flex gap-4 text-sm text-muted-foreground mt-1">
          {client.phone && <span>📞 {client.phone}</span>}
          {client.website_url && (
            <a href={client.website_url} target="_blank" rel="noreferrer" className="text-[#1CA9C9] hover:underline" dir="ltr">
              🌐 {client.website_url}
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Projects */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרויקטים</h2>
            <button onClick={() => setAddingProject(!addingProject)} className="text-xs text-[#1CA9C9] hover:underline">
              + הוסף
            </button>
          </div>

          {addingProject && (
            <div className="bg-card border border-[#1CA9C9]/30 rounded-xl p-4 space-y-3">
              <Input placeholder="שם הפרויקט" value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })} />
              <Input placeholder="תיאור" value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAddingProject(false)} size="sm">ביטול</Button>
                <Button className="ap-gradient text-white" size="sm" onClick={handleAddProject} disabled={!projectForm.name}>הוסף</Button>
              </div>
            </div>
          )}

          {projects.map((p: { id: string; name: string; description?: string; status: string; progress_pct: number }) => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{p.name}</span>
                <StatusBadge status={p.status} />
              </div>
              {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
              <div className="flex items-center gap-3">
                <Progress value={p.progress_pct} className="flex-1 h-1.5" />
                <span className="text-xs text-[#1CA9C9] font-bold w-8 text-left">{p.progress_pct}%</span>
              </div>
              {/* Quick progress update */}
              <div className="flex gap-2 items-center mt-1">
                <select
                  defaultValue={p.status}
                  onChange={(e) => updateProjectProgress(p.id, e.target.value, p.progress_pct).then(() => router.refresh())}
                  className="bg-secondary border border-border rounded px-2 py-1 text-xs"
                >
                  <option value="in_progress">בעבודה</option>
                  <option value="testing">בבדיקה</option>
                  <option value="live">Live</option>
                </select>
                <input
                  type="range" min={0} max={100} step={5}
                  defaultValue={p.progress_pct}
                  className="flex-1 accent-[#1CA9C9]"
                  onMouseUp={(e) => updateProjectProgress(p.id, p.status, parseInt((e.target as HTMLInputElement).value)).then(() => router.refresh())}
                />
              </div>
            </div>
          ))}
        </section>

        {/* Payments */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">תשלומים</h2>
            <button onClick={() => setAddingPayment(!addingPayment)} className="text-xs text-[#1CA9C9] hover:underline">
              + הוסף
            </button>
          </div>

          {addingPayment && (
            <div className="bg-card border border-[#1CA9C9]/30 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">סכום (₪)</Label>
                  <Input type="number" placeholder="3500" dir="ltr" value={paymentForm.amount} onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">סטטוס</Label>
                  <select className="w-full bg-input border border-border rounded-lg px-3 py-2 text-sm" value={paymentForm.status} onChange={(e) => setPaymentForm({ ...paymentForm, status: e.target.value })}>
                    <option value="pending">ממתין</option>
                    <option value="paid">שולם</option>
                    <option value="overdue">באיחור</option>
                  </select>
                </div>
              </div>
              <Input type="date" dir="ltr" value={paymentForm.due_date} onChange={(e) => setPaymentForm({ ...paymentForm, due_date: e.target.value })} />
              <Input placeholder="הערות" value={paymentForm.notes} onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })} />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setAddingPayment(false)}>ביטול</Button>
                <Button className="ap-gradient text-white" size="sm" onClick={handleAddPayment} disabled={!paymentForm.amount}>הוסף</Button>
              </div>
            </div>
          )}

          {payments.map((p: { id: string; amount: number; currency: string; status: string; due_date?: string; notes?: string }) => (
            <div key={p.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <span className="font-bold">₪{p.amount.toLocaleString("he-IL")}</span>
                {p.due_date && <span className="text-xs text-muted-foreground mr-2">{p.due_date}</span>}
                {p.notes && <p className="text-xs text-muted-foreground mt-0.5">{p.notes}</p>}
              </div>
              <Badge variant="outline" className={`text-[10px] px-2 ${PAYMENT_BADGE[p.status]}`}>
                {p.status === "paid" ? "שולם" : p.status === "pending" ? "ממתין" : "באיחור"}
              </Badge>
            </div>
          ))}
          {payments.length === 0 && <p className="text-sm text-muted-foreground">אין תשלומים עדיין</p>}
        </section>
      </div>

      {/* Credentials — decrypted, server-rendered */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          גישות מערכות 🔓
        </h2>
        {credentials.length === 0 ? (
          <p className="text-sm text-muted-foreground">הלקוח טרם מילא גישות</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {credentials.map((cred: { id: string; system_name: string; url?: string; username?: string; password?: string; notes?: string }) => (
              <div key={cred.id} className="bg-card border border-border rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1CA9C9]">{cred.system_name}</span>
                  {cred.url && (
                    <a href={cred.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground" dir="ltr">
                      🔗 פתח
                    </a>
                  )}
                </div>
                {cred.url && <p className="text-[10px] text-muted-foreground" dir="ltr">{cred.url}</p>}
                {cred.username && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">משתמש: </span>
                    <span dir="ltr">{cred.username}</span>
                  </div>
                )}
                {cred.password && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground">סיסמה: </span>
                    <span dir="ltr" className="font-mono">
                      {showPasswords[cred.id] ? cred.password : "••••••••"}
                    </span>
                    <button
                      onClick={() => setShowPasswords((p) => ({ ...p, [cred.id]: !p[cred.id] }))}
                      className="text-[#1CA9C9] hover:underline text-[10px]"
                    >
                      {showPasswords[cred.id] ? "הסתר" : "הצג"}
                    </button>
                  </div>
                )}
                {cred.notes && <p className="text-[10px] text-muted-foreground">{cred.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Custom fields */}
      {customFields.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">פרטים נוספים</h2>
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            {customFields.map((f: { id: string; field_name: string; field_value_encrypted?: string }) => (
              <div key={f.id} className="text-sm">
                <span className="text-muted-foreground">{f.field_name}: </span>
                <span>{f.field_value_encrypted ?? "—"}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
