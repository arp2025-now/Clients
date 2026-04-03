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
  getTicketComments,
  addAdminTicketComment,
  uploadProjectImage,
  updateTicketStatusWithAudit,
  addAdminCredential,
  updateAdminCredential,
  deleteAdminCredential,
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

const TICKET_STATUS_LABELS: Record<string, string> = {
  open: "פתוח",
  in_progress: "בטיפול",
  resolved: "נפתר",
  closed: "סגור",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "עכשיו";
  if (mins < 60) return `לפני ${mins} דקות`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  return `לפני ${Math.floor(hours / 24)} ימים`;
}

const ACTION_LABELS: Record<string, string> = {
  created: "נוצר",
  updated: "עודכן",
  status_changed: "שונה סטטוס",
  commented: "הוסף תגובה",
  uploaded: "הועלה קובץ",
};
const ENTITY_LABELS: Record<string, string> = {
  ticket: "טיקט",
  project: "פרויקט",
  payment: "תשלום",
  file: "קובץ",
  comment: "הערה",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TicketRow({ ticket, clientId, onRefresh }: { ticket: any; clientId: string; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(ticket.status);

  async function handleExpand() {
    if (!expanded && comments.length === 0) {
      setLoadingComments(true);
      const data = await getTicketComments(ticket.id);
      setComments(data);
      setLoadingComments(false);
    }
    setExpanded((v) => !v);
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSubmitting(true);
    const result = await addAdminTicketComment(ticket.id, reply, clientId);
    if (!result.error) {
      const fresh = await getTicketComments(ticket.id);
      setComments(fresh);
      setReply("");
      onRefresh();
    }
    setSubmitting(false);
  }

  async function handleStatusChange(newStatus: string) {
    await updateTicketStatusWithAudit(ticket.id, newStatus, clientId, currentStatus, ticket.subject);
    setCurrentStatus(newStatus);
    onRefresh();
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <button className="w-full px-4 py-3 text-right flex items-center justify-between gap-3" onClick={handleExpand}>
        <span className="text-sm font-medium truncate">{ticket.subject}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Badge variant="outline" className="text-[10px] px-2">
            {TICKET_STATUS_LABELS[currentStatus] ?? currentStatus}
          </Badge>
          <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">סטטוס:</span>
            <select
              value={currentStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs"
            >
              <option value="open">פתוח</option>
              <option value="in_progress">בטיפול</option>
              <option value="resolved">נפתר</option>
              <option value="closed">סגור</option>
            </select>
          </div>

          {loadingComments ? (
            <p className="text-xs text-muted-foreground text-center">טוען...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center">אין הערות עדיין</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div key={c.id} className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                  c.author === "client"
                    ? "bg-[#1CA9C9]/10 border border-[#1CA9C9]/20 mr-auto"
                    : "bg-card border border-border ml-auto"
                }`}>
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">
                    {c.author === "client" ? "לקוח" : "Admin"}
                  </p>
                  <p>{c.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(c.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleReply} className="flex gap-2">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="כתבי תגובה ללקוח..."
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-[#1CA9C9]/50"
              dir="rtl"
            />
            <Button type="submit" size="sm" className="ap-gradient text-white px-4" disabled={submitting || !reply.trim()}>
              {submitting ? "..." : "שלח"}
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProjectRow({ p, onRefresh }: { p: any; onRefresh: () => void }) {
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(p.image_url ?? null);
  const [progress, setProgress] = useState<number>(p.progress_pct ?? 0);
  const [currentStatus, setCurrentStatus] = useState<string>(p.status);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadProjectImage(p.id, fd);
    if (!result.error && result.url) {
      setPreviewUrl(result.url);
      onRefresh();
    }
    setUploadingImg(false);
    if (imgInputRef.current) imgInputRef.current.value = "";
  }

  async function handleProgressSave(newProgress: number) {
    await updateProjectProgress(p.id, currentStatus, newProgress);
    onRefresh();
  }

  async function handleStatusChange(newStatus: string) {
    setCurrentStatus(newStatus);
    await updateProjectProgress(p.id, newStatus, progress);
    onRefresh();
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-[#1CA9C9]/30 transition-colors">
      <div
        className="relative w-full h-28 cursor-pointer group"
        onClick={() => imgInputRef.current?.click()}
        title="לחץ להעלאת תמונת כיסוי"
      >
        {previewUrl ? (
          <img src={previewUrl} alt={p.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs"
            style={{ background: "linear-gradient(135deg, rgba(28,169,201,0.08) 0%, rgba(66,152,166,0.04) 100%)" }}>
            {uploadingImg ? "מעלה..." : "+ תמונת כיסוי"}
          </div>
        )}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-medium">
          {uploadingImg ? "מעלה..." : "החלף תמונה"}
        </div>
        <input ref={imgInputRef} type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
      </div>

      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm">{p.name}</span>
          <StatusBadge status={currentStatus} />
        </div>
        {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
        {/* Progress bar + % — updates in real time as slider moves */}
        <div className="flex items-center gap-3">
          <Progress value={progress} className="flex-1 h-1.5" />
          <span className="text-xs text-[#1CA9C9] font-bold w-8 text-left tabular-nums">{progress}%</span>
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={currentStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs"
          >
            <option value="in_progress">בעבודה</option>
            <option value="testing">בבדיקה</option>
            <option value="live">Live</option>
          </select>
          <input
            type="range" min={0} max={100} step={5}
            value={progress}
            className="flex-1 accent-[#1CA9C9]"
            onChange={(e) => setProgress(parseInt(e.target.value))}
            onMouseUp={(e) => handleProgressSave(parseInt((e.target as HTMLInputElement).value))}
          />
        </div>
      </div>
    </div>
  );
}

// ── Credentials section with full CRUD ─────────────────────────
const EMPTY_CRED = { system_name: "", url: "", username: "", password: "", notes: "" };

function CredentialsSection({ credentials, clientId, showPasswords, setShowPasswords, onRefresh }: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  credentials: any[];
  clientId: string;
  showPasswords: Record<string, boolean>;
  setShowPasswords: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onRefresh: () => void;
}) {
  const [adding, setAdding] = useState(false);
  const [addForm, setAddForm] = useState(EMPTY_CRED);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editForm, setEditForm] = useState<any>(EMPTY_CRED);

  async function handleAdd() {
    if (!addForm.system_name.trim()) return;
    setAddSaving(true);
    setAddError(null);
    const result = await addAdminCredential(clientId, addForm.system_name, addForm.url, addForm.username, addForm.password, addForm.notes);
    if (result.error) { setAddError(result.error); setAddSaving(false); return; }
    setAdding(false);
    setAddForm(EMPTY_CRED);
    setAddSaving(false);
    onRefresh();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function startEdit(cred: any) {
    setEditingId(cred.id);
    setEditForm({ system_name: cred.system_name, url: cred.url ?? "", username: cred.username ?? "", password: "", notes: cred.notes ?? "" });
  }

  async function handleUpdate() {
    if (!editingId) return;
    const result = await updateAdminCredential(editingId, clientId, editForm.system_name, editForm.url, editForm.username, editForm.password, editForm.notes);
    if (!result.error) { setEditingId(null); onRefresh(); }
  }

  async function handleDelete(credId: string) {
    if (!confirm("למחוק גישה זו?")) return;
    await deleteAdminCredential(credId, clientId);
    onRefresh();
  }

  const inputCls = "w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1CA9C9]/50";

  return (
    <section className="bg-card rounded-2xl border-t-2 border-t-violet-500 border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-violet-400">🔐 גישות מערכות</h2>
        <button onClick={() => { setAdding(!adding); setAddError(null); }} className="text-xs text-[#1CA9C9] hover:underline">+ הוסף</button>
      </div>

      {/* Add form */}
      {adding && (
        <div className="bg-card border border-[#1CA9C9]/30 rounded-xl p-4 space-y-2">
          <input className={inputCls} placeholder="שם המערכת *" value={addForm.system_name} onChange={(e) => setAddForm({ ...addForm, system_name: e.target.value })} />
          <input className={inputCls} placeholder="כתובת URL" dir="ltr" value={addForm.url} onChange={(e) => setAddForm({ ...addForm, url: e.target.value })} />
          <input className={inputCls} placeholder="שם משתמש" dir="ltr" value={addForm.username} onChange={(e) => setAddForm({ ...addForm, username: e.target.value })} />
          <input className={inputCls} type="password" placeholder="סיסמה" dir="ltr" value={addForm.password} onChange={(e) => setAddForm({ ...addForm, password: e.target.value })} />
          <input className={inputCls} placeholder="הערות" value={addForm.notes} onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })} />
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setAdding(false); setAddError(null); }}>ביטול</Button>
            <Button className="ap-gradient text-white" size="sm" onClick={handleAdd} disabled={addSaving || !addForm.system_name.trim()}>
              {addSaving ? "שומר..." : "הוסף"}
            </Button>
          </div>
        </div>
      )}

      {credentials.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground bg-card border border-border rounded-xl p-4">אין גישות עדיין</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {credentials.map((cred: { id: string; system_name: string; url?: string; username?: string; password?: string; notes?: string }) => (
          <div key={cred.id} className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-violet-500/30 transition-colors">
            {editingId === cred.id ? (
              // Edit mode
              <div className="space-y-2">
                <input className={inputCls} placeholder="שם המערכת *" value={editForm.system_name} onChange={(e) => setEditForm({ ...editForm, system_name: e.target.value })} />
                <input className={inputCls} placeholder="URL" dir="ltr" value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} />
                <input className={inputCls} placeholder="שם משתמש" dir="ltr" value={editForm.username} onChange={(e) => setEditForm({ ...editForm, username: e.target.value })} />
                <input className={inputCls} type="password" placeholder="סיסמה חדשה (ריק = ללא שינוי)" dir="ltr" value={editForm.password} onChange={(e) => setEditForm({ ...editForm, password: e.target.value })} />
                <input className={inputCls} placeholder="הערות" value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>ביטול</Button>
                  <Button className="ap-gradient text-white" size="sm" onClick={handleUpdate} disabled={!editForm.system_name.trim()}>שמור</Button>
                </div>
              </div>
            ) : (
              // View mode
              <>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1CA9C9]">{cred.system_name}</span>
                  <div className="flex items-center gap-2">
                    {cred.url && <a href={cred.url} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground hover:text-foreground" dir="ltr">🔗</a>}
                    <button onClick={() => startEdit(cred)} className="text-xs text-muted-foreground hover:text-[#1CA9C9]">✏️</button>
                    <button onClick={() => handleDelete(cred.id)} className="text-xs text-muted-foreground hover:text-destructive">✕</button>
                  </div>
                </div>
                {cred.url && <p className="text-[10px] text-muted-foreground" dir="ltr">{cred.url}</p>}
                {cred.username && <div className="text-xs"><span className="text-muted-foreground">משתמש: </span><span dir="ltr">{cred.username}</span></div>}
                {cred.password && (
                  <div className="text-xs flex items-center gap-2">
                    <span className="text-muted-foreground">סיסמה: </span>
                    <span dir="ltr" className="font-mono">{showPasswords[cred.id] ? cred.password : "••••••••"}</span>
                    <button onClick={() => setShowPasswords((prev) => ({ ...prev, [cred.id]: !prev[cred.id] }))} className="text-[#1CA9C9] hover:underline text-[10px]">
                      {showPasswords[cred.id] ? "הסתר" : "הצג"}
                    </button>
                  </div>
                )}
                {cred.notes && <p className="text-[10px] text-muted-foreground">{cred.notes}</p>}
              </>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function ClientDetail({ client, projects, payments, files, credentials, tickets, auditLog }: any) {
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
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);

  const [activeTab, setActiveTab] = useState<"overview" | "tickets" | "history">("overview");

  function onRefresh() { router.refresh(); }

  async function handleAddProject() {
    await addProject(client.id, projectForm.name, projectForm.description);
    setProjectForm({ name: "", description: "" });
    setAddingProject(false);
    router.refresh();
  }

  async function handleAddPayment() {
    setPaymentSaving(true);
    setPaymentError(null);
    try {
      await addPayment(client.id, parseFloat(paymentForm.amount), paymentForm.status, paymentForm.due_date, paymentForm.notes);
      setPaymentForm({ amount: "", status: "pending", due_date: "", notes: "" });
      setAddingPayment(false);
      router.refresh();
    } catch (e: unknown) {
      setPaymentError((e as Error).message);
    } finally {
      setPaymentSaving(false);
    }
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
      if (result.error) alert("שגיאה בהעלאת הקובץ: " + result.error);
      else router.refresh();
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

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["overview", "tickets", "history"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[#1CA9C9] text-[#1CA9C9]"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "overview" ? "סקירה" : tab === "tickets" ? `טיקטים (${tickets?.length ?? 0})` : "היסטוריה"}
            </button>
          ))}
        </div>

        {/* ── Overview Tab ── */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Projects */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-[#1CA9C9]">📁 פרויקטים</h2>
                  <button onClick={() => setAddingProject(!addingProject)} className="text-xs text-[#1CA9C9] hover:underline">+ הוסף</button>
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
                <div className="space-y-3">
                  {projects.map((p: { id: string; name: string; description?: string; status: string; progress_pct: number; image_url?: string }) => (
                    <ProjectRow key={p.id} p={p} onRefresh={onRefresh} />
                  ))}
                </div>
              </section>

              {/* Payments */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold text-green-400">💰 תשלומים</h2>
                  <button onClick={() => setAddingPayment(!addingPayment)} className="text-xs text-[#1CA9C9] hover:underline">+ הוסף</button>
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
                    {paymentError && <p className="text-xs text-red-400">{paymentError}</p>}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { setAddingPayment(false); setPaymentError(null); }}>ביטול</Button>
                      <Button className="ap-gradient text-white" size="sm" onClick={handleAddPayment} disabled={paymentSaving || !paymentForm.amount}>
                        {paymentSaving ? "שומר..." : "הוסף"}
                      </Button>
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
            <CredentialsSection
              credentials={credentials}
              clientId={client.id}
              showPasswords={showPasswords}
              setShowPasswords={setShowPasswords}
              onRefresh={onRefresh}
            />

            {/* Files */}
            <section className="bg-card rounded-2xl border-t-2 border-t-purple-500 border border-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-purple-400">📎 קבצים ומסמכים</h2>
                <div className="flex items-center gap-2">
                  <select value={uploadFileType} onChange={(e) => setUploadFileType(e.target.value as "contract" | "spec" | "other")} className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs">
                    <option value="contract">חוזה</option>
                    <option value="spec">אפיון</option>
                    <option value="other">אחר</option>
                  </select>
                  <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="text-xs">
                    {uploading ? "מעלה..." : "+ העלה קובץ"}
                  </Button>
                  <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" />
                </div>
              </div>
              {files.length === 0 ? (
                <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center text-muted-foreground text-sm">
                  <p className="text-2xl mb-2">📎</p><p>אין קבצים עדיין</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {files.map((f: { id: string; filename: string; storage_path: string; file_type: string; size_bytes: number; uploaded_at: string }) => (
                    <div key={f.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-purple-500/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl flex-shrink-0">{f.file_type === "contract" ? "📄" : f.file_type === "spec" ? "📋" : "📎"}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{f.filename}</p>
                          <p className="text-[10px] text-muted-foreground">{formatBytes(f.size_bytes)} · {new Date(f.uploaded_at).toLocaleDateString("he-IL")}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`text-[10px] px-2 ${FILE_TYPE_STYLES[f.file_type]}`}>{FILE_TYPE_LABELS[f.file_type]}</Badge>
                        <Button size="sm" variant="ghost" onClick={() => handleDownload(f.id, f.storage_path, f.filename)} disabled={downloadingId === f.id} className="text-xs h-7 px-2">
                          {downloadingId === f.id ? "..." : "הורד"}
                        </Button>
                        <button onClick={() => handleDeleteFile(f.id, f.storage_path)} className="text-muted-foreground hover:text-destructive text-xs">✕</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Admin Notes */}
            <section className="bg-card rounded-2xl border-t-2 border-t-yellow-500 border border-border p-4 space-y-3 pb-8">
              <h2 className="text-sm font-bold text-yellow-400">
                📝 הערות פנימיות <span className="text-[10px] normal-case font-normal text-muted-foreground">(גלויות לך בלבד)</span>
              </h2>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={handleNotesSave} placeholder="הערות, תזכורות, או כל מידע פנימי על הלקוח..." rows={4} className="resize-none" />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">נשמר אוטומטית בעת יציאה מהשדה</p>
                <Button size="sm" variant="outline" onClick={handleNotesSave} disabled={notesSaving} className="text-xs h-7">
                  {notesSaving ? "שומר..." : "שמור עכשיו"}
                </Button>
              </div>
            </section>
          </div>
        )}

        {/* ── Tickets Tab ── */}
        {activeTab === "tickets" && (
          <div className="space-y-3 pb-8">
            {(!tickets || tickets.length === 0) ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">אין טיקטים עדיין</div>
            ) : (
              tickets.map((ticket: { id: string; subject: string; status: string; priority: string; description?: string; created_at: string }) => (
                <TicketRow key={ticket.id} ticket={ticket} clientId={client.id} onRefresh={onRefresh} />
              ))
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === "history" && (
          <div className="space-y-2 pb-8">
            {(!auditLog || auditLog.length === 0) ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground text-sm">אין היסטוריה עדיין</div>
            ) : (
              auditLog.map((entry: { id: string; entity_type: string; action: string; details?: { from?: string; to?: string; subject?: string; body?: string }; actor: string; created_at: string }) => (
                <div key={entry.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3 hover:border-[#1CA9C9]/20 transition-colors">
                  <span className="text-base mt-0.5 flex-shrink-0">
                    {entry.entity_type === "ticket" ? "◎" : entry.entity_type === "file" ? "📎" : entry.entity_type === "comment" ? "💬" : entry.entity_type === "project" ? "◉" : "·"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">
                        {ENTITY_LABELS[entry.entity_type] ?? entry.entity_type} · {ACTION_LABELS[entry.action] ?? entry.action}
                        {entry.details?.subject ? `: "${entry.details.subject}"` : ""}
                      </p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ${entry.actor === "admin" ? "bg-[rgba(28,169,201,0.12)] text-[#1CA9C9]" : "bg-secondary text-muted-foreground"}`}>
                        {entry.actor === "admin" ? "Admin" : "לקוח"}
                      </span>
                    </div>
                    {entry.details?.from && entry.details?.to && (
                      <p className="text-xs text-muted-foreground mt-0.5">{entry.details.from} ← {entry.details.to}</p>
                    )}
                    {entry.details?.body && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{entry.details.body}</p>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-1">{timeAgo(entry.created_at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
