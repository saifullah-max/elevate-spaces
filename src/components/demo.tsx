// Remove Furniture toggle state
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

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useDemoApi } from "./useDemoApi";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { showInfo, showError } from './toastUtils';
import { DemoDropdown } from "./DemoDropdown";
import { UploadArea } from "./UploadArea";
import { RoomType, StagingStyle } from "@/lib/errors";
import { exteriorOptions, interiorOptions, stagingStyles } from "./data/dropdown";
import { TeamCreditsSelector } from "./TeamCreditsSelector";


export default function Demo() {
  // Move selectedImageIdx state to Demo
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);


  const {
    loading,
    restageLoading,
    error,
    stagedImageUrls,
    stagedIds,
    demoCount,
    demoLimit,
    isDemo,
    isRepeatDemoUser,
    isBlocked,
    limitReached,
    setError,
    setStagedImageUrls,
    setStagedIds,
    setDemoCount,
    setDemoLimit,
    setIsDemo,
    setIsRepeatDemoUser,
    setIsBlocked,
    setLimitReached,
    handleStageImage,
    handleRestageImage,
  } = useDemoApi({ selectedImageIdx, setSelectedImageIdx });

  // Show info toast on mount
  useEffect(() => {
    showInfo("You can stage up to 10 demo images per device for free. After that, you'll need to sign up to continue. The demo limit resets every 30 days for each device. Abuse may result in a block.");
  }, []);

  // Only reset selectedImageIdx to 0 when a new generation occurs (when array is cleared and refilled)
  const prevUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    // If the array was just cleared and refilled (new generation), reset index to 0
    if (
      prevUrlsRef.current.length > 1 &&
      stagedImageUrls.length > 0 &&
      stagedImageUrls.length < prevUrlsRef.current.length
    ) {
      setSelectedImageIdx(0);
    }
    // Update ref for next render
    prevUrlsRef.current = stagedImageUrls;
  }, [stagedImageUrls]);


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
  // Toggle for generate vs restage
  const [mode, setMode] = useState<'generate' | 'restage'>('generate');
  const stagedImgRef = useRef<HTMLImageElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState("");
  const [areaType, setAreaType] = useState<"interior" | "exterior">("interior");
  const [roomType, setRoomType] = useState<RoomType | undefined>(undefined);
  const [exteriorType, setExteriorType] = useState<RoomType | undefined>(undefined);
  const [selectedStagingStyle, setSelectedStagingStyle] = useState<StagingStyle | undefined>(undefined);
  // const [removeFurniture, setRemoveFurniture] = useState(false);

  // Team selection state
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [refreshTeamCredits, setRefreshTeamCredits] = useState<(() => Promise<void>) | null>(null);

  // Check if user is logged in
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      setIsLoggedIn(!!authRaw);
    }
  }, []);

  const handleTeamSelect = (teamId: string | null, remaining: number) => {
    setSelectedTeamId(teamId);
    setRemainingCredits(remaining);
  };

  const handleRefreshReady = useCallback((refreshFn: () => Promise<void>) => {
    setRefreshTeamCredits(() => refreshFn);
  }, []);

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

          <div className="grid lg:grid-cols-3 relative">
            {/* Controls */}
            <div
              ref={leftPanelRef}
              className="p-4 border-r border-slate-200 bg-linear-to-b from-slate-50 to-white flex flex-col gap-4 overflow-y-auto custom-scrollbar relative"
              style={imageAreaHeight ? { height: imageAreaHeight } : {}}
            >
              {/* Down arrow indicator for small screens */}
              {(
                // Show if there is a file or staged images (i.e., something to see below)
                (file || (stagedImageUrls && stagedImageUrls.length > 0))
              ) && (
                  <div className="flex lg:hidden w-full  justify-center mt-2 animate-bounce" aria-hidden="true">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-down">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                  </div>
                )}
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
                <UploadArea limitReached={limitReached} setFile={setFile} setStagedImageUrls={setStagedImageUrls} setError={setError} />
              </div>

              {/* Team Credits Selector - Only show for logged-in users */}
              {isLoggedIn && (
                <>
                  <div className="border-t border-slate-200 my-1" />
                  <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                    <TeamCreditsSelector 
                      onTeamSelect={handleTeamSelect}
                      selectedTeamId={selectedTeamId}
                      disabled={loading || restageLoading}
                      onRefreshReady={handleRefreshReady}
                    />
                  </div>
                </>
              )}

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
                {areaType === "interior" && (
                  <DemoDropdown<RoomType>
                    label="Interior Type"
                    value={roomType}
                    options={interiorOptions}
                    onChange={setRoomType}
                    // placeholder={removeFurniture ? "Select Interior Type (optional)" : "Select Interior Type (required)"}
                  />
                )}
                {areaType === "exterior" && (
                  <DemoDropdown<RoomType>
                    label="Exterior Type (optional)"
                    value={exteriorType}
                    options={exteriorOptions}
                    onChange={setExteriorType}
                    placeholder="Select Exterior Type"
                  />
                )}
                <DemoDropdown<StagingStyle>
                  label="Staging Style"
                  value={selectedStagingStyle}
                  options={stagingStyles}
                  onChange={setSelectedStagingStyle}
                  // placeholder={removeFurniture ? "Select Staging Style (optional)" : (areaType === 'exterior' ? '(Optional) Select Staging Style' : 'Select Staging Style (required)')}
                />
              </div>

              {/* Divider */}
              <div className="border-t border-slate-200 my-1" />

              {/* Prompt & Action with mode toggle */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">3. Refine</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${mode === 'generate' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setMode('generate')}
                  >
                    Generate New Image
                  </button>
                  <button
                    type="button"
                    className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${mode === 'restage' ? 'bg-indigo-600 text-white border-indigo-600 shadow' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'}`}
                    onClick={() => setMode('restage')}
                    disabled={!stagedImageUrls.length}
                  >
                    Restage Image
                  </button>
                </div>
                <input
                  type="text"
                  placeholder={mode === 'restage' ? "Enter prompt to restage (required)" : "e.g. kid friendly, bright colors (optional)"}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required={mode === 'restage'}
                  disabled={mode === 'restage' && !stagedImageUrls.length}
                />
                <label className="flex items-center gap-2 mt-2 select-none">
                  <input
                    type="checkbox"
                    // checked={removeFurniture}
                    // onChange={e => setRemoveFurniture(e.target.checked)}
                  />
                  <span className="text-xs text-slate-700">Remove all furniture (empty room)</span>
                </label>
                <Button
                  className="w-full text-xs font-bold mt-2"
                  onClick={async () => {
                    // Frontend validation for logged-in users
                    if (isLoggedIn && !selectedTeamId) {
                      setError('Please select a team to use credits from.');
                      return;
                    }
                    if (isLoggedIn && remainingCredits <= 0) {
                      setError('You have no remaining credits in the selected team.');
                      return;
                    }

                    if (mode === 'restage') {
                      let finalPrompt = prompt;
                      if (areaType === 'exterior' && !prompt) {
                        finalPrompt = 'clean the garbage, make grass cleaner and greener and keep layout and all same just make the outdoor look better';
                      }
                      if (areaType !== 'exterior' && !prompt) {
                        setError('Prompt is required for restaging.');
                        return;
                      }
                      if (!stagedIds || stagedIds.length === 0) {
                        setError('No staged image available for restaging.');
                        return;
                      }
                      let stagedIdToUse = stagedIds[selectedImageIdx];
                      // Fallback: if index is out of bounds, use first available
                      if (!stagedIdToUse) {
                        stagedIdToUse = stagedIds[0];
                        setSelectedImageIdx(0);
                      }
                      if (!stagedIdToUse) {
                        setError('No staged image available for restaging.');
                        return;
                      }
                      await handleRestageImage(
                        stagedIdToUse,
                        finalPrompt,
                        roomType,
                        areaType === "exterior" ? (exteriorType || "outdoor") : exteriorType,
                        areaType === 'exterior' ? undefined : selectedStagingStyle,
                        areaType,
                        // removeFurniture
                      );
                    } else {
                      let finalPrompt = prompt;
                      if (areaType === 'exterior' && !prompt) {
                        finalPrompt = 'clean the garbage, make grass cleaner and greener and keep layout and all same just make the outdoor look better';
                      }
                      await handleStageImage(
                        file,
                        roomType,
                        areaType === "exterior" ? (exteriorType || "outdoor") : exteriorType,
                        areaType === 'exterior' ? undefined : selectedStagingStyle,
                        finalPrompt,
                        areaType,
                        undefined, // removeFurniture
                        isLoggedIn ? selectedTeamId || undefined : undefined, // Pass teamId only if logged in
                        async () => {
                          // Refresh team credits after successful generation
                          if (isLoggedIn && refreshTeamCredits) {
                            await refreshTeamCredits();
                          }
                        }
                      );
                    }
                    if (limitReached) {
                      showError('Demo limit reached. Please sign up and continue to buying a plan for further image staging.');
                    }
                  }}
                  disabled={
                    loading ||
                    !file ||
                    // (!removeFurniture && areaType === "interior" && !roomType) ||
                    // (!removeFurniture && areaType !== 'exterior' && !selectedStagingStyle) ||
                    (mode === 'restage' && (!stagedImageUrls.length && areaType !== 'exterior' && !prompt))
                  }
                >
                  {loading || restageLoading ? (mode === 'restage' ? "Restaging..." : "Processing...") : (mode === 'restage' ? "Restage Image" : "Generate Image")}
                </Button>

                {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
              </div>
            </div>

            {/* Canvas - Before/After Slider */}
            <div
              ref={imageAreaRef}
              id="slider-container"
              className="border-t-4 border-blue-600 md:border-t-white lg:col-span-2 relative aspect-video bg-slate-100 overflow-hidden select-none min-h-80"
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
              {stagedImageUrls && stagedImageUrls.length > 0 ? (
                <>
                  <img
                    ref={stagedImgRef}
                    src={stagedImageUrls[selectedImageIdx]}
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
                  {/* Download icon overlay */}
                  <button
                    className="absolute top-4 right-4 z-20 bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 transition"
                    title="Open image in new tab"
                    onClick={() => {
                      const url = stagedImageUrls[selectedImageIdx];
                      if (!url) return;
                      window.open(url, '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <Download className="w-6 h-6 text-indigo-600" />
                  </button>
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
            </div>
          </div>
        </div>
      </section>
      {/* Thumbnails for alternate images */}
      {/* Always show 5 boxes for image generation, fill as images arrive */}
      <div className="max-w-2xl mx-auto mt-4 flex flex-row gap-2 justify-center">
        {[0, 1, 2, 3, 4].map((idx) => (
          <div key={idx} className="w-20 h-14 rounded border-2 flex items-center justify-center bg-slate-50 cursor-pointer transition-all"
            style={{ borderColor: selectedImageIdx === idx ? '#6366f1' : '#e5e7eb', boxShadow: selectedImageIdx === idx ? '0 0 0 2px #6366f1' : undefined, opacity: stagedImageUrls[idx] ? 1 : 0.7 }}
            onClick={() => stagedImageUrls[idx] && setSelectedImageIdx(idx)}
          >
            {stagedImageUrls[idx] ? (
              <img
                src={stagedImageUrls[idx]}
                alt={`Alternate ${idx + 1}`}
                className="w-full h-full object-cover rounded"
                style={{ pointerEvents: 'none' }}
              />
            ) : (
              <span className="text-xs text-slate-400">{loading ? '...' : ''}</span>
            )}
          </div>
        ))}
      </div>
    </>
  )
}