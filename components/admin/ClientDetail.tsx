"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { Progress } from "@/components/ui/progress";
import {
  addProject,
  addPayment,
  updateProjectProgress,
  updateClientStatus,
  updateClientNotes,
  uploadClientFile,
  deleteClientFile,
  getSignedDownloadUrl,
} from "@/app/(admin)/admin/actions";

const PAYMENT_BADGE: Record<string, string> = {
  paid:    "bg-green-500/15 text-green-400 border-green-500/20",
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  overdue: "bg-red-500/15 text-red-400 border-red-500/20",
};

const CLIENT_STATUS_STYLES: Record<string, string> = {
  onboarding: "bg-[rgba(28,169,201,0.15)] text-[#1CA9C9] border-[#1CA9C9]/30",
  active:     "bg-green-500/15 text-green-400 border-green-500/20",
  paused:     "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  onboarding: "קליטה",
  active:     "פעיל",
  paused:     "מושהה",
};

const FILE_TYPE_LABELS: Record<string, string> = {
  contract: "חוזה",
  spec:     "אפיון",
  other:    "אחר",
};

const FILE_TYPE_STYLES: Record<string, string> = {
  contract: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  spec:     "bg-blue-500/15 text-blue-400 border-blue-500/20",
  other:    "bg-gray-500/15 text-gray-400 border-gray-500/20",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientDetail({ client, projects, payments, files, credentials }: any) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [addingProject, setAddingProject] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [projectForm, setProjectForm] = useState({ name: "", description: "" });
  const [paymentForm, setPaymentForm] = useState({ amount: "", status: "pending", due_date: "", notes: "" });

  const [clientStatus, setClientStatus] = useState<string>(client.status ?? "onboarding");
  const [notes, setNotes] = useState<string>(client.admin_notes ?? "");
  const [notesSaving, setNotesSaving] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadFileType, setUploadFileType] = useState<"contract" | "spec" | "other">("other");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  async function handleStatusChange(newStatus: string) {
    setClientStatus(newStatus);
    await updateClientStatus(client.id, newStatus);
  }

  async function handleNotesSave() {
    setNotesSaving(true);
    await updateClientNotes(client.id, notes);
    setNotesSaving(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("clientId", client.id);
      formData.append("fileType", uploadFileType);
      const result = await uploadClientFile(formData);
      if (result.error) {
        alert("שגיאה בהעלאת הקובץ: " + result.error);
      } else {
        router.refresh();
      }
    } catch (err) {
      alert("שגיאה: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleDownload(fileId: string, storagePath: string, filename: string) {
    setDownloadingId(fileId);
    try {
      const url = await getSignedDownloadUrl(storagePath);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
    } catch {
      alert("שגיאה בהורדת הקובץ");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDeleteFile(fileId: string, storagePath: string) {
    if (!confirm("למחוק את הקובץ?")) return;
    await deleteClientFile(fileId, storagePath, client.id);
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            ← דשבורד
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-semibold text-sm">{client.business_name}</span>
        </div>
        <div className="flex items-center gap-2">
          {(["onboarding", "active", "paused"] as const).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1 rounded-full border text-xs font-semibold transition-all ${
                clientStatus === s
                  ? CLIENT_STATUS_STYLES[s]
                  : "border-border text-muted-foreground hover:border-[#1CA9C9]/30"
              }`}
            >
              {CLIENT_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6 max-w-5xl">
        {/* Client header card */}
        <div className="rounded-2xl p-5 flex items-start justify-between gap-4"
          style={{ background: "linear-gradient(135deg, rgba(28,169,201,0.10) 0%, rgba(66,152,166,0.06) 100%)", border: "1px solid rgba(28,169,201,0.2)" }}>
          <div>
            <h1 className="text-3xl font-black">{client.business_name}</h1>
            <div className="flex gap-4 text-sm text-muted-foreground mt-2">
              {client.phone && <span>📞 {client.phone}</span>}
              {client.website_url && (
                <a href={client.website_url} target="_blank" rel="noreferrer" className="text-[#1CA9C9] hover:underline" dir="ltr">
                  🌐 {client.website_url}
                </a>
              )}
            </div>
          </div>
          <Badge variant="outline" className={`text-sm px-3 py-1 flex-shrink-0 ${CLIENT_STATUS_STYLES[clientStatus]}`}>
            {CLIENT_STATUS_LABELS[clientStatus]}
          </Badge>
        </div>

        {/* Projects + Payments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Projects */}
          <section className="bg-card rounded-2xl border-t-2 border-t-[#1CA9C9] border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2 text-[#1CA9C9]">
                📁 פרויקטים
              </h2>
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

            {projects.length === 0 && !addingProject && (
              <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">אין פרויקטים עדיין</p>
            )}

            {projects.map((p: { id: string; name: string; description?: string; status: string; progress_pct: number }) => (
              <div key={p.id} className="bg-card border border-border rounded-xl p-4 space-y-3 hover:border-[#1CA9C9]/30 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <StatusBadge status={p.status} />
                </div>
                {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                <div className="flex items-center gap-3">
                  <Progress value={p.progress_pct} className="flex-1 h-1.5" />
                  <span className="text-xs text-[#1CA9C9] font-bold w-8 text-left tabular-nums">{p.progress_pct}%</span>
                </div>
                <div className="flex gap-2 items-center">
                  <select
                    defaultValue={p.status}
                    onChange={(e) => updateProjectProgress(p.id, e.target.value, p.progress_pct).then(() => router.refresh())}
                    className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs"
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
          <section className="bg-card rounded-2xl border-t-2 border-t-green-500 border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold flex items-center gap-2 text-green-400">
                💰 תשלומים
              </h2>
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

            {payments.length === 0 && !addingPayment && (
              <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">אין תשלומים עדיין</p>
            )}

            {payments.map((p: { id: string; amount: number; currency: string; status: string; due_date?: string; notes?: string }) => (
              <div key={p.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between hover:border-green-500/20 transition-colors">
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
          </section>
        </div>

        {/* Credentials */}
        <section className="bg-card rounded-2xl border-t-2 border-t-violet-500 border border-border p-4 space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-2 text-violet-400">
            🔐 גישות מערכות
          </h2>
          {credentials.length === 0 ? (
            <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">הלקוח טרם מילא גישות</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {credentials.map((cred: { id: string; system_name: string; url?: string; username?: string; password?: string; notes?: string }) => (
                <div key={cred.id} className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-[#1CA9C9]/30 transition-colors">
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

        {/* Files */}
        <section className="bg-card rounded-2xl border-t-2 border-t-purple-500 border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold flex items-center gap-2 text-purple-400">
              📎 קבצים ומסמכים
            </h2>
            <div className="flex items-center gap-2">
              <select
                value={uploadFileType}
                onChange={(e) => setUploadFileType(e.target.value as "contract" | "spec" | "other")}
                className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs"
              >
                <option value="contract">חוזה</option>
                <option value="spec">אפיון</option>
                <option value="other">אחר</option>
              </select>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs"
              >
                {uploading ? "מעלה..." : "+ העלה קובץ"}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileUpload}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip"
              />
            </div>
          </div>

          {files.length === 0 ? (
            <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
              <p className="text-2xl mb-2">📎</p>
              <p>אין קבצים עדיין</p>
              <p className="text-xs mt-1">העלי חוזה, מסמך אפיון, או כל קובץ רלוונטי</p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((f: { id: string; filename: string; storage_path: string; file_type: string; size_bytes: number; uploaded_at: string }) => (
                <div key={f.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-purple-500/30 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl flex-shrink-0">
                      {f.file_type === "contract" ? "📄" : f.file_type === "spec" ? "📋" : "📎"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{f.filename}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {formatBytes(f.size_bytes)} · {new Date(f.uploaded_at).toLocaleDateString("he-IL")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant="outline" className={`text-[10px] px-2 ${FILE_TYPE_STYLES[f.file_type]}`}>
                      {FILE_TYPE_LABELS[f.file_type]}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(f.id, f.storage_path, f.filename)}
                      disabled={downloadingId === f.id}
                      className="text-xs h-7 px-2"
                    >
                      {downloadingId === f.id ? "..." : "הורד"}
                    </Button>
                    <button
                      onClick={() => handleDeleteFile(f.id, f.storage_path)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Admin Notes */}
        <section className="bg-card rounded-2xl border-t-2 border-t-yellow-500 border border-border p-4 space-y-3 pb-8">
          <h2 className="text-sm font-bold flex items-center gap-2 text-yellow-400">
            📝 הערות פנימיות
            <span className="text-[10px] normal-case font-normal text-muted-foreground">(גלויות לך בלבד)</span>
          </h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleNotesSave}
            placeholder="הערות, תזכורות, או כל מידע פנימי על הלקוח..."
            rows={4}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">נשמר אוטומטית בעת יציאה מהשדה</p>
            <Button
              size="sm"
              variant="outline"
              onClick={handleNotesSave}
              disabled={notesSaving}
              className="text-xs h-7"
            >
              {notesSaving ? "שומר..." : "שמור עכשיו"}
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}
