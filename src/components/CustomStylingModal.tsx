"use client";

import React, { useEffect, useRef, useState } from "react";
import { X, Lock } from "lucide-react";
import { RoomType, StagingStyle } from "@/lib/errors";
import { exteriorOptions, interiorOptions, stagingStyles } from "./data/dropdown";
import { DEFAULT_DEMO_STYLE } from "./data/demoStylePreview";
import { getDemoComparisonImageUrl } from "./data/demoImagePaths";
import InfoHint from "@/components/ui/InfoHint";

interface CustomStylingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: File[];
  perImageSettings: Array<{
    roomType: RoomType | undefined;
    stagingStyle: StagingStyle | undefined;
    prompt?: string;
    areaType?: 'interior' | 'exterior';
  }>;
  setPerImageSettings: (settings: Array<{
    roomType: RoomType | undefined;
    stagingStyle: StagingStyle | undefined;
    prompt?: string;
    areaType?: 'interior' | 'exterior';
  }>) => void;
  areaType: "interior" | "exterior";
  onApply: () => void;
  onRemoveFile?: (index: number) => void;
  onAddFiles?: () => void;
  onCustomStylingChange?: (enabled: boolean) => void;
  enableCustomStyling?: boolean;
  onEnableCustomStylingChange?: (enabled: boolean) => void;
  forceSameStyleForAll?: boolean;
  imageDimensions?: Array<{ width: number; height: number }>;
  imageDimensionsRef?: React.MutableRefObject<Array<{ width: number; height: number }>>;
}

