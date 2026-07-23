"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Clock, Download, X } from "lucide-react";
import {
  getRecentUploads,
  normalizeImageUrl,
  type PairedUpload,
} from "@/services/image.service";
import { getAuthFromStorage } from "@/lib/auth.storage";

interface Props {
  onGoToProjects: () => void;
}

export default function RecentUploadsView({ onGoToProjects }: Props) {
  const [uploads, setUploads] = useState<PairedUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeUpload, setActiveUpload] = useState<PairedUpload | null>(null);

  // Cross-origin files (Supabase storage) often ignore the plain `download`
  // attribute on an <a> tag - browsers just open them in a new tab instead
  // of saving. Fetching as a blob and triggering the download manually
  // works reliably regardless of origin, same approach the demo page uses.
  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url, { mode: "cors", credentials: "omit" });
      if (!response.ok) throw new Error("Failed to fetch image");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch {
      // Fall back to opening the image directly if the fetch/blob approach
      // fails (e.g. CORS not configured for this particular file) - at
      // least the person can right-click and save it manually.
      window.open(url, "_blank");
    }
  };

  useEffect(() => {
    const auth = getAuthFromStorage();
    const isLoggedIn = Boolean(auth?.token);
    setLoggedIn(isLoggedIn);
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await getRecentUploads(30);
        setUploads(res.uploads || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load recent uploads");
        setUploads([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <h2 className="font-display font-bold text-xl text-brand-900">Recent Uploads</h2>

      <div className="bg-accent-500/10 border border-accent-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-accent-600 mt-0.5 shrink-0" />
        <p className="text-xs text-cream-800/70">
          This is your inbox, not a home for your photos. Anything not saved to a project is
          automatically deleted after{" "}
          <span className="font-semibold text-brand-900">30 days</span>. Save to a project to keep
          it -{" "}
          <button
            type="button"
            onClick={onGoToProjects}
            className="font-semibold text-brand-500 hover:underline"
          >
            projects don't expire
          </button>
          . Deleted images cannot be restored.
        </p>
      </div>

      {!loggedIn ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center">
          <Clock className="w-6 h-6 text-cream-800/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand-900">Sign in to see recent uploads</p>
          <p className="text-xs text-cream-800/50 mt-1">
            <Link href="/sign-in" className="text-brand-500 font-semibold underline">
              Sign in
            </Link>
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-xs text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-cream-200 rounded-xl h-56 animate-pulse" />
          ))}
        </div>
      ) : uploads.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center">
          <Clock className="w-6 h-6 text-cream-800/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand-900">Nothing yet</p>
          <p className="text-xs text-cream-800/50 mt-1">
            Your generated images will appear here for 30 days.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {uploads.map((u, i) => {
            const stagedUrl = normalizeImageUrl(u.staged?.url || u.stagedVariants?.[0]?.url || "");
            const originalUrl = normalizeImageUrl(u.original?.url || "");
            const displayUrl = stagedUrl || originalUrl;
            const label = u.staged?.filename || u.original?.filename || "Staged image";
            const createdAt = u.createdAt || u.original?.createdAt;
            const ageDays = createdAt
              ? Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000)
              : 0;
            const expiresIn = Math.max(0, 30 - ageDays);
            const isProcessing = (u.statusSummary?.processing ?? 0) > 0;
            const failed = (u.statusSummary?.failed ?? 0) > 0 && !stagedUrl;
            const variantCount = u.stagedVariants?.length ?? 0;

            return (
              <div
                key={u.groupId || u.original?.id || i}
                className="bg-white border border-cream-200 rounded-xl overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => variantCount > 1 && setActiveUpload(u)}
                  className="relative aspect-[4/3] bg-cream-100 block w-full text-left"
                >
                  {displayUrl ? (
                    <img
                      src={displayUrl}
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-cream-800/40">
                      No image
                    </div>
                  )}
                  {isProcessing ? (
                    <span className="absolute top-2 left-2 bg-brand-900/70 text-white text-[9px] font-bold px-2 py-1 rounded-md">
                      Processing
                    </span>
                  ) : failed ? (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded-md">
                      Failed
                    </span>
                  ) : (
                    <span className="absolute top-2 left-2 bg-brand-900/70 text-white text-[9px] font-bold px-2 py-1 rounded-md">
                      Expires in {expiresIn} day{expiresIn === 1 ? "" : "s"}
                    </span>
                  )}
                  {variantCount > 1 && (
                    <span className="absolute bottom-2 right-2 bg-white/90 text-brand-500 text-[9px] font-bold px-2 py-1 rounded-md hover:bg-white">
                      View all {variantCount} variants
                    </span>
                  )}
                </button>
                <div className="p-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-brand-900 truncate">{label}</p>
                    <p className="text-[10px] text-cream-800/50 truncate">
                      Not saved to a project
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={onGoToProjects}
                      className="text-[10px] font-semibold text-brand-500 hover:text-brand-700 whitespace-nowrap"
                    >
                      Save
                    </button>
                    {displayUrl && (
                      <button
                        type="button"
                        onClick={() => downloadImage(displayUrl, label)}
                        className="text-cream-800/40 hover:text-brand-500"
                        aria-label="Download"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* All-variants modal */}
      {activeUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-brand-900/50 backdrop-blur-sm"
          onClick={() => setActiveUpload(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl w-full shadow-xl flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 shrink-0">
              <h3 className="font-display text-lg font-bold text-brand-900">
                All variants ({activeUpload.stagedVariants?.length ?? 0})
              </h3>
              <button
                onClick={() => setActiveUpload(null)}
                className="text-cream-800/40 hover:text-brand-900"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-6 py-5 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(activeUpload.stagedVariants || []).map((variant, idx) => {
                const variantUrl = normalizeImageUrl(variant.url);
                return (
                  <div key={variant.id || idx} className="relative group">
                    <div className="aspect-square rounded-xl overflow-hidden border border-cream-200 bg-cream-100">
                      <img src={variantUrl} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                    </div>
                    <button
                      type="button"
                      onClick={() => downloadImage(variantUrl, `variant-${idx + 1}.png`)}
                      className="absolute bottom-2 right-2 bg-white/90 text-brand-500 text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> Download
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
