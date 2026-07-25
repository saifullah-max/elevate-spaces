"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, MoveHorizontal, Trash2, X } from "lucide-react";
import type { StudioController, PerImageSetting } from "./useStudio";
import type { RoomType, StagingStyle } from "@/lib/errors";
import { getDemoComparisonImageUrl } from "@/components/data/demoImagePaths";

interface Props {
  studio: StudioController;
}

const ROOMS: { value: RoomType; label: string }[] = [
  { value: "living-room", label: "Living Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "kitchen", label: "Kitchen" },
  { value: "bathroom", label: "Bathroom" },
  { value: "dining-room", label: "Dining Room" },
  { value: "office", label: "Office" },
  { value: "basement", label: "Basement" },
  { value: "attic", label: "Attic" },
  { value: "hallway", label: "Hallway" },
];

const STYLES: { value: StagingStyle; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "contemporary", label: "Contemporary" },
  { value: "minimalist", label: "Minimalist" },
  { value: "scandinavian", label: "Scandinavian" },
  { value: "industrial", label: "Industrial" },
  { value: "traditional", label: "Traditional" },
  { value: "transitional", label: "Transitional" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "coastal", label: "Coastal" },
  { value: "bohemian", label: "Bohemian" },
  { value: "mid-century", label: "Mid-Century" },
  { value: "luxury", label: "Luxury" },
];

