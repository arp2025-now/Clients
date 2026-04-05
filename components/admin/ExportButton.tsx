"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { exportClientsCSV, exportTicketsCSV } from "@/app/(admin)/admin/actions";

type ExportType = "clients" | "tickets";

interface ExportButtonProps {
  type: ExportType;
  label?: string;
  ticketStatus?: string;
}

export function ExportButton({ type, label, ticketStatus }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const csv = type === "clients"
        ? await exportClientsCSV()
        : await exportTicketsCSV(ticketStatus);

      const filename = type === "clients"
        ? `לקוחות_${new Date().toISOString().slice(0, 10)}.csv`
        : `טיקטים_${new Date().toISOString().slice(0, 10)}.csv`;

      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleExport}
      disabled={loading}
      className="text-xs h-7 px-3 text-muted-foreground hover:text-foreground gap-1"
    >
      {loading ? "מייצא..." : (label ?? "↓ ייצא CSV")}
    </Button>
  );
}
