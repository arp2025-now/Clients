"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewTicketModal } from "./NewTicketModal";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { getTicketComments, addTicketComment } from "@/app/(client)/tickets/actions";
import { ChevronDown, ChevronUp, MessageCircle, Send } from "lucide-react";

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
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:border-[#1CA9C9]/40 transition-colors">
      {/* Header row */}
      <button className="w-full px-5 py-4 text-right" onClick={handleExpand}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
              ticket.status === "open" ? "bg-orange-400" :
              ticket.status === "in_progress" ? "bg-blue-400" :
              ticket.status === "resolved" ? "bg-green-400" : "bg-gray-300"
            }`} />
            <span className="font-semibold text-sm text-gray-800 truncate">{ticket.subject}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={ticket.priority} />
            <StatusBadge status={ticket.status} />
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        {ticket.description && (
          <p className="text-xs text-gray-500 text-right mt-1.5 line-clamp-2 pr-5">{ticket.description}</p>
        )}
        <p className="text-[10px] text-gray-400 text-right mt-1 pr-5">
          נפתח: {formatDate(ticket.created_at)}
          {ticket.updated_at !== ticket.created_at && <> · עודכן: {formatDate(ticket.updated_at)}</>}
        </p>
      </button>

      {/* Comments thread */}
      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-3">
          {loadingComments ? (
            <p className="text-xs text-gray-400 text-center py-2">טוען...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">אין הערות עדיין</p>
          ) : (
            <div className="space-y-2">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-xl px-3 py-2.5 text-sm max-w-[85%] ${
                    c.author === "client"
                      ? "bg-[#1CA9C9]/10 border border-[#1CA9C9]/20 mr-auto"
                      : "bg-white border border-gray-200 ml-auto"
                  }`}
                >
                  <p className="text-[10px] font-semibold mb-1 text-gray-400">
                    {c.author === "client" ? "את" : "הצוות"}
                  </p>
                  <p className="text-gray-700">{c.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(c.created_at)}</p>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleAddComment} className="flex gap-2 pt-1">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="הוסיפי הערה..."
              className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#1CA9C9]/50 focus:ring-1 focus:ring-[#1CA9C9]/20"
              dir="rtl"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="w-9 h-9 rounded-xl bg-[#1CA9C9] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#1898B5] transition-colors flex-shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>
      )}
    </div>
  );
}

export function TicketsList({ tickets, clientId }: { tickets: Ticket[]; clientId: string }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-2xl">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-gray-900">הטיקטים שלי</h1>
          <p className="text-xs text-gray-400 mt-0.5">מעקב אחר בקשות ותמיכה · {tickets.length} טיקטים</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1CA9C9] text-white text-sm font-semibold hover:bg-[#1898B5] transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">פתיחת טיקט</span>
          <span className="sm:hidden">+</span>
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#1CA9C9]/10 flex items-center justify-center mx-auto">
            <MessageCircle className="w-6 h-6 text-[#1CA9C9]" />
          </div>
          <p className="font-bold text-gray-800">אין טיקטים עדיין</p>
          <p className="text-sm text-gray-400">יש שאלה או בעיה? פתחי טיקט ונחזור אליך</p>
          <button
            onClick={() => setModalOpen(true)}
            className="mt-2 px-5 py-2.5 rounded-xl bg-[#1CA9C9] text-white text-sm font-semibold hover:bg-[#1898B5] transition-colors"
          >
            + פתיחת טיקט ראשון
          </button>
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
