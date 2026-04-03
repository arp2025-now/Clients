"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDownloadUrl, uploadClientDocument } from "@/app/(client)/documents/actions";

const FILE_TYPE_LABELS: Record<string, string> = {
  contract: "חוזה",
  spec:     "אפיון",
  other:    "קובץ",
};

const FILE_TYPE_STYLES: Record<string, string> = {
  contract: "bg-purple-500/15 text-purple-600 border-purple-500/20",
  spec:     "bg-blue-500/15 text-blue-600 border-blue-500/20",
  other:    "bg-gray-500/15 text-gray-500 border-gray-500/20",
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
  uploaded_by?: string;
}

export function DocumentsList({ files }: { files: FileRow[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

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

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadClientDocument(fd);
    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-4">
      {/* Upload button */}
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleUpload}
          accept="*/*"
        />
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "מעלה..." : "↑ העלאת קובץ"}
        </Button>
        {uploadError && (
          <p className="text-xs text-destructive">{uploadError}</p>
        )}
      </div>

      {/* Files list */}
      {files.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
          <p className="text-3xl">📎</p>
          <p className="font-semibold">אין מסמכים עדיין</p>
          <p className="text-sm text-muted-foreground">
            כאן יועלו חוזים, מסמכי אפיון וכל קובץ רלוונטי לפרויקט
          </p>
        </div>
      ) : (
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
                    {f.uploaded_by === "client" && " · הועלה על ידך"}
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
      )}
    </div>
  );
}
