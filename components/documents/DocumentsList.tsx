"use client";

import { useState, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDownloadUrl, uploadClientDocument } from "@/app/(client)/documents/actions";

const TAGS_OPTIONS = ["חוזה", "מפרט", "חשבונית", "כללי"];

const TAG_STYLES: Record<string, string> = {
  "חוזה":    "bg-purple-500/15 text-purple-600 border-purple-500/20",
  "מפרט":    "bg-blue-500/15 text-blue-600 border-blue-500/20",
  "חשבונית": "bg-green-500/15 text-green-600 border-green-500/20",
  "כללי":    "bg-gray-500/15 text-gray-500 border-gray-500/20",
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
  display_name?: string | null;
  note?: string | null;
  tags?: string[] | null;
  storage_path: string;
  file_type: string;
  size_bytes: number;
  uploaded_at: string;
  uploaded_by?: string;
}

export function DocumentsList({ files }: { files: FileRow[] }) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [uploading, setUploading]         = useState(false);
  const [uploadError, setUploadError]     = useState("");
  const [showForm, setShowForm]           = useState(false);
  const [displayName, setDisplayName]     = useState("");
  const [note, setNote]                   = useState("");
  const [selectedTags, setSelectedTags]   = useState<string[]>([]);
  const [filterTag, setFilterTag]         = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    const fd = new FormData();
    fd.append("file", file);
    if (displayName) fd.append("displayName", displayName);
    if (note)        fd.append("note", note);
    if (selectedTags.length) fd.append("tags", selectedTags.join(","));

    const result = await uploadClientDocument(fd);
    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
    } else {
      setShowForm(false);
      setDisplayName("");
      setNote("");
      setSelectedTags([]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

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

  const allTags = Array.from(
    new Set(files.flatMap((f) => f.tags ?? []))
  );

  const visibleFiles = filterTag
    ? files.filter((f) => f.tags?.includes(filterTag))
    : files;

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowForm((v) => !v)}
            disabled={uploading}
          >
            {uploading ? "מעלה..." : showForm ? "ביטול" : "↑ העלאת קובץ"}
          </Button>
          {uploadError && (
            <p className="text-xs text-destructive">{uploadError}</p>
          )}
        </div>

        {showForm && (
          <div className="bg-card border border-[#1CA9C9]/30 rounded-xl p-4 space-y-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">שם תצוגה (אופציונלי)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="למשל: חוזה עבודה סופי"
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1CA9C9]/50"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">הערה (אופציונלי)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="הוסיפי הערה קצרה לקובץ..."
                className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#1CA9C9]/50"
                dir="rtl"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">תגיות</label>
              <div className="flex flex-wrap gap-2">
                {TAGS_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-[#1CA9C9]/20 border-[#1CA9C9] text-[#1CA9C9]"
                        : "border-border text-muted-foreground hover:border-[#1CA9C9]/40"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <input
                ref={inputRef}
                type="file"
                className="hidden"
                onChange={handleUpload}
                accept="*/*"
              />
              <Button
                className="ap-gradient text-white w-full"
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? "מעלה..." : "בחרי קובץ והעלי"}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-muted-foreground">סינון:</span>
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1 rounded-full border text-xs transition-all ${
              filterTag === null
                ? "bg-[#1CA9C9]/20 border-[#1CA9C9] text-[#1CA9C9]"
                : "border-border text-muted-foreground hover:border-[#1CA9C9]/40"
            }`}
          >
            הכל
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full border text-xs transition-all ${
                filterTag === tag
                  ? "bg-[#1CA9C9]/20 border-[#1CA9C9] text-[#1CA9C9]"
                  : "border-border text-muted-foreground hover:border-[#1CA9C9]/40"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Files list */}
      {visibleFiles.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10 text-center space-y-3">
          <p className="text-3xl">📎</p>
          <p className="font-semibold">
            {filterTag ? `אין קבצים עם תגית "${filterTag}"` : "אין מסמכים עדיין"}
          </p>
          {!filterTag && (
            <p className="text-sm text-muted-foreground">
              כאן יועלו חוזים, מסמכי אפיון וכל קובץ רלוונטי לפרויקט
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {visibleFiles.map((f) => (
            <div
              key={f.id}
              className="bg-card border border-border rounded-xl px-4 py-3 flex items-start justify-between gap-3 hover:border-[#1CA9C9]/30 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0 mt-0.5">📎</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {f.display_name || f.filename}
                  </p>
                  {f.display_name && (
                    <p className="text-[10px] text-muted-foreground truncate">{f.filename}</p>
                  )}
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
                  {f.note && (
                    <p className="text-xs text-muted-foreground mt-1 bg-muted/40 rounded px-2 py-0.5 inline-block">
                      {f.note}
                    </p>
                  )}
                  {f.tags && f.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {f.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${TAG_STYLES[tag] ?? "bg-gray-500/15 text-gray-500 border-gray-500/20"}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <Button
                  size="sm"
                  className="ap-gradient text-white text-xs h-7 px-3"
                  onClick={() => handleDownload(f.id, f.storage_path, f.display_name || f.filename)}
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
