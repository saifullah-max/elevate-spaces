"use client";

import { ChevronUp, MoveHorizontal } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { StudioController } from "./useStudio";
import { getDemoComparisonImageUrl } from "@/components/data/demoImagePaths";
import InfoTip from "./InfoTip";

interface Props {
  studio: StudioController;
}

export default function PreviewCard({ studio }: Props) {
  const [open, setOpen] = useState(true);
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const firstFile = studio.files[0] || null;
  const current = studio.results[studio.selectedPhotoIdx];
  const activeVariant = current?.variants[current.selectedVariantIdx];

  // Blob-URL for the first uploaded file (cleaned up on unmount / file change)
  useEffect(() => {
    if (!firstFile) {
      setUploadedUrl(null);
      return;
    }
    const url = URL.createObjectURL(firstFile);
    setUploadedUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [firstFile]);

  // Default demo pair based on the current room + style choice, so the
  // preview always shows something meaningful even before an upload.
  const defaultBefore = useMemo(
    () =>
      getDemoComparisonImageUrl({
        areaType: studio.areaType,
        roomType: studio.roomType,
        stagingStyle: studio.stagingStyle,
        before: true,
      }),
    [studio.areaType, studio.roomType, studio.stagingStyle]
  );

  const defaultAfter = useMemo(
    () =>
      getDemoComparisonImageUrl({
        areaType: studio.areaType,
        roomType: studio.roomType,
        stagingStyle: studio.stagingStyle,
        before: false,
      }),
    [studio.areaType, studio.roomType, studio.stagingStyle]
  );

  const beforeUrl = uploadedUrl || defaultBefore;
  const afterUrl = activeVariant?.url || defaultAfter;

  const isRealResult = Boolean(activeVariant?.url);

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-1.5 mb-3"
      >
        <span className="text-xs font-bold text-brand-500 uppercase tracking-wider flex items-center gap-1.5">
          Preview — drag to compare
          <InfoTip>
            {studio.isLoggedIn
              ? "Reference render of your current room + style pick. Sanity-check the vibe before generating."
              : "This is an example of the chosen room + style, so you can sanity-check your settings before spending a credit."}
          </InfoTip>
        </span>
        <span className="text-[11px] font-semibold text-cream-800/50 flex items-center gap-1.5 shrink-0">
          {open ? "Hide" : "Show"}
          <ChevronUp
            className={"w-2.5 h-2.5 transition-transform " + (open ? "" : "rotate-180")}
          />
        </span>
      </button>

      {open && (
        <div>
          <div
            ref={containerRef}
            className="relative aspect-[16/10] bg-cream-100 rounded-2xl overflow-hidden border border-cream-200 select-none"
          >
            <img
              src={beforeUrl}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
            <div className="absolute top-0 left-0 w-1/2 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
            <span className="absolute top-3 left-3 bg-brand-900/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
              Before
            </span>

            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            >
              <img
                src={afterUrl}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute top-0 right-0 w-full h-16 bg-gradient-to-b from-black/40 to-transparent" />
              <span className="absolute top-3 right-3 bg-brand-500/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                After Elevated
              </span>
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-lg">
                <MoveHorizontal className="w-3 h-3 text-brand-500" />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
              aria-label="Before/After slider"
            />
          </div>
          <p className="text-[10px] text-cream-800/40 mt-2 text-center">
            {isRealResult
              ? "Your staged result — drag the handle to compare."
              : uploadedUrl
              ? "Preview example after staging — hit Generate for your real result."
              : "This is a preview example based on the chosen room and style."}
          </p>
        </div>
      )}
    </div>
  );
}
