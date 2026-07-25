"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ImageIcon, Loader2, X } from "lucide-react";
import { getProjectImages } from "@/services/projects.service";

interface StagedVersion {
  id: string;
  url: string;
  filename: string;
  watermarked?: string;
  createdAt: string;
}

interface ImageGroup {
  original: { url: string; filename: string };
  stagedVersions: StagedVersion[];
  metadata: {
    roomType?: string;
    stagingStyle?: string;
    prompt?: string;
    createdAt: string;
    uploadedBy?: { id: string; name?: string; email: string };
  };
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  projectName: string;
}

export default function ProjectViewModal({ open, onClose, projectId, projectName }: Props) {
  const [groups, setGroups] = useState<ImageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [activeVariantIdx, setActiveVariantIdx] = useState(0);
  const [jumpInput, setJumpInput] = useState<string>("");

  useEffect(() => {
    if (!open || !projectId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getProjectImages(projectId);
        if (cancelled) return;
        const list: ImageGroup[] = res?.data?.imageGroups || [];
        setGroups(list);
        setActiveImageIdx(0);
        setActiveVariantIdx(0);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || "Failed to load project images");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, projectId]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const currentGroup = groups[activeImageIdx] || null;
  const variants = currentGroup?.stagedVersions || [];
  const mainImage = useMemo(() => {
    if (!currentGroup) return null;
    if (variants.length > 0) {
      const v = variants[Math.min(activeVariantIdx, variants.length - 1)];
      return v ? { url: v.url, filename: v.filename, label: `Variant ${activeVariantIdx + 1}` } : null;
    }
    return {
      url: currentGroup.original.url,
      filename: currentGroup.original.filename,
      label: "Original",
    };
  }, [currentGroup, activeVariantIdx, variants]);

  const handleJump = () => {
    const n = parseInt(jumpInput, 10);
    if (!Number.isFinite(n) || n < 1 || n > groups.length) return;
    setActiveImageIdx(n - 1);
    setActiveVariantIdx(0);
    setJumpInput("");
  };

  const handleDownload = async () => {
    if (!mainImage) return;
    try {
      const response = await fetch(mainImage.url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = mainImage.filename || "image";
      link.click();
      URL.revokeObjectURL(blobUrl);
    } catch {}
  };

  if (!open || typeof document === "undefined") return null;

  const totalImages = groups.length;

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
            <p className="font-semibold text-sm text-brand-900 truncate">{projectName}</p>
            {totalImages > 0 && (
              <p className="text-[11px] text-cream-800/50 mt-0.5">
                Image {activeImageIdx + 1} of {totalImages}
                {variants.length > 0 ? ` · Variant ${activeVariantIdx + 1} of ${variants.length}` : ""}
              </p>
            )}
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
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
            </div>
          ) : error ? (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : groups.length === 0 ? (
            <div className="m-6 rounded-xl border border-dashed border-cream-200 bg-cream-50 py-16 text-center">
              <ImageIcon className="w-8 h-8 text-cream-800/40 mx-auto mb-2" />
              <p className="text-sm text-brand-900 font-semibold">No images in this project yet</p>
            </div>
          ) : (
            <>
              {/* Main preview + details */}
              <div className="grid sm:grid-cols-3 gap-0">
                <div className="sm:col-span-2 relative aspect-[4/3] bg-cream-100">
                  {mainImage ? (
                    <img
                      src={mainImage.url}
                      alt={mainImage.label}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : null}
                  {mainImage && (
                    <span className="absolute top-3 left-3 bg-brand-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                      {mainImage.label}
                    </span>
                  )}
                </div>
                <div className="p-5 space-y-4">
                  <p className="text-xs font-bold text-brand-500 uppercase tracking-wider">Details</p>
                  <Detail label="Room Type" value={currentGroup?.metadata.roomType} />
                  <Detail label="Style" value={currentGroup?.metadata.stagingStyle} />
                  <Detail
                    label="Uploaded by"
                    value={
                      currentGroup?.metadata.uploadedBy?.name ||
                      currentGroup?.metadata.uploadedBy?.email
                    }
                  />
                  {currentGroup?.metadata.prompt && (
                    <Detail label="Prompt" value={currentGroup.metadata.prompt} />
                  )}
                  {mainImage && (
                    <button
                      onClick={handleDownload}
                      className="w-full bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </button>
                  )}
                </div>
              </div>

              {/* Variants */}
              {variants.length > 0 && (
                <div className="px-5 py-4 border-t border-cream-200">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold text-brand-500 uppercase tracking-wider">
                      Variants
                    </p>
                    <span className="text-[10px] font-semibold text-cream-800/50">
                      {variants.length} variant{variants.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {variants.map((v, idx) => {
                      const active = idx === activeVariantIdx;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setActiveVariantIdx(idx)}
                          className={
                            "relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition " +
                            (active
                              ? "border-brand-500 ring-2 ring-brand-500/20"
                              : "border-cream-200 hover:border-brand-500/40")
                          }
                        >
                          <img src={v.url} alt={`Variant ${idx + 1}`} className="w-full h-full object-cover" />
                          <span
                            className={
                              "absolute top-1.5 left-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded " +
                              (active ? "bg-brand-500 text-white" : "bg-white/90 text-brand-900")
                            }
                          >
                            V{idx + 1}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Image number badges + jump input */}
              {totalImages > 1 && (
                <div className="border-t border-cream-200 bg-cream-50/40 px-5 py-4 flex items-center gap-3 flex-wrap">
                  <div className="flex flex-wrap gap-1.5">
                    {groups.map((_, idx) => {
                      const active = idx === activeImageIdx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setActiveImageIdx(idx);
                            setActiveVariantIdx(0);
                          }}
                          className={
                            "min-w-[32px] h-8 px-2 rounded-md text-xs font-semibold transition " +
                            (active
                              ? "bg-brand-500 text-white"
                              : "bg-white border border-cream-200 text-cream-800/70 hover:border-brand-500/40")
                          }
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>
                  {totalImages > 10 && (
                    <div className="flex items-center gap-1.5 ml-auto">
                      <label className="text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider">
                        Go to
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={totalImages}
                        value={jumpInput}
                        onChange={(e) => setJumpInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleJump();
                        }}
                        placeholder="#"
                        className="w-16 border border-cream-200 rounded-lg px-2 py-1.5 text-xs bg-white"
                      />
                      <button
                        type="button"
                        onClick={handleJump}
                        className="text-xs font-semibold text-brand-500 hover:text-brand-700 px-2"
                      >
                        Go
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
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
      <p className="text-sm font-semibold text-brand-900 capitalize break-words">
        {value || <span className="text-cream-800/40 normal-case font-normal">—</span>}
      </p>
    </div>
  );
}
