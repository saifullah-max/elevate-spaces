"use client";

import { Download } from "lucide-react";
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

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        Your staged concepts
        <InfoTip>
          {studio.isLoggedIn
            ? `${studio.results.length} staged concept${studio.results.length === 1 ? "" : "s"} ready. Click a variant to update the preview and download HD.`
            : "Click through the 3 variants for each photo and pick your favorite — the preview below updates to match."}
        </InfoTip>
      </p>

      {studio.results.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {studio.results.map((r, i) => {
            const active = i === studio.selectedPhotoIdx;
            return (
              <button
                key={i}
                onClick={() => studio.setSelectedPhotoIdx(i)}
                className={
                  "w-12 h-12 rounded-lg overflow-hidden border-2 transition-colors " +
                  (active ? "border-brand-500" : "border-cream-200 hover:border-brand-500/50")
                }
              >
                <img src={r.fileUrl} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}

      {current && current.variants.length > 0 && (
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
                </button>
                <a
                  href={v.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-2 right-2 bg-white/90 text-brand-500 text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-1"
                >
                  <Download className="w-3 h-3" /> HD
                </a>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
