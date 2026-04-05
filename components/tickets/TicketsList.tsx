"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewTicketModal } from "./NewTicketModal";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";
import { getTicketComments, addTicketComment } from "@/app/(client)/tickets/actions";

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("he-IL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function TicketRow({ ticket }: { ticket: Ticket }) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleExpand() {
    if (!expanded && comments.length === 0) {
      setLoadingComments(true);
      const data = await getTicketComments(ticket.id);
      setComments(data as Comment[]);
      setLoadingComments(false);
    }
    setExpanded(!expanded);
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;
    setSubmitting(true);
    setError("");
    const result = await addTicketComment(ticket.id, newComment);
    if (result.error) {
      setError(result.error);
    } else {
      const fresh = await getTicketComments(ticket.id);
      setComments(fresh as Comment[]);
      setNewComment("");
    }
    setSubmitting(false);
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-[#1CA9C9]/40 transition-colors">
      {/* Header row — click to expand */}
      <button
        className="w-full p-4 text-right space-y-2"
        onClick={handleExpand}
      >
        <div className="flex items-start justify-between gap-3">
          <span className="font-semibold text-sm leading-tight">{ticket.subject}</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            <span className="text-muted-foreground text-xs">{expanded ? "▲" : "▼"}</span>
          </div>
        </div>
        {ticket.description && (
          <p className="text-xs text-muted-foreground text-right line-clamp-2">{ticket.description}</p>
        )}
        <p className="text-[10px] text-muted-foreground text-right">
          נפתח: {formatDate(ticket.created_at)}
          {ticket.updated_at !== ticket.created_at && (
            <> · עודכן: {formatDate(ticket.updated_at)}</>
          )}
        </p>
      </button>

      {/* Comments thread */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 p-4 space-y-4">
          {loadingComments ? (
            <p className="text-xs text-muted-foreground text-center">טוען...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center">אין הערות עדיין — הוסיפי הערה למטה</p>
          ) : (
            <div className="space-y-3">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
                    c.author === "client"
                      ? "bg-[#1CA9C9]/10 border border-[#1CA9C9]/20 mr-auto"
                      : "bg-card border border-border ml-auto"
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 text-muted-foreground">
                    {c.author === "client" ? "את" : "הצוות"}
                  </p>
                  <p>{c.body}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(c.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add comment form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="הוסיפי הערה..."
              className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-background focus:outline-none focus:border-[#1CA9C9]/50"
              dir="rtl"
            />
            <Button
              type="submit"
              size="sm"
              className="ap-gradient text-white px-4"
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? "..." : "שלח"}
            </Button>
          </form>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function TicketsList({ tickets, clientId }: { tickets: Ticket[]; clientId: string }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">הטיקטים שלי</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            מעקב אחר בקשות ותמיכה
          </p>
        </div>
        <Button
          className="ap-gradient text-white font-semibold"
          onClick={() => setModalOpen(true)}
        >
          + פתיחת טיקט
        </Button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
          <p className="text-3xl">◎</p>
          <p className="font-semibold">אין טיקטים עדיין</p>
          <p className="text-sm text-muted-foreground">
            יש שאלה או בעיה? פתחי טיקט ונחזור אליך מהר
          </p>
          <Button className="ap-gradient text-white mt-2" onClick={() => setModalOpen(true)}>
            + פתיחת טיקט ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      <NewTicketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => router.refresh()}
        clientId={clientId}
      />
    </div>
  );
}
