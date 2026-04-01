import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  in_progress: { label: "בעבודה", class: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
  testing:     { label: "בבדיקה", class: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  live:        { label: "Live", class: "bg-green-500/15 text-green-400 border-green-500/20" },
  open:        { label: "פתוח", class: "bg-blue-500/15 text-blue-400 border-blue-500/20" },
  resolved:    { label: "נפתר", class: "bg-green-500/15 text-green-400 border-green-500/20" },
  closed:      { label: "סגור", class: "bg-muted/50 text-muted-foreground border-border" },
};

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  low:    { label: "רגיל", class: "bg-muted/50 text-muted-foreground border-border" },
  high:   { label: "גבוה", class: "bg-orange-500/15 text-orange-400 border-orange-500/20" },
  urgent: { label: "דחוף", class: "bg-red-500/15 text-red-400 border-red-500/20" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_MAP[status] ?? { label: status, class: "" };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5", config.class)}>
      {config.label}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const config = PRIORITY_MAP[priority] ?? { label: priority, class: "" };
  return (
    <Badge variant="outline" className={cn("text-[11px] font-semibold px-2 py-0.5", config.class)}>
      {config.label}
    </Badge>
  );
}
