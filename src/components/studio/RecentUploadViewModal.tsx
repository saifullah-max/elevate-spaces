"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ImageIcon, X } from "lucide-react";
import { normalizeImageUrl, type PairedUpload } from "@/services/image.service";

interface Props {
  open: boolean;
  onClose: () => void;
  upload: PairedUpload | null;
}

export default function RecentUploadViewModal({ open, onClose, upload }: Props) {
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);

  useEffect(() => {
    if (!open) return;
    setActiveVariantIdx(0);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const variants = useMemo(() => {
    if (!upload) return [] as { url: string; filename: string; id: string }[];
    const src = upload.stagedVariants && upload.stagedVariants.length > 0
      ? upload.stagedVariants
      : upload.staged
      ? [upload.staged]
      : [];
    return src.map((v, i) => ({
      id: v.id || String(i),
      url: normalizeImageUrl(v.url),
      filename: v.filename || `staged-${i + 1}.jpg`,
    }));
  }, [upload]);

  const originalUrl = upload ? normalizeImageUrl(upload.original?.url || "") : "";
  const mainImage = variants[Math.min(activeVariantIdx, Math.max(0, variants.length - 1))] || null;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "image";
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open in new tab so user can save manually
      window.open(url, "_blank", "noopener");
    }
  };

  if (!open || !upload || typeof document === "undefined") return null;

  const label = upload.staged?.filename || upload.original?.filename || "Recent upload";
  const displayUrl = mainImage?.url || originalUrl;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-brand-900/70 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 shrink-0">
          <div className="min-w-0">
            <p className="font-semibold text-sm text-brand-900 truncate">{label}</p>
            <p className="text-[11px] text-cream-800/50 mt-0.5">
              {variants.length > 0
                ? `Variant ${activeVariantIdx + 1} of ${variants.length}`
                : "Original only"}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-cream-800/40 hover:text-brand-900 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="grid sm:grid-cols-3 gap-0">
            <div className="sm:col-span-2 relative aspect-[4/3] bg-cream-100">
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt={mainImage?.filename || "Preview"}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[10px] text-cream-800/40">
                  <ImageIcon className="w-6 h-6" />
                </div>
              )}
              {mainImage && (
                <span className="absolute top-3 left-3 bg-brand-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  Variant {activeVariantIdx + 1}
                </span>
              )}
              {!mainImage && originalUrl && (
                <span className="absolute top-3 left-3 bg-brand-900/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                  Original
                </span>
              )}
            </div>
            <div className="p-5 space-y-4">
              <p className="text-xs font-bold text-brand-500 uppercase tracking-wider">Details</p>
              <Detail label="Uploaded" value={formatDate(upload.createdAt || upload.original?.createdAt)} />
              <Detail
                label="Status"
                value={
                  (upload.statusSummary?.completed ?? 0) > 0
                    ? "Completed"
                    : (upload.statusSummary?.processing ?? 0) > 0
                    ? "Processing"
                    : (upload.statusSummary?.failed ?? 0) > 0
                    ? "Failed"
                    : "—"
                }
              />
              <Detail label="Variants" value={String(variants.length || 0)} />
              {mainImage && (
                <button
                  onClick={() => handleDownload(mainImage.url, mainImage.filename)}
                  className="w-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download this variant
                </button>
              )}
              {originalUrl && (
                <button
                  onClick={() => handleDownload(originalUrl, upload.original?.filename || "original.jpg")}
                  className="w-full border border-cream-200 hover:bg-cream-50 text-brand-900 text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" /> Download original
                </button>
              )}
            </div>
          </div>

          {variants.length > 0 && (
            <div className="px-5 py-4 border-t border-cream-200">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold text-brand-500 uppercase tracking-wider">Variants</p>
                <span className="text-[10px] font-semibold text-cream-800/50">
                  {variants.length} variant{variants.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {variants.map((v, idx) => {
                  const active = idx === activeVariantIdx;
                  return (
                    <div key={v.id} className="relative group">
                      <button
                        type="button"
                        onClick={() => setActiveVariantIdx(idx)}
                        className={
                          "relative w-full aspect-[4/3] rounded-lg overflow-hidden border-2 transition " +
                          (active
                            ? "border-brand-500 ring-2 ring-brand-500/20"
                            : "border-cream-200 hover:border-brand-500/40")
                        }
                      >
                        <img
                          src={v.url}
                          alt={`Variant ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <span
                          className={
                            "absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded " +
                            (active ? "bg-brand-500 text-white" : "bg-white/90 text-brand-900")
                          }
                        >
                          V{idx + 1}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload(v.url, v.filename)}
                        className="absolute bottom-1.5 right-1.5 bg-white/90 hover:bg-white text-brand-500 rounded-md p-1 opacity-0 group-hover:opacity-100 transition"
                        aria-label={`Download variant ${idx + 1}`}
                      >
                        <Download className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-0.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-brand-900 break-words">
        {value || <span className="text-cream-800/40 font-normal">—</span>}
      </p>
    </div>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}
