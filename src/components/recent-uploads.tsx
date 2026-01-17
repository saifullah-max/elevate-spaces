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
    <section className="max-w-6xl mx-auto py-10 md:py-12 px-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        Recent Uploads
      </h2>

      {loading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && uploads.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {uploads.map((pair, idx) => (
            <div
              key={idx}
              onClick={() => {
                setSelected(pair);
                setView(pair.staged ? "staged" : "original");
              }}
              className="
                bg-white rounded-xl border border-slate-200 cursor-pointer
                hover:shadow-lg hover:-translate-y-1 transition
              "
            >
              {/* Image */}
              <div className="aspect-[4/3] md:aspect-video bg-slate-100 overflow-hidden rounded-t-xl">
                <Image
                  src={pair.original.url}
                  alt={pair.original.filename}
                  width={400}
                  height={300}
                  unoptimized
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Meta */}
              <div className="p-3 text-xs text-slate-600">
                <p className="font-semibold truncate">
                  {pair.original.filename}
                </p>
                <p>{new Date(pair.createdAt).toLocaleString()}</p>
                {pair.staged && (
                  <span className="text-emerald-600 font-semibold md:font-bold">
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-3 md:p-4 md:backdrop-blur-sm">
          <div
            className="
              bg-white w-full max-w-sm sm:max-w-md
              md:max-w-4xl md:max-h-[90vh]
              h-auto md:h-auto
              rounded-xl md:rounded-2xl
              shadow-2xl flex flex-col overflow-hidden
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b">
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-semibold">
                  Image Preview
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 truncate max-w-[220px]">
                  {activeImage.filename}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={16} className="md:hidden" />
                <X size={18} className="hidden md:block" />
              </button>
            </div>

            {/* Toggle */}
            {selected.staged && (
              <div className="flex justify-center gap-2 py-2">
                {["staged", "original"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setView(type as any)}
                    className={`
                      px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm
                      rounded-full border transition
                      ${view === type
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {/* Image */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 px-3 py-2 md:p-4 overflow-auto">
              <Image
                src={activeImage.url}
                alt={activeImage.filename}
                width={1000}
                height={700}
                unoptimized
                className="
                  max-h-[45vh] sm:max-h-[60vh] md:max-h-[70vh]
                  w-auto object-contain rounded-lg
                "
              />
            </div>

            {/* Footer */}
            <div className="px-4 md:px-5 py-3 md:py-4 border-t flex justify-end gap-2 md:gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm border rounded-md md:rounded-lg hover:bg-slate-100"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleDownload(activeImage.url, activeImage.filename)
                }
                className="
                  flex items-center gap-2
                  px-4 py-1.5 md:px-5 md:py-2.5
                  text-xs md:text-sm font-semibold
                  bg-emerald-600 text-white
                  rounded-md md:rounded-lg
                  hover:bg-emerald-700
                "
              >
                <Download size={14} className="md:hidden" />
                <Download size={16} className="hidden md:block" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
