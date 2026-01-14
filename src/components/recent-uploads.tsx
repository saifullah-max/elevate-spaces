"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getRecentUploads, PairedUpload } from "@/services/image.service";
import { Download, X } from "lucide-react";

export default function RecentUploads() {
  const [uploads, setUploads] = useState<PairedUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PairedUpload | null>(null);
  const [view, setView] = useState<"staged" | "original">("staged");

  useEffect(() => {
    (async () => {
      try {
        const data = await getRecentUploads(8);
        setUploads(data.uploads);
      } catch (err: any) {
        setError(err.message || "Failed to load uploads");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownload = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(blobUrl);
  };

  const activeImage =
    view === "staged" && selected?.staged
      ? selected.staged
      : selected?.original;

  return (
    <section className="max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        Recent Uploads
      </h2>

      {loading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && uploads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {uploads.map((pair, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelected(pair);
                setView(pair.staged ? "staged" : "original");
              }}
              className="bg-white rounded-xl shadow-sm border border-slate-200 cursor-pointer
                         hover:shadow-lg hover:-translate-y-1 transition"
            >
              <div className="relative aspect-video bg-slate-100">
                <Image
                  src={pair.original.url}
                  alt={pair.original.filename}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>

              <div className="p-3 text-xs text-slate-600">
                <p className="font-semibold truncate">
                  {pair.original.filename}
                </p>
                <p>
                  {new Date(pair.createdAt).toLocaleString()}
                </p>
                {pair.staged && (
                  <span className="text-emerald-600 font-bold">
                    Staged
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {selected && activeImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <h3 className="font-semibold">Image Preview</h3>
                <p className="text-xs text-slate-500 truncate max-w-[280px]">
                  {activeImage.filename}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="h-9 w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X />
              </button>
            </div>

            {/* Toggle */}
            {selected.staged && (
              <div className="flex justify-center gap-2 py-3">
                {["staged", "original"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setView(type as any)}
                    className={`px-4 py-1.5 rounded-full text-sm border transition
                      ${view === type
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Image (scrollable) */}
            <div className="flex-1 overflow-auto bg-slate-50 p-4">
              <div className="relative min-h-[500px] w-full">
                <Image
                  src={activeImage.url}
                  alt={activeImage.filename}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover"
                  priority
                />

              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t flex justify-end gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-slate-100"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleDownload(activeImage.url, activeImage.filename)
                }
                className="flex items-center gap-2 px-5 py-2 text-sm font-semibold
                           bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 shadow"
              >
                <Download size={16} />
                Download {view}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
