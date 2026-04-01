"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

const PRIORITY_OPTIONS = [
  { value: "low",    label: "רגיל",   color: "text-muted-foreground" },
  { value: "high",   label: "גבוה",   color: "text-orange-400" },
  { value: "urgent", label: "דחוף",   color: "text-red-400" },
];

interface NewTicketModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  clientId: string;
}

export function NewTicketModal({ open, onClose, onCreated, clientId }: NewTicketModalProps) {
  const [subject, setSubject] = useState("");
  const [priority, setPriority] = useState<"low" | "high" | "urgent">("low");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { data, error: dbError } = await supabase
      .from("tickets")
      .insert({ client_id: clientId, subject, priority, description })
      .select()
      .single();

    if (dbError) {
      setError("אירעה שגיאה בשליחת הטיקט. נסי שוב.");
      setLoading(false);
      return;
    }

    // Fire Make.com webhook (non-blocking)
    fetch("/api/webhooks/ticket", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "ticket_created",
        ticket_id: data.id,
        subject,
        priority,
        description,
        timestamp: new Date().toISOString(),
      }),
    }).catch(() => {});

    // Reset
    setSubject("");
    setPriority("low");
    setDescription("");
    setLoading(false);
    onCreated();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-card border-border max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>פתיחת טיקט חדש</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {error && (
            <p className="text-destructive text-sm bg-destructive/10 rounded-lg p-3">{error}</p>
          )}

          <div className="space-y-1.5">
            <Label>כותרת *</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="תאר בקצרה את הבעיה או הבקשה"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label>עדיפות</Label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPriority(opt.value as typeof priority)}
                  className={`flex-1 py-2 rounded-lg border text-sm font-semibold transition-all ${
                    priority === opt.value
                      ? "border-[#1CA9C9] bg-[rgba(28,169,201,0.1)] text-[#1CA9C9]"
                      : "border-border text-muted-foreground hover:border-border/80"
                  } ${opt.color}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>תיאור מפורט</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="פרטי נוספים שיעזרו לענת לטפל מהר יותר..."
              rows={4}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              ביטול
            </Button>
            <Button
              type="submit"
              className="flex-1 ap-gradient text-white"
              disabled={loading || !subject.trim()}
            >
              {loading ? "שולחת..." : "שלח טיקט ←"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
