"use client";
import { useEffect, useState } from "react";
import { getRecentUploads, PairedUpload } from "@/services/image.service";

export default function RecentUploads() {
  const [uploads, setUploads] = useState<PairedUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getRecentUploads(8);
        setUploads(data.uploads);
      } catch (err: any) {
        setError(err.message || "Failed to load uploads");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="max-w-6xl mx-auto py-12 px-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">Recent Uploads</h2>
      {loading ? (
        <div className="text-slate-500">Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : uploads.length === 0 ? (
        <div className="text-slate-500">No uploads found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {uploads.map((pair, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden group">
              <div className="flex flex-col">
                <div className="relative aspect-video bg-slate-100">
                  <img
                    src={pair.original.url}
                    alt={pair.original.filename}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  {pair.staged && (
                    <img
                      src={pair.staged.url}
                      alt={pair.staged.filename}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      title="Staged Preview (hover to view)"
                    />
                  )}
                </div>
                <div className="p-3 text-xs text-slate-600 flex flex-col gap-1">
                  <span className="font-semibold">{pair.original.filename}</span>
                  <span>Uploaded: {new Date(pair.createdAt).toLocaleString()}</span>
                  {pair.staged && <span className="text-emerald-600 font-bold">Staged</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}