function ImageComparisonSlider({
  originalSrc,
  previewSrc,
  alt,
}: {
  originalSrc: string;
  previewSrc: string;
  alt: string;
}) {
  const [position, setPosition] = useState(50);
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const endDrag = () => {
      draggingRef.current = false;
    };
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, []);

  const updatePosition = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const nextPosition = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPosition(nextPosition);
  };

  return (
    <div
      ref={containerRef}
      className="relative h-52 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 select-none touch-none"
      onPointerDown={(event) => {
        event.preventDefault();
        draggingRef.current = true;
        updatePosition(event.clientX);
        try {
          event.currentTarget.setPointerCapture(event.pointerId);
        } catch {}
      }}
      onPointerMove={(event) => {
        if (!draggingRef.current) return;
        event.preventDefault();
        updatePosition(event.clientX);
      }}
      onPointerUp={(event) => {
        draggingRef.current = false;
        try {
          event.currentTarget.releasePointerCapture(event.pointerId);
        } catch {}
      }}
      onPointerCancel={() => {
        draggingRef.current = false;
      }}
    >
      <img src={previewSrc} alt={alt} className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${position}%` }}>
        <img src={originalSrc} alt={`${alt} preview`} className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-y-0 w-px bg-white shadow-sm" style={{ left: `${position}%` }} />
      <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full border border-white bg-white shadow-md flex items-center justify-center" style={{ left: `${position}%` }}>
        <div className="h-4 w-1 rounded-full bg-slate-400" />
      </div>
    </div>
  );
}

export function CustomStylingModal({
  isOpen,
  onClose,
  selectedFiles,
  perImageSettings,
  setPerImageSettings,
  areaType,
  onApply,
  onRemoveFile,
  onAddFiles,
  onCustomStylingChange,
  enableCustomStyling = false,
  onEnableCustomStylingChange,
  forceSameStyleForAll = false,
  imageDimensions = [],
  imageDimensionsRef,
}: CustomStylingModalProps) {
  // When custom styling is enabled (Pro+ plans), default to per-image customization (applySameStyleForAll = false)
  // When custom styling is disabled or forced (non-Pro), this doesn't matter as styling is locked
  const [applySameStyleForAll, setApplySameStyleForAll] = useState(forceSameStyleForAll);
  const isStyleLocked = forceSameStyleForAll;
  // Debug logging
  React.useEffect(() => {
  }, [forceSameStyleForAll, isStyleLocked, enableCustomStyling, applySameStyleForAll]);

  const [uploadedPreviewUrls, setUploadedPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const nextUrls = selectedFiles.map((file) => URL.createObjectURL(file));
    setUploadedPreviewUrls(nextUrls);

    return () => {
      nextUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [selectedFiles]);

  if (!isOpen) return null;

  const effectiveApplySameStyleForAll = forceSameStyleForAll ? true : applySameStyleForAll;
  const showGlobalStyleSelector = isStyleLocked || effectiveApplySameStyleForAll;
  const maxMultiImages = 15;
  const canAddMoreImages = selectedFiles.length < maxMultiImages;

  const handleAreaTypeChange = (index: number, next: 'interior' | 'exterior') => {
    const newSettings = [...perImageSettings];
    newSettings[index] = {
      ...newSettings[index],
      areaType: next,
      roomType: next === 'interior' ? 'living-room' : 'outdoor',
    };
    setPerImageSettings(newSettings);
  };

  const handleRoomTypeChange = (index: number, value: RoomType | undefined) => {
    const newSettings = [...perImageSettings];
    newSettings[index] = { ...newSettings[index], roomType: value };
    setPerImageSettings(newSettings);
  };

  const handleStagingStyleChange = (index: number, value: StagingStyle | undefined) => {
    const newSettings = [...perImageSettings];
    if (effectiveApplySameStyleForAll) {
      // Apply same style to all images
      newSettings.forEach((_, i) => {
        newSettings[i] = { ...newSettings[i], stagingStyle: value };
      });
    } else {
      // Apply only to this image
      newSettings[index] = { ...newSettings[index], stagingStyle: value };
    }
    setPerImageSettings(newSettings);
  };

  const handlePromptChange = (index: number, value: string) => {
    const newSettings = [...perImageSettings];
    newSettings[index] = { ...newSettings[index], prompt: value };
    setPerImageSettings(newSettings);
  };

  const getPreviewImageUrl = (index: number) => {
    const settings = perImageSettings[index];
    const previewAreaType = settings?.areaType || areaType;
    const previewStyle = (isStyleLocked || effectiveApplySameStyleForAll)
      ? (perImageSettings[0]?.stagingStyle || DEFAULT_DEMO_STYLE)
      : (settings?.stagingStyle || DEFAULT_DEMO_STYLE);

    return getDemoComparisonImageUrl({
      areaType: previewAreaType,
      roomType: settings?.roomType || (previewAreaType === 'interior' ? 'living-room' : 'outdoor'),
      exteriorType: settings?.roomType || (previewAreaType === 'interior' ? 'living-room' : 'outdoor'),
      stagingStyle: previewStyle,
      before: false,
    });
  };

  const getBeforeImageUrl = (index: number) => {
    const settings = perImageSettings[index];
    const previewAreaType = settings?.areaType || areaType;
    const previewStyle = (isStyleLocked || effectiveApplySameStyleForAll)
      ? (perImageSettings[0]?.stagingStyle || DEFAULT_DEMO_STYLE)
      : (settings?.stagingStyle || DEFAULT_DEMO_STYLE);

    return getDemoComparisonImageUrl({
      areaType: previewAreaType,
      roomType: settings?.roomType || (previewAreaType === 'interior' ? 'living-room' : 'outdoor'),
      exteriorType: settings?.roomType || (previewAreaType === 'interior' ? 'living-room' : 'outdoor'),
      stagingStyle: previewStyle,
      before: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Customize Each Image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Enable Custom Styling Toggle */}
          {!enableCustomStyling ? (
            <div className="mb-6 pb-6 border-b">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={enableCustomStyling}
                  onChange={(e) => {
                    const nextEnabled = e.target.checked;
                    onEnableCustomStylingChange?.(nextEnabled);
                    onCustomStylingChange?.(nextEnabled);
                  }}
                  className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <div>
                  <span className="text-lg font-semibold text-slate-700 block">
                    Enable Custom Styling
                  </span>
                  <span className="text-sm text-slate-500">
                    View your uploaded images without customization
                  </span>
                </div>
              </label>
            </div>
          ) : (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-indigo-900">Custom styling enabled</p>
                <p className="text-xs text-indigo-700">The step is collapsed so you can focus on the uploaded images.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onEnableCustomStylingChange?.(false);
                  onCustomStylingChange?.(false);
                }}
                className="rounded-md border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Turn off
              </button>
            </div>
          )}

          {/* Apply Same Style for All Checkbox - Only shown when enabled */}
          {enableCustomStyling && areaType === "interior" && !isStyleLocked && (
            <div className="mb-6 pb-6 border-b bg-blue-50/50 p-4 rounded-lg">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={effectiveApplySameStyleForAll}
                  onChange={(e) => setApplySameStyleForAll(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-md font-medium text-slate-700">
                  Apply same style to all images
                </span>
              </label>
            </div>
          )}

          {/* Global Style Selector - Only shown when enabled */}
          {enableCustomStyling && areaType === "interior" && showGlobalStyleSelector && (
            <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/80 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Staging Style {isStyleLocked ? "(for all images)" : "(applies to all images)"}
              </label>
              <select
                value={perImageSettings[0]?.stagingStyle || DEFAULT_DEMO_STYLE}
                onChange={(event) => handleStagingStyleChange(0, event.target.value as StagingStyle)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select Style...</option>
                {stagingStyles.map((style) => (
                  <option key={style.value} value={style.value}>
                    {style.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Images Grid */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              {enableCustomStyling ? "Customize Each Image" : "Uploaded Images"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {selectedFiles.map((file, index) => {
                // Use ref as source of truth (updated synchronously), fallback to state
                const dims = imageDimensionsRef?.current || imageDimensions;
                
                // Check if this image has low resolution (below 1024x768)
                  const isLowResolution = dims && dims.length > index && dims[index] &&
                  (dims[index].width * dims[index].height < 1024 * 768);
                
                // Debug logging
                if (index === 0) {
                  dims?.forEach((dim: { width: number; height: number }, i: number) => {
                  });
                }
                
                
                return (
                  <div
                    key={index}
                    className={`relative border rounded-lg p-5 bg-white hover:shadow-md transition-shadow ${
                      isLowResolution 
                        ? 'border-red-300 ring-2 ring-red-200' 
                        : 'border-slate-200'
                    }`}
                  >
                  <button
                    type="button"
                    onClick={() => onRemoveFile?.(index)}
                    className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Remove image ${index + 1}`}
                    title="Remove image"
                  >
                    <X size={16} />
                  </button>

                  <div className="mb-3 flex items-center justify-evenly">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Image {index + 1} of {selectedFiles.length}
                    </p>
                    {isLowResolution && (
                      <span className="text-xs  font-semibold px-2 py-1 rounded-full bg-red-100 text-red-700">
                        Low Resolution
                      </span>
                    )}
                  </div>

                  <div className="mb-5">
                    <ImageComparisonSlider
                      originalSrc={uploadedPreviewUrls[index] || getBeforeImageUrl(index)}
                      previewSrc={getPreviewImageUrl(index)}
                      alt={`Image ${index + 1}`}
                    />
                  </div>

                  <div className="mb-4">
                    <div className="flex gap-2 mb-2">
                      <button
                        type="button"
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold ${perImageSettings[index]?.areaType === 'interior' || (!perImageSettings[index]?.areaType && areaType === 'interior')
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        onClick={() => handleAreaTypeChange(index, 'interior')}
                      >
                        Interior
                      </button>
                      <button
                        type="button"
                        className={`px-3 py-2 rounded-lg border text-xs font-semibold ${perImageSettings[index]?.areaType === 'exterior' || (!perImageSettings[index]?.areaType && areaType === 'exterior')
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                        onClick={() => handleAreaTypeChange(index, 'exterior')}
                      >
                        Exterior
                      </button>
                    </div>

                    <label className="flex text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                      <span>{(perImageSettings[index]?.areaType || areaType) === "interior" ? "Room Type" : "Area Type"}</span>
                      <span className="text-xs text-slate-400">(Required)</span>
                    </label>
                    <select
                      value={perImageSettings[index]?.roomType || ""}
                      onChange={(e) => handleRoomTypeChange(index, e.target.value as RoomType)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                      <option value="">Select {(perImageSettings[index]?.areaType || areaType) === "interior" ? "Room" : "Area"}...</option>
                      {((perImageSettings[index]?.areaType || areaType) === 'interior' ? interiorOptions : exteriorOptions).map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {enableCustomStyling && (perImageSettings[index]?.areaType || areaType) === "interior" && (
                    <div className="mb-4">
                      <label className="flex text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                        <span>Staging Style</span>
                        {isStyleLocked && (
                          <div title="Available on Pro+ plans" className="flex">
                            <Lock size={14} className="text-amber-500" />
                          </div>
                        )}
                        <InfoHint
                          text="Select any style to preview how this image may look. Final generated results are AI-based and can vary slightly."
                          className="ml-auto"
                          iconClassName="text-indigo-500"
                        />
                      </label>
                      {isStyleLocked || (effectiveApplySameStyleForAll && index > 0) ? (
                        <div className="relative" title="Upgrade to Pro+ plan to customize styling for each image">
                          <select
                            disabled
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed opacity-60 text-sm"
                          >
                            <option>Locked on your plan</option>
                          </select>
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                        </div>
                      ) : (
                        <select
                          value={perImageSettings[index]?.stagingStyle || ""}
                          onChange={(e) => handleStagingStyleChange(index, e.target.value as StagingStyle)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        >
                          <option value="">Select Style...</option>
                          {stagingStyles.map((style) => (
                            <option key={style.value} value={style.value}>
                              {style.label}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="text-xs text-slate-400 mt-1 text-right">{(perImageSettings[index]?.prompt || '').length} / 100</div>
                    </div>
                  )}

                  {enableCustomStyling && (
                    <div>
                      <label className="flex text-sm font-semibold text-slate-700 mb-2 items-center gap-2">
                        <span>Custom Prompt</span>
                        <InfoHint
                          text="Custom prompts are applied very literally. To get the best results, keep your prompt short and focused, but make sure it includes all essential instructions. The AI will primarily follow the changes you specify, so avoid long or repetitive prompts."
                          className="ml-auto"
                          iconClassName="text-indigo-500"
                        />
                        {isStyleLocked && (
                          <div title="Available on Pro+ plans" className="flex">
                            <Lock size={14} className="text-amber-500" />
                          </div>
                        )}
                      </label>
                      {isStyleLocked ? (
                        <div className="relative">
                          <input
                            type="text"
                              disabled
                              placeholder="Upgrade to Pro+ plan"
                              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed opacity-60 text-sm"
                          />
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
                        </div>
                      ) : (
                        <input
                          type="text"
                          value={perImageSettings[index]?.prompt || ""}
                          onChange={(e) => handlePromptChange(index, e.target.value)}
                          placeholder="Describe how you'd like this image staged (optional)"
                          maxLength={100}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        />
                      )}
                    </div>
                  )}
                </div>
                );
              })}

              {canAddMoreImages && (
                <button
                  type="button"
                  onClick={onAddFiles}
                  className="min-h-112 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-left transition hover:border-indigo-400 hover:bg-indigo-50/40"
                >
                  <div className="flex h-full min-h-96 flex-col items-center justify-center gap-3 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                      <X className="h-5 w-5 rotate-45" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">Add another image</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Upload up to {maxMultiImages - selectedFiles.length} more image{maxMultiImages - selectedFiles.length === 1 ? '' : 's'}
                      </p>
                    </div>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-slate-50 border-t p-6 flex justify-between gap-4">
          <p className="text-sm text-slate-600 self-center">
            {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={onApply}
              disabled={!enableCustomStyling}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                enableCustomStyling
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {enableCustomStyling ? 'Apply Custom Styling' : 'Enable styling to apply'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
