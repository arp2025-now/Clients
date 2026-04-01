"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { NewTicketModal } from "./NewTicketModal";
import { StatusBadge, PriorityBadge } from "@/components/dashboard/StatusBadge";
import { Button } from "@/components/ui/button";

interface Ticket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function TicketsList({ tickets, clientId }: { tickets: Ticket[]; clientId: string }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("he-IL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="p-6 space-y-5 max-w-2xl">
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
          <Button
            className="ap-gradient text-white mt-2"
            onClick={() => setModalOpen(true)}
          >
            + פתיחת טיקט ראשון
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-card border border-border rounded-xl p-4 space-y-2 hover:border-[#1CA9C9]/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-semibold text-sm leading-tight">{ticket.subject}</span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
              </div>
              {ticket.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{ticket.description}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                נפתח: {formatDate(ticket.created_at)}
                {ticket.updated_at !== ticket.created_at && (
                  <> · עודכן: {formatDate(ticket.updated_at)}</>
                )}
              </p>
            </div>
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