export default function CustomizeModal({ studio }: Props) {
  const open = studio.customizeModalOpen;
  const stylingLocked = !studio.canCustomizePerImage;
  const lockedTitle = studio.isLoggedIn
    ? "Upgrade to Pro or Team to change staging style and prompt per photo."
    : "Sign in and upgrade to Pro or Team to change staging style and prompt per photo.";

  // Snapshot the settings into a draft on open — this modal is a form, not
  // live-editing; users cancel or save.
  const initial: PerImageSetting[] = useMemo(
    () =>
      studio.files.map(
        (_, i) =>
          studio.perImageSettings[i] || {
            roomType: studio.roomType,
            stagingStyle: studio.stagingStyle,
            areaType: studio.areaType,
            prompt: studio.prompt,
          }
      ),
    [
      studio.files,
      studio.perImageSettings,
      studio.roomType,
      studio.stagingStyle,
      studio.areaType,
      studio.prompt,
    ]
  );

  const [draft, setDraft] = useState<PerImageSetting[]>(initial);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [enabled, setEnabled] = useState<boolean>(true);

  // Object URLs for the uploaded photos. Created in an effect (not useMemo)
  // because React can drop memoized values at any time — if that happened
  // while we were also revoking in the memo, we'd render <img src=""> pointing
  // at revoked blob URLs. Effect + state gives us a stable value with a
  // deterministic cleanup, so URLs live exactly as long as the render that
  // uses them.
  const [objectUrls, setObjectUrls] = useState<string[]>([]);
  useEffect(() => {
    const urls = studio.files.map((f) =>
      f instanceof Blob ? URL.createObjectURL(f) : ""
    );
    setObjectUrls(urls);
    return () => {
      urls.forEach((u) => u && URL.revokeObjectURL(u));
    };
  }, [studio.files]);

  useEffect(() => {
    if (open) {
      setDraft(initial);
      setActiveIdx(0);
      setSliderPos(50);
      setEnabled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const activeFile = studio.files[activeIdx];
  const activeRow = draft[activeIdx];
  const activeUrl = objectUrls[activeIdx];

  const previewAfter = activeRow
    ? getDemoComparisonImageUrl({
        areaType: activeRow.areaType,
        roomType: activeRow.roomType,
        stagingStyle: activeRow.stagingStyle,
        before: false,
      })
    : "";

  const update = (i: number, patch: Partial<PerImageSetting>) =>
    setDraft((prev) => prev.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));

  const applyBulkStyle = (v: StagingStyle) =>
    setDraft((prev) => prev.map((row) => ({ ...row, stagingStyle: v })));

  const close = () => studio.setCustomizeModalOpen(false);

  const removeActive = () => {
    // Remove from studio.files and settings both — keep them aligned.
    studio.removeFile(activeIdx);
    setDraft((prev) => prev.filter((_, i) => i !== activeIdx));
    setActiveIdx((prev) => Math.max(0, Math.min(prev, studio.files.length - 2)));
  };

  const save = () => {
    if (enabled) {
      studio.setPerImageSettings(draft);
      studio.setUseCustomStyling(true);
    } else {
      studio.setUseCustomStyling(false);
    }
    close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-brand-900/50 backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 shrink-0">
          <h3 className="font-display text-lg font-bold text-brand-900">Customize Each Image</h3>
          <button
            onClick={close}
            className="text-cream-800/40 hover:text-brand-900"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto space-y-5">
          {/* Enabled banner */}
          <div className="bg-brand-50 border border-brand-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-brand-900">
                {enabled ? "Custom styling enabled" : "Custom styling disabled"}
              </p>
              <p className="text-[11px] text-brand-900/60 mt-0.5">
                {enabled
                  ? "Per-photo settings below will apply when you generate."
                  : "Bulk room/style from the main studio will apply to every photo."}
              </p>
            </div>
            <button
              onClick={() => setEnabled((v) => !v)}
              className="shrink-0 border border-brand-500 text-brand-500 hover:bg-brand-100 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              {enabled ? "Turn off" : "Turn on"}
            </button>
          </div>

          {stylingLocked && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Lock className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-[11px] text-amber-800">
                <p className="font-semibold mb-0.5">Staging style &amp; prompt are locked</p>
                <p>
                  {studio.isLoggedIn
                    ? "Upgrade to a Pro or Team plan to change staging style and add a custom prompt per photo. Room type and interior/exterior stay editable."
                    : "Sign in and upgrade to a Pro or Team plan to change staging style and add a custom prompt per photo. Room type and interior/exterior stay editable."}
                </p>
              </div>
            </div>
          )}

          {/* Bulk style */}
          <div>
            <p className="text-xs font-semibold text-cream-800/70 mb-1.5 flex items-center gap-1.5">
              Staging Style (for all images)
              {stylingLocked && <Lock className="w-3 h-3 text-cream-800/40" />}
            </p>
            <select
              onChange={(e) => applyBulkStyle(e.target.value as StagingStyle)}
              value={activeRow?.stagingStyle || "modern"}
              disabled={stylingLocked}
              title={stylingLocked ? lockedTitle : undefined}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs text-cream-800/80 bg-cream-50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {STYLES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Per-image section (only when at least one photo) */}
          {studio.files.length === 0 ? (
            <div className="bg-white border border-cream-200 rounded-2xl p-6 text-center text-sm text-cream-800/60">
              Upload photos first, then customize each one here.
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-cream-800/70 mb-3">Customize Each Image</p>

              {/* Big active preview */}
              <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-cream-100 mb-3 select-none border border-cream-200">
                {activeUrl && (
                  <img
                    src={activeUrl}
                    alt={activeFile?.name || "Uploaded"}
                    className="absolute inset-0 w-full h-full object-cover"
                    draggable={false}
                  />
                )}
                <div className="absolute top-0 left-0 w-1/2 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
                <span className="absolute top-3 left-3 bg-brand-900/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                  Before
                </span>
                <div
                  className="absolute inset-0 overflow-hidden pointer-events-none"
                  style={{ clipPath: `inset(0 0 0 ${sliderPos}%)` }}
                >
                  {previewAfter && (
                    <img
                      src={previewAfter}
                      alt="Preview after"
                      className="absolute inset-0 w-full h-full object-cover"
                      draggable={false}
                    />
                  )}
                  <div className="absolute top-0 right-0 w-full h-16 bg-gradient-to-b from-black/40 to-transparent" />
                  <span className="absolute top-3 right-3 bg-brand-500/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                    After Elevated
                  </span>
                </div>
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
                  style={{ left: `${sliderPos}%` }}
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-lg">
                    <MoveHorizontal className="w-3 h-3 text-brand-500" />
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={sliderPos}
                  onChange={(e) => setSliderPos(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
                  aria-label="Preview slider"
                />
              </div>
              <p className="text-[10px] text-cream-800/30 text-center mb-4">
                Preview example — drag to compare · updates with the fields below
              </p>

              {/* Thumbnail strip */}
              <div className="grid grid-cols-5 sm:grid-cols-6 gap-2 mb-4">
                {studio.files.map((f, i) => {
                  const active = i === activeIdx;
                  const url = objectUrls[i];
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setActiveIdx(i);
                        setSliderPos(50);
                      }}
                      className={
                        "aspect-square rounded-lg overflow-hidden border-2 transition-colors " +
                        (active ? "border-brand-500" : "border-cream-200 hover:border-brand-500/50")
                      }
                      title={f.name}
                    >
                      <img src={url} alt={f.name} className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>

              {/* Active photo settings */}
              {activeRow && (
                <div className="border border-cream-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider">
                      Image {activeIdx + 1} of {studio.files.length}
                    </span>
                    <button
                      onClick={removeActive}
                      className="text-cream-800/30 hover:text-red-500 text-xs inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Remove photo
                    </button>
                  </div>

                  {/* Interior / Exterior toggle */}
                  <div className="flex bg-cream-50 border border-cream-200 rounded-lg p-1 mb-3">
                    <button
                      onClick={() => update(activeIdx, { areaType: "interior" })}
                      className={
                        "flex-1 text-center text-[11px] font-semibold py-1.5 rounded transition-all " +
                        (activeRow.areaType === "interior"
                          ? "bg-brand-500 text-white"
                          : "text-cream-800/60")
                      }
                    >
                      Interior
                    </button>
                    <button
                      onClick={() => update(activeIdx, { areaType: "exterior" })}
                      className={
                        "flex-1 text-center text-[11px] font-semibold py-1.5 rounded transition-all " +
                        (activeRow.areaType === "exterior"
                          ? "bg-brand-500 text-white"
                          : "text-cream-800/60")
                      }
                    >
                      Exterior
                    </button>
                  </div>

                  {/* Room type */}
                  <p className="text-[11px] font-medium text-cream-800/60 mb-1">
                    Room Type <span className="text-cream-800/40">(Required)</span>
                  </p>
                  <select
                    value={activeRow.roomType}
                    onChange={(e) => update(activeIdx, { roomType: e.target.value as RoomType })}
                    className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50 mb-3"
                  >
                    {ROOMS.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>

                  {/* Staging style */}
                  <p className="text-[11px] font-medium text-cream-800/60 mb-1 flex items-center gap-1.5">
                    Staging Style
                    {stylingLocked && <Lock className="w-3 h-3 text-cream-800/40" />}
                  </p>
                  <select
                    value={activeRow.stagingStyle}
                    onChange={(e) =>
                      update(activeIdx, { stagingStyle: e.target.value as StagingStyle })
                    }
                    disabled={stylingLocked}
                    title={stylingLocked ? lockedTitle : undefined}
                    className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50 mb-3 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {STYLES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>

                  {/* Custom prompt */}
                  <p className="text-[11px] font-medium text-cream-800/60 mb-1 flex items-center gap-1.5">
                    Custom Prompt
                    {stylingLocked && <Lock className="w-3 h-3 text-cream-800/40" />}
                  </p>
                  <input
                    type="text"
                    maxLength={100}
                    value={activeRow.prompt}
                    onChange={(e) => update(activeIdx, { prompt: e.target.value })}
                    disabled={stylingLocked}
                    title={stylingLocked ? lockedTitle : undefined}
                    placeholder={
                      stylingLocked
                        ? "Available on Pro or Team plans"
                        : "e.g. add a reading nook by the window"
                    }
                    className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50 disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <p className="text-[10px] text-cream-800/30 mt-1 text-right">
                    {activeRow.prompt.length} / 100
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-cream-200 shrink-0">
          <p className="text-xs text-cream-800/50">
            {studio.files.length} image{studio.files.length === 1 ? "" : "s"} selected
          </p>
          <div className="flex gap-2">
            <button
              onClick={close}
              className="border border-cream-200 hover:bg-cream-50 text-brand-900 text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Apply Custom Styling
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
