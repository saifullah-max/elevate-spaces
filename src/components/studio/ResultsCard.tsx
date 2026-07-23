"use client";

import { Download, Loader2, RefreshCw } from "lucide-react";
import type { StudioController } from "./useStudio";
import InfoTip from "./InfoTip";

interface Props {
  studio: StudioController;
}

export default function ResultsCard({ studio }: Props) {
  if (studio.results.length === 0 || studio.results.every((r) => r.variants.length === 0)) {
    return null;
  }

  const current = studio.results[studio.selectedPhotoIdx];
  const isCurrentWatermarked = !studio.isLoggedIn && Boolean(current?.isWatermarked);

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        Your staged concepts
        <InfoTip>
          {studio.isLoggedIn
            ? `${studio.results.length} staged concept${studio.results.length === 1 ? "" : "s"} ready. Click a variant to update the preview and download HD.`
            : "Click through the 3 variants for each photo and pick your favorite - the preview below updates to match. Your first 5 photos are watermark-free; sign up to keep staging watermark-free."}
        </InfoTip>
      </p>

      {studio.results.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {studio.results.map((r, i) => {
            const active = i === studio.selectedPhotoIdx;
            const watermarked = !studio.isLoggedIn && r.isWatermarked;
            return (
              <button
                key={i}
                onClick={() => studio.setSelectedPhotoIdx(i)}
                className={
                  "relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors " +
                  (active ? "border-brand-500" : "border-cream-200 hover:border-brand-500/50")
                }
              >
                <img src={r.fileUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                {watermarked && (
                  <span className="absolute bottom-0 right-0 bg-brand-900/80 text-white text-[7px] font-bold px-1">
                    WM
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {isCurrentWatermarked && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-amber-900">
            This photo is watermarked - your first 5 photos are free of watermarks. Sign up to get 5 more watermark-free credits.
          </p>
          <a
            href="/sign-up?bonus=true"
            className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Sign Up Free
          </a>
        </div>
      )}

      {current && current.variants.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {current.variants.map((v, i) => {
              const active = i === current.selectedVariantIdx;
              return (
                <div key={i} className="relative group">
                  <button
                    onClick={() => studio.selectVariant(studio.selectedPhotoIdx, i)}
                    className={
                      "block w-full aspect-[4/3] rounded-xl overflow-hidden border-2 transition-colors " +
                      (active ? "border-brand-500" : "border-cream-200 hover:border-brand-500/50")
                    }
                  >
                    <img src={v.url} alt={`Variant ${i + 1}`} className="w-full h-full object-cover" />
                    {isCurrentWatermarked && (
                      <div
                        className="absolute inset-0 flex flex-wrap content-around justify-around overflow-hidden opacity-30 select-none pointer-events-none"
                        style={{ transform: "rotate(-30deg) scale(1.4)" }}
                        aria-hidden="true"
                      >
                        {Array.from({ length: 4 }).map((_, wIdx) => (
                          <span
                            key={wIdx}
                            className="text-white font-black text-xs px-3 py-2 whitespace-nowrap"
                            style={{ textShadow: "0 1px 3px rgba(0,0,0,0.6)" }}
                          >
                            PREVIEW ONLY
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                  <a
                    href={v.url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-2 right-2 bg-white/90 text-brand-500 text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> {isCurrentWatermarked ? "Download" : "HD"}
                  </a>
                </div>
              );
            })}
          </div>

          {/* Restage - free, unlimited re-edit of the currently selected variant */}
          <div className="mt-4 border-t border-cream-200 pt-4">
            <div className="flex items-center gap-1.5 mb-2">
              <RefreshCw className="w-3.5 h-3.5 text-brand-500" />
              <p className="text-xs font-bold text-cream-800/80">Restage this image</p>
              <InfoTip iconClassName="text-cream-800/30" size="xs">
                Free and unlimited - describe a change and we'll re-generate just the selected variant.
              </InfoTip>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={studio.restagePrompt}
                onChange={(e) => studio.setRestagePrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !studio.restaging) {
                    void studio.restageSelected();
                  }
                }}
                placeholder="e.g. make the walls lighter, add a rug"
                maxLength={100}
                disabled={studio.restaging}
                className="flex-1 border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50 disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => void studio.restageSelected()}
                disabled={studio.restaging || !studio.restagePrompt.trim()}
                className="shrink-0 bg-brand-100 hover:bg-brand-500 hover:text-white text-brand-500 text-xs font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {studio.restaging ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Restaging...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3 h-3" /> Restage
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
