"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDownloadUrl } from "@/app/(client)/documents/actions";

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
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface FileRow {
  id: string;
  filename: string;
  storage_path: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string;
}

export function DocumentsList({ files }: { files: FileRow[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(fileId: string, storagePath: string, filename: string) {
    setDownloadingId(fileId);
    try {
      const url = await getDownloadUrl(storagePath);
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

  if (files.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
        <p className="text-3xl">📎</p>
        <p className="font-semibold">אין מסמכים עדיין</p>
        <p className="text-sm text-muted-foreground">
          ענת תעלה כאן חוזים, מסמכי אפיון וכל קובץ רלוונטי לפרויקט שלך
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {files.map((f) => (
        <div
          key={f.id}
          className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 hover:border-[#1CA9C9]/30 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl flex-shrink-0">
              {f.file_type === "contract" ? "📄" : f.file_type === "spec" ? "📋" : "📎"}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{f.filename}</p>
              <p className="text-[10px] text-muted-foreground">
                {formatBytes(f.size_bytes)}
                {f.size_bytes ? " · " : ""}
                {new Date(f.uploaded_at).toLocaleDateString("he-IL", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant="outline" className={`text-[10px] px-2 ${FILE_TYPE_STYLES[f.file_type]}`}>
              {FILE_TYPE_LABELS[f.file_type] ?? f.file_type}
            </Badge>
            <Button
              size="sm"
              className="ap-gradient text-white text-xs h-7 px-3"
              onClick={() => handleDownload(f.id, f.storage_path, f.filename)}
              disabled={downloadingId === f.id}
            >
              {downloadingId === f.id ? "מוריד..." : "הורד ↓"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
