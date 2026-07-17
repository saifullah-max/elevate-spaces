"use client";

import { useRef, useState } from "react";
import { CloudUpload, X } from "lucide-react";
import type { StudioController } from "./useStudio";
import { showStudioToast } from "./StudioToast";
import InfoTip from "./InfoTip";

interface Props {
  studio: StudioController;
}

export default function UploadCard({ studio }: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => inputRef.current?.click();

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px]">
          1
        </span>
        Upload photos
        <InfoTip>
          {studio.isLoggedIn
            ? `${studio.files.length}/15 photos selected. Each photo gets its own room, style, and 3 AI variants.`
            : "Upload up to 15 photos of the listing. Each photo gets its own room type, style, and 3 generated concepts."}
        </InfoTip>
      </p>

      <div
        onClick={openPicker}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const count = e.dataTransfer.files?.length ?? 0;
          studio.addFiles(e.dataTransfer.files);
          if (count > 0) {
            const total = Math.min(studio.files.length + count, 15);
            showStudioToast(
              `${count} photo${count === 1 ? "" : "s"} uploaded - ${total}/15`
            );
          }
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
        className={
          "cursor-pointer block border-2 border-dashed rounded-xl p-6 text-center transition-colors " +
          (dragOver
            ? "border-brand-500 bg-brand-100/60"
            : "border-brand-500/40 bg-brand-50/40 hover:bg-brand-50")
        }
      >
        <CloudUpload className="text-brand-500 w-6 h-6 mx-auto mb-2" />
        <p className="text-sm text-cream-800/70">
          Drop up to{" "}
          <span className="font-semibold text-brand-900">15 photos</span> · JPG / PNG
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const count = e.target.files?.length ?? 0;
          studio.addFiles(e.target.files);
          if (count > 0) {
            const total = Math.min(studio.files.length + count, 15);
            showStudioToast(
              `${count} photo${count === 1 ? "" : "s"} uploaded - ${total}/15`
            );
          }
          e.currentTarget.value = "";
        }}
      />

      {studio.files.length > 0 && (
        <div className="flex gap-2 mt-4 flex-wrap">
          {studio.files.map((f, i) => {
            const url = URL.createObjectURL(f);
            return (
              <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-cream-200 group">
                <img
                  src={url}
                  alt={f.name}
                  className="w-full h-full object-cover"
                  onLoad={() => URL.revokeObjectURL(url)}
                />
                <button
                  onClick={() => studio.removeFile(i)}
                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-brand-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
