"use client";

import { useState, useRef } from "react";
import { getDownloadUrl, uploadClientDocument } from "@/app/(client)/documents/actions";
import { Upload, FileText, Download, X } from "lucide-react";

const TAGS_OPTIONS = ["חוזה", "מפרט", "חשבונית", "כללי"];

const TAG_STYLES: Record<string, string> = {
  "חוזה":    "bg-purple-100 text-purple-700 border-purple-200",
  "מפרט":    "bg-blue-100 text-blue-700 border-blue-200",
  "חשבונית": "bg-green-100 text-green-700 border-green-200",
  "כללי":    "bg-gray-100 text-gray-600 border-gray-200",
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
      setDisplayName(""); setNote(""); setSelectedTags([]);
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDownload(fileId: string, storagePath: string, filename: string) {
    setDownloadingId(fileId);
    try {
      const url = await getDownloadUrl(storagePath);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
    } catch {
      alert("שגיאה בהורדת הקובץ");
    } finally {
      setDownloadingId(null);
    }
  }

  const allTags = Array.from(new Set(files.flatMap((f) => f.tags ?? [])));
  const visibleFiles = filterTag ? files.filter((f) => f.tags?.includes(filterTag)) : files;

  return (
    <div className="space-y-4">

      {/* Upload section */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-[#1CA9C9]" />
            <h2 className="font-bold text-sm text-gray-800">העלאת מסמך</h2>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            disabled={uploading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors bg-[#1CA9C9] text-white hover:bg-[#1898B5]"
          >
            {showForm ? <><X className="w-3.5 h-3.5" /> ביטול</> : <><Upload className="w-3.5 h-3.5" /> העלאה</>}
          </button>
        </div>

        {showForm && (
          <div className="p-5 space-y-4 bg-gray-50">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">שם תצוגה (אופציונלי)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="למשל: חוזה עבודה סופי"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1CA9C9]/50 focus:ring-1 focus:ring-[#1CA9C9]/20"
                  dir="rtl"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">הערה (אופציונלי)</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="הוסיפי הערה קצרה..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1CA9C9]/50 focus:ring-1 focus:ring-[#1CA9C9]/20"
                  dir="rtl"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 block mb-2">תגיות</label>
              <div className="flex flex-wrap gap-2">
                {TAGS_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? "bg-[#1CA9C9] border-[#1CA9C9] text-white"
                        : "border-gray-200 text-gray-500 hover:border-[#1CA9C9]/40 bg-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} accept="*/*" />
            <button
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="w-full py-2.5 rounded-xl bg-[#1CA9C9] text-white text-sm font-semibold hover:bg-[#1898B5] transition-colors disabled:opacity-50"
            >
              {uploading ? "מעלה..." : "בחרי קובץ והעלי →"}
            </button>
            {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
          </div>
        )}
      </div>

      {/* Filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs text-gray-400 font-medium">סינון:</span>
          <button
            onClick={() => setFilterTag(null)}
            className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
              filterTag === null ? "bg-[#1CA9C9] border-[#1CA9C9] text-white" : "border-gray-200 text-gray-500 bg-white hover:border-[#1CA9C9]/40"
            }`}
          >
            הכל
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setFilterTag(filterTag === tag ? null : tag)}
              className={`px-3 py-1 rounded-full border text-xs font-medium transition-all ${
                filterTag === tag ? "bg-[#1CA9C9] border-[#1CA9C9] text-white" : "border-gray-200 text-gray-500 bg-white hover:border-[#1CA9C9]/40"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Files list */}
      {visibleFiles.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#1CA9C9]/10 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6 text-[#1CA9C9]" />
          </div>
          <p className="font-bold text-gray-800">
            {filterTag ? `אין קבצים עם תגית "${filterTag}"` : "אין מסמכים עדיין"}
          </p>
          {!filterTag && (
            <p className="text-sm text-gray-400">כאן יועלו חוזים, מסמכי אפיון וכל קובץ רלוונטי לפרויקט</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="divide-y divide-gray-50">
            {visibleFiles.map((f) => (
              <div key={f.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-[#1CA9C9]/10 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-[#1CA9C9]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {f.display_name || f.filename}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[11px] text-gray-400">
                      {formatBytes(f.size_bytes)}
                      {f.size_bytes ? " · " : ""}
                      {new Date(f.uploaded_at).toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    {f.tags && f.tags.length > 0 && f.tags.map((tag) => (
                      <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${TAG_STYLES[tag] ?? "bg-gray-100 text-gray-600 border-gray-200"}`}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  {f.note && (
                    <p className="text-[11px] text-gray-500 mt-1">{f.note}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDownload(f.id, f.storage_path, f.display_name || f.filename)}
                  disabled={downloadingId === f.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-[#1CA9C9]/40 hover:text-[#1CA9C9] transition-colors disabled:opacity-40 flex-shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{downloadingId === f.id ? "מוריד..." : "הורד"}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
