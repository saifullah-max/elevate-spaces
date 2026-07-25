"use client";

import { useState } from "react";
import { Images, Info, Sliders, X } from "lucide-react";
import type { StudioController } from "./useStudio";
import type { RoomType, StagingStyle } from "@/lib/errors";
import InfoTip from "./InfoTip";

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

export default function AreaStyleCard({ studio }: Props) {
  const isMulti = studio.files.length > 1;
  const hasFiles = studio.files.length > 0;
  const promptLen = studio.prompt.length;
  const [needMorePhotosOpen, setNeedMorePhotosOpen] = useState(false);

  const handleCustomizeClick = () => {
    if (studio.files.length === 1) {
      setNeedMorePhotosOpen(true);
      return;
    }
    studio.setCustomizeModalOpen(true);
  };

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px]">
          3
        </span>
        Area &amp; Style
        <InfoTip>
          {studio.isLoggedIn
            ? `Bulk defaults applied to all ${studio.files.length || 0} photo${studio.files.length === 1 ? "" : "s"}. Override per photo with "Customize each image".`
            : 'Sets the default room type and style for every uploaded photo. Need different settings per photo? Use "Customize each image" below.'}
        </InfoTip>
      </p>

      {!isMulti && (
        <div className="mb-4">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-cream-800/50 font-medium mb-1.5">Room type</p>
              <select
                value={studio.roomType}
                onChange={(e) => studio.setRoomType(e.target.value as RoomType)}
                className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs text-cream-800/80 bg-cream-50"
              >
                {ROOMS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="text-xs text-cream-800/50 font-medium mb-1.5">Staging style</p>
              <select
                value={studio.stagingStyle}
                onChange={(e) => studio.setStagingStyle(e.target.value as StagingStyle)}
                className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs text-cream-800/80 bg-cream-50"
              >
                {STYLES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-xs text-cream-800/50 font-medium mb-1.5">Area</p>
          <div className="flex bg-cream-50 border border-cream-200 rounded-lg p-1 mb-4 w-fit">
            <button
              type="button"
              onClick={() => studio.setAreaType("interior")}
              className={
                "px-4 text-center text-[11px] py-1.5 rounded transition-all " +
                (hasFiles && studio.areaType === "interior"
                  ? "bg-brand-500 text-white font-semibold"
                  : "text-cream-800/60 font-semibold")
              }
            >
              Interior
            </button>
            <button
              type="button"
              onClick={() => studio.setAreaType("exterior")}
              className={
                "px-4 text-center text-[11px] py-1.5 rounded transition-all " +
                (hasFiles && studio.areaType === "exterior"
                  ? "bg-brand-500 text-white font-semibold"
                  : "text-cream-800/60 font-semibold")
              }
            >
              Exterior
            </button>
          </div>

          <div className="flex items-center gap-1 mb-1">
            <p className="text-xs text-cream-800/50 font-medium">
              Custom Prompt <span className="text-cream-800/30">(optional)</span>
            </p>
            <InfoTip iconClassName="text-cream-800/30" size="xs">
              {studio.isLoggedIn
                ? "Extra instruction for the AI on top of room + style. Example: add a reading nook by the window."
                : 'Free-text instruction for the AI model, e.g. "add a reading nook by the window."'}
            </InfoTip>
          </div>
          <input
            type="text"
            maxLength={100}
            value={studio.prompt}
            onChange={(e) => studio.setPrompt(e.target.value)}
            placeholder="e.g. add a reading nook by the window"
            className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs bg-cream-50"
          />
          <p className="text-[10px] text-cream-800/30 mt-1 text-right">{promptLen} / 100</p>
        </div>
      )}

      {isMulti && (
        <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4">
          <p className="text-xs text-brand-900">
            <Info className="w-3 h-3 text-brand-500 inline mr-1.5" />
            You've uploaded multiple photos — set the room type, style, and any custom prompt for
            each one below in <span className="font-semibold">Customize Each Image</span>.
          </p>
        </div>
      )}

      <button
        type="button"
        disabled={studio.files.length === 0}
        onClick={handleCustomizeClick}
        title={
          studio.files.length === 0
            ? "Upload at least one photo first"
            : "Set room, style, area, and prompt per photo"
        }
        className="w-full border border-dashed border-brand-500/40 text-brand-500 text-xs font-semibold py-2.5 rounded-lg hover:bg-brand-50 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <Sliders className="w-3 h-3" /> Customize each image individually
        {studio.useCustomStyling && (
          <span className="ml-2 text-[10px] font-bold uppercase tracking-widest bg-brand-500 text-white px-2 py-0.5 rounded-md">
            On
          </span>
        )}
      </button>

      {needMorePhotosOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-brand-900/50 backdrop-blur-sm"
          onClick={() => setNeedMorePhotosOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-xl text-center"
          >
            <button
              onClick={() => setNeedMorePhotosOpen(false)}
              className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-brand-100 mx-auto flex items-center justify-center mb-4">
              <Images className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-brand-900 mb-2">
              Upload more photos to use this
            </h3>
            <p className="text-sm text-cream-800/60 mb-6">
              Customize Each Image is for setting a different room, style, and prompt per photo
              across a batch. With just one photo, use the Room type and Staging style fields above
              instead — upload more than one photo to unlock this.
            </p>
            <button
              type="button"
              onClick={() => setNeedMorePhotosOpen(false)}
              className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
