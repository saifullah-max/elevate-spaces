"use client";

import {
  UploadCloud,
  Monitor,
  Download,
  Share2,
  MoveHorizontal,
  Sparkles,
  Settings,
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useDemoApi } from "./useDemoApi";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showInfo, showError } from './toastUtils';
import { VALID_ROOM_TYPES, VALID_STAGING_STYLES, type RoomType, type StagingStyle } from "@/lib/errors";

export default function Demo() {

  // Use modularized API logic
  const {
    loading,
    restageLoading,
    error,
    stagedImageUrl,
    stagedId,
    demoCount,
    demoLimit,
    isDemo,
    isRepeatDemoUser,
    isBlocked,
    limitReached,
    setError,
    setStagedImageUrl,
    setStagedId,
    setDemoCount,
    setDemoLimit,
    setIsDemo,
    setIsRepeatDemoUser,
    setIsBlocked,
    setLimitReached,
    handleStageImage,
    handleRestageImage,
  } = useDemoApi();

  // Show info toast on mount
  useEffect(() => {
    showInfo("You can stage up to 10 demo images per device for free. After that, you'll need to sign up to continue. The demo limit resets every 30 days for each device. Abuse may result in a block.");
  }, []);

  // Show error toast if blocked
  useEffect(() => {
    if (isBlocked) {
      showError('Demo access has been blocked for this device due to repeated use. Please sign up or contact support for help.');
    }
  }, [isBlocked]);

  // Ref and state to sync left panel height with image area
  const imageAreaRef = useRef<HTMLDivElement | null>(null);
  const [imageAreaHeight, setImageAreaHeight] = useState<number | undefined>(undefined);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function updateHeight() {
      if (imageAreaRef.current) {
        setImageAreaHeight(imageAreaRef.current.offsetHeight);
      }
    }
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);
  // For restage feature
  const [restagePrompt, setRestagePrompt] = useState("");
  const stagedImgRef = useRef<HTMLImageElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [areaType, setAreaType] = useState<"interior" | "exterior">("interior");
  const [roomType, setRoomType] = useState<RoomType | undefined>(undefined);
  const [exteriorType, setExteriorType] = useState<RoomType | undefined>(undefined);
  const [selectedStagingStyle, setSelectedStagingStyle] = useState<StagingStyle | undefined>(undefined);

  // Dropdown options (label-value pairs)
  const interiorOptions: { label: string; value: RoomType }[] = [
    { label: "Living Room", value: "living-room" },
    { label: "Bedroom", value: "bedroom" },
    { label: "Kitchen", value: "kitchen" },
    { label: "Bathroom", value: "bathroom" },
    { label: "Dining Room", value: "dining-room" },
    { label: "Office", value: "office" },
    { label: "Basement", value: "basement" },
    { label: "Attic", value: "attic" },
    { label: "Hallway", value: "hallway" },
    { label: "Other", value: "other" },
  ];
  const exteriorOptions: { label: string; value: RoomType }[] = [
    { label: "Outdoor", value: "outdoor" },
    { label: "Garage", value: "garage" },
    { label: "Other", value: "other" },
  ];
  const stagingStyles: { label: string; value: StagingStyle }[] = [
    { label: "Modern", value: "modern" },
    { label: "Contemporary", value: "contemporary" },
    { label: "Minimalist", value: "minimalist" },
    { label: "Scandinavian", value: "scandinavian" },
    { label: "Industrial", value: "industrial" },
    { label: "Traditional", value: "traditional" },
    { label: "Transitional", value: "transitional" },
    { label: "Farmhouse", value: "farmhouse" },
    { label: "Coastal", value: "coastal" },
    { label: "Bohemian", value: "bohemian" },
    { label: "Mid-century", value: "mid-century" },
    { label: "Luxury", value: "luxury" },
  ];

  // Modularized Dropdown
  function Dropdown<T extends string>({ label, value, options, onChange, placeholder }: {
    label: string;
    value: T | undefined;
    options: { label: string; value: T }[];
    onChange: (v: T) => void;
    placeholder?: string;
  }) {
    return (
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
        <select
          className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none mb-3"
          value={value || ""}
          onChange={e => onChange(e.target.value as T)}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  const handleMove = (clientX: number) => {
    const rect = document
      .getElementById("slider-container")
      ?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percentage);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag as any);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleDrag as any);
      window.addEventListener("touchend", handleEnd);
      return () => {
        window.removeEventListener("mousemove", handleDrag as any);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleDrag as any);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging]);

  // ---------- UploadArea ----------
  const UploadArea = () => {
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleDivClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files[0]) {
        const selectedFile = files[0];
        setFile(selectedFile);
        setStagedImageUrl(null); // reset previous result
        setError(null);
      }
    };

    return (
      <div
        onClick={limitReached ? undefined : handleDivClick}
        className={`border-2 border-dashed border-slate-300 rounded-lg p-6 text-center ${limitReached
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-indigo-500"
          } bg-white transition-colors group`}
      >
        <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:text-indigo-500 transition-colors" />
        <span className="text-xs text-slate-600 font-medium block">
          {limitReached ? "Demo Limit Reached" : "Click to Upload"}
        </span>
        <span className="text-[10px] text-slate-400 block mt-1">
          Single JPG/PNG
        </span>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          disabled={limitReached}
        />
      </div>
    );
  };

  // ...existing code...

  return (
    <>
      <ToastContainer />
      <section id="try-it-free" className="pt-32 pb-12">
        {/* DEMO LIMIT ALERT */}
        <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-50 text-yellow-900 text-sm font-semibold border border-yellow-200 shadow animate-slide-down">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <span>
              You can stage up to <b>10 demo images</b> for free. After that, you'll need to sign up to continue. The demo limit resets every 30 days. Abuse may result in a block.
            </span>
          </div>
        </div>
        {/* BLOCKED ALERT */}
        {isBlocked && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-900 text-sm font-semibold border border-red-200 shadow animate-slide-down">
              <span>🚫</span>
              <span>
                Demo access has been <b>blocked</b> due to repeated use. Please <a href="/sign-up" className="underline text-red-700">sign up</a> or <a href="/support" className="underline text-red-700">contact support</a> for help.
              </span>
            </div>
          </div>
        )}
        {/* REPEAT DEMO USER OUTREACH */}
        {isRepeatDemoUser && !isBlocked && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 text-blue-900 text-sm font-semibold border border-blue-200 shadow animate-slide-down">
              <span>💬</span>
              <span>
                Hey, we noticed you've visited a few times but haven't signed up yet. Is there anything holding you back? <a href="/support" className="underline text-blue-700">Chat with us</a> or <a href="/feedback" className="underline text-blue-700">share feedback</a>!
              </span>
            </div>
          </div>
        )}
        {/* HERO SECTION */}
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6 border border-indigo-100 animate-slide-down">
            <div className="flex items-center justify-center w-4 h-4 rounded-full">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>For Sales &amp; Rentals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 animate-slide-up">
            Don't Just List a Property. <br />
            <span className="text-indigo-600 px-2 rounded-lg">
              Showcase Potential.
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 animate-fade-in delay-300">
            AI Staging, Virtual Renovation &amp; Furnishing for modern real
            estate.
          </p>
        </div>

        <div className="mt-8 max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in delay-500">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center px-6">
            <span className="font-bold flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span id="workspace-title">Instant AI Staging Demo</span>
            </span>
            <span className="text-xs font-mono text-indigo-200 ml-auto">
              Demo Used: {demoCount} / {demoLimit}
            </span>
          </div>

          <div className="grid lg:grid-cols-3">
            {/* Controls */}
            <div
              ref={leftPanelRef}
              className="p-4 border-r border-slate-200 bg-linear-to-b from-slate-50 to-white flex flex-col gap-4 overflow-y-auto custom-scrollbar relative"
              style={imageAreaHeight ? { height: imageAreaHeight } : {}}
            >
              {/* Demo usage progress */}
              <div className="mb-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-indigo-700 flex items-center gap-1">
                    <Sparkles className="w-4 h-4" /> Demo Usage
                  </span>
                  <span className="text-xs text-slate-500">{demoCount} / {demoLimit}</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-2 bg-linear-to-r from-indigo-400 to-indigo-600 rounded-full transition-all"
                    style={{ width: `${Math.min((demoCount / demoLimit) * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Upload Section */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 mb-1 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">1. Upload Photo</span>
                </div>
                <span className="text-xs text-slate-500 mb-1">JPG/PNG, 1 image only</span>
                <UploadArea />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-1" />

              {/* Area Type & Options */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">2. Area & Style</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${areaType === "interior"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    onClick={() => setAreaType("interior")}
                  >
                    Interior
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${areaType === "exterior"
                      ? "bg-indigo-600 text-white border-indigo-600 shadow"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                      }`}
                    onClick={() => setAreaType("exterior")}
                  >
                    Exterior
                  </button>
                </div>
                {areaType === "interior"
                  ? (
                    <Dropdown<RoomType>
                      label="Interior Type"
                      value={roomType}
                      options={interiorOptions}
                      onChange={setRoomType}
                      placeholder="Select Interior Type"
                    />
                  )
                  : (
                    <Dropdown<RoomType>
                      label="Exterior Type"
                      value={exteriorType}
                      options={exteriorOptions}
                      onChange={setExteriorType}
                      placeholder="Select Exterior Type"
                    />
                  )}
                <Dropdown<StagingStyle>
                  label="Staging Style"
                  value={selectedStagingStyle}
                  options={stagingStyles}
                  onChange={setSelectedStagingStyle}
                  placeholder="Select Staging Style"
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-1" />

              {/* Prompt & Action */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">3. Refine (Optional)</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. kid friendly, bright colors"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
                <Button
                  className="w-full text-xs font-bold mt-2"
                  onClick={() => {
                    handleStageImage(file, roomType, exteriorType, selectedStagingStyle, prompt, areaType);
                    if (limitReached) {
                      showError('Demo limit reached. Please sign up and continue to buying a plan for further image staging.');
                    }
                  }}
                  disabled={
                    loading ||
                    !file ||
                    (areaType === "interior" ? !roomType : !exteriorType) ||
                    !selectedStagingStyle
                  }
                >
                  {loading ? "Processing..." : "Update Preview"}
                </Button>
                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </div>
            </div>

            {/* Canvas - Before/After Slider */}
            <div
              ref={imageAreaRef}
              id="slider-container"
              className="lg:col-span-2 relative aspect-video bg-slate-100 overflow-hidden select-none min-h-80"
              style={{ minWidth: 0 }}
            >
              {/* BEFORE Image (Empty) */}
              <img
                src={
                  file
                    ? URL.createObjectURL(file)
                    : "/unfurnished-room.png"
                }
                alt="Empty room before staging"
                className="absolute inset-0 w-full h-full object-cover"
                style={{ zIndex: 1 }}
              />

              {/* AFTER Image (Staged) */}
              {stagedImageUrl ? (
                <>
                  <img
                    ref={stagedImgRef}
                    src={stagedImageUrl}
                    alt="Staged living room"
                    className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                    draggable={false}
                    onContextMenu={isDemo ? (e) => e.preventDefault() : undefined}
                    style={{
                      userSelect: 'none',
                      zIndex: 2,
                      clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                    }}
                  />
                  {/* Overlay to block interaction for demo images */}
                  {isDemo && (
                    <div
                      className="absolute inset-0 z-10"
                      style={{ cursor: 'not-allowed', background: 'rgba(255,255,255,0)', pointerEvents: 'auto' }}
                      onContextMenu={e => e.preventDefault()}
                    />
                  )}
                </>
              ) : (
                <img
                  src="/furnished-room.png"
                  alt="Staged living room"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                  style={{
                    userSelect: 'none',
                    zIndex: 2,
                    clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                  }}
                />
              )}

              {/* Slider Line + Handle */}
              <div
                className="absolute inset-y-0 w-1 bg-white shadow-2xl"
                style={{ left: `${sliderPosition}%` }}
              >
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-indigo-600 cursor-ew-resize"
                  onMouseDown={handleStart}
                  onTouchStart={handleStart}
                  style={{ zIndex: 20 }}
                >
                  <MoveHorizontal className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              {/* Top Right Actions */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                {!isDemo && (
                  <button className="bg-white/90 hover:bg-white p-2 rounded-lg border border-slate-200 shadow-md transition">
                    <Download className="w-4 h-4 text-slate-700 hover:text-indigo-600" />
                  </button>
                )}
                <button className="bg-white/90 hover:bg-white p-2 rounded-lg border border-slate-200 shadow-md transition">
                  <Share2 className="w-4 h-4 text-slate-700 hover:text-indigo-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Restage with new prompt UI - always visible below the image/canvas area */}
      {stagedImageUrl && (
        <div className="max-w-2xl mx-auto mt-8 animate-fade-in">
          <div className="bg-white rounded-xl shadow border border-slate-100 p-4 flex flex-col sm:flex-row gap-2 items-center">
            <input
              type="text"
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="Update prompt & restage..."
              value={restagePrompt}
              onChange={e => setRestagePrompt(e.target.value)}
              disabled={restageLoading}
            />
            <Button
              className="text-xs font-bold"
              disabled={restageLoading || !restagePrompt}
              onClick={() => handleRestageImage(stagedId, restagePrompt, roomType, exteriorType, selectedStagingStyle, areaType)}
            >
              {restageLoading ? "Restaging..." : "Restage with Prompt"}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}