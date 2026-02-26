// Remove Furniture toggle state
"use client";

import {
  UploadCloud,
  Monitor,
  Download,
  Share2,
  MoveHorizontal,
  Maximize2,
  Sparkles,
  Settings,
  Loader,
  X,
  FolderOpen,
  Trash2,
} from "lucide-react";

import React, { useState, useRef, useEffect } from "react";
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
import { CreditBalance } from "./CreditBalance";
import { ProjectSelectorModal } from "./ProjectSelectorModal";
import { SignUpBonusModal } from "./SignUpBonusModal";


export default function Demo() {
  // Move selectedImageIdx state to Demo
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusOfferShownToday, setBonusOfferShownToday] = useState(false);


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

  // Show bonus signup modal when demo limit reached
  useEffect(() => {
    if (limitReached && !bonusOfferShownToday) {
      // Check if offer was already shown today
      const today = new Date().toDateString();
      const lastOfferDate = localStorage.getItem('demo_bonus_offer_date');
      
      if (lastOfferDate !== today) {
        setShowBonusModal(true);
        setBonusOfferShownToday(true);
        localStorage.setItem('demo_bonus_offer_date', today);
      }
    }
  }, [limitReached, bonusOfferShownToday]);

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
  const [removeFurniture, setRemoveFurniture] = useState(false);
  const [showRemoveFurnitureInfo, setShowRemoveFurnitureInfo] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);

  // Team selection state - persist to localStorage
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [refreshTeamCredits, setRefreshTeamCredits] = useState<(() => Promise<void>) | null>(null);
  
  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dontShowConfirmationAgain, setDontShowConfirmationAgain] = useState(false);
  const [pendingGenerationAction, setPendingGenerationAction] = useState<(() => Promise<void>) | null>(null);
  
  // Project selection modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [defaultProject, setDefaultProject] = useState<{projectId: string, projectName: string} | null>(null);

  // Load default project preference
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const defaultKey = selectedTeamId ? `default_project_team_${selectedTeamId}` : 'default_project_personal';
      const stored = localStorage.getItem(defaultKey);
      if (stored) {
        try {
          setDefaultProject(JSON.parse(stored));
        } catch {}
      } else {
        setDefaultProject(null);
      }
    }
  }, [isLoggedIn, selectedTeamId]);

  // Check if user is logged in and load selected team from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      setIsLoggedIn(!!authRaw);
      
      // Load selected team from localStorage
      const savedTeamId = localStorage.getItem('elevate_selected_team_id');
      if (savedTeamId && savedTeamId !== 'null') {
        setSelectedTeamId(savedTeamId);
      }
      
      // Load confirmation preference
      const savedConfirmationPref = localStorage.getItem('elevate_hide_generation_confirmation');
      if (savedConfirmationPref === 'true') {
        setDontShowConfirmationAgain(true);
      }
    }
  }, []);

  const handleTeamSelect = (teamId: string | null, remaining: number) => {
    setSelectedTeamId(teamId);
    setRemainingCredits(remaining);
    
    // Persist selected team to localStorage
    if (typeof window !== 'undefined') {
      if (teamId) {
        localStorage.setItem('elevate_selected_team_id', teamId);
      } else {
        localStorage.removeItem('elevate_selected_team_id');
      }
    }
  };

  const handleRefreshReady = (refreshFn: () => Promise<void>) => {
    setRefreshTeamCredits(() => refreshFn);
  };

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
                  
                  {/* Personal Credit Balance */}
                  <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                    <CreditBalance />
                  </div>

                  <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                    <TeamCreditsSelector 
                      onTeamSelect={handleTeamSelect}
                      selectedTeamId={selectedTeamId}
                      disabled={loading || restageLoading}
                      onRefreshReady={handleRefreshReady}
                    />
                  </div>

                  {/* Default Project Manager */}
                  <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-1">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-indigo-500" />
                        <span className="text-sm font-bold text-slate-700">Default Project</span>
                      </div>
                    </div>
                    {defaultProject ? (
                      <div className="flex items-center justify-between p-2 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-indigo-900">{defaultProject.projectName}</p>
                          <p className="text-xs text-indigo-600">Images auto-link here</p>
                        </div>
                        <button
                          onClick={() => {
                            const defaultKey = selectedTeamId ? `default_project_team_${selectedTeamId}` : 'default_project_personal';
                            localStorage.removeItem(defaultKey);
                            setDefaultProject(null);
                          }}
                          className="ml-2 p-1 text-red-600 hover:bg-red-100 rounded transition"
                          title="Remove default"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <p className="text-xs text-slate-600">No default project set. You'll be prompted on each generation.</p>
                      </div>
                    )}
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
                    checked={removeFurniture}
                    onChange={(e) => {
                      const nextValue = e.target.checked;
                      setRemoveFurniture(nextValue);
                      if (nextValue) {
                        setShowRemoveFurnitureInfo(true);
                      }
                    }}
                  />
                  <span className="text-xs text-slate-700">Remove all furniture (empty room)</span>
                </label>
                <Button
                  className="w-full text-xs font-bold mt-2"
                  onClick={async () => {
                    // Frontend validation for logged-in users with team selected
                    if (isLoggedIn && selectedTeamId && remainingCredits <= 0) {
                      setError('You have no remaining credits in the selected team.');
                      return;
                    }

                    // For new image generation, show confirmation if not disabled
                    if (mode === 'generate' && !dontShowConfirmationAgain) {
                      setPendingGenerationAction(() => async () => {
                        // If logged in, check for default project or show modal
                        if (isLoggedIn) {
                          // Check if default project exists
                          if (defaultProject && defaultProject.projectId) {
                            // Use default project directly
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
                              removeFurniture,
                              (isLoggedIn && selectedTeamId) ? selectedTeamId : undefined,
                              async () => {
                                if (isLoggedIn && selectedTeamId && refreshTeamCredits) {
                                  await refreshTeamCredits();
                                }
                              },
                              defaultProject.projectId
                            );
                          } else {
                            // No default, show modal
                            setShowProjectModal(true);
                          }
                        } else {
                          // Guest user - generate directly
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
                            removeFurniture,
                            undefined,
                            undefined,
                            undefined
                          );
                        }
                      });
                      setShowConfirmation(true);
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
                        removeFurniture,
                      );
                    } else {
                      // Generate mode with confirmation disabled
                      if (isLoggedIn) {
                        // Check for default project
                        if (defaultProject && defaultProject.projectId) {
                          // Use default project directly
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
                            removeFurniture,
                            (isLoggedIn && selectedTeamId) ? selectedTeamId : undefined,
                            async () => {
                              if (isLoggedIn && selectedTeamId && refreshTeamCredits) {
                                await refreshTeamCredits();
                              }
                            },
                            defaultProject.projectId
                          );
                        } else {
                          // No default, show project modal first
                          setShowProjectModal(true);
                        }
                      } else {
                        // Guest user - execute directly
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
                          removeFurniture,
                          undefined,
                          undefined,
                          undefined
                        );
                      }
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

                {error && (
                  <div className="mt-2">
                    <p className="text-red-500 text-xs">{error}</p>
                    {error.toLowerCase().includes('insufficient') && (
                      <a 
                        href="/test#try-it-free" 
                        className="text-blue-600 text-xs font-semibold hover:underline mt-1 inline-block"
                      >
                        → Buy credits to continue
                      </a>
                    )}
                  </div>
                )}
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
                  {/* Download + Fullscreen icons overlay */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                      className="bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 transition"
                      title="Open image in new tab"
                      onClick={() => {
                        const url = stagedImageUrls[selectedImageIdx];
                        if (!url) return;
                        window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                    >
                      <Download className="w-6 h-6 text-indigo-600" />
                    </button>
                    <button
                      className="bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 transition"
                      title="View fullscreen"
                      onClick={() => {
                        const url = stagedImageUrls[selectedImageIdx];
                        if (!url) return;
                        setFullscreenImageUrl(url);
                      }}
                    >
                      <Maximize2 className="w-6 h-6 text-indigo-600" />
                    </button>
                  </div>
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
      
      {/* CONFIRMATION MODAL FOR NEW IMAGE GENERATION */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Generate New Image</h2>
            </div>
            
            <div className="space-y-3 mb-6 text-sm text-slate-700">
              <div className="flex items-start gap-3 p-3 bg-indigo-50 rounded-lg border border-indigo-200">
                <span className="text-lg">💳</span>
                <div>
                  <p className="font-semibold text-indigo-900">Generating a new image uses 1 credit</p>
                  <p className="text-indigo-800 mt-1">Each new staging will deduct from your available credits. Credits cost money when purchased.</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-lg">♻️</span>
                <div>
                  <p className="font-semibold text-green-900">Restaging is FREE</p>
                  <p className="text-green-800 mt-1">You can restage any generated image unlimited times without using credits.</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-6 p-3 bg-slate-100 rounded-lg">
              <input
                type="checkbox"
                id="dontShowAgain"
                checked={dontShowConfirmationAgain}
                onChange={(e) => {
                  setDontShowConfirmationAgain(e.target.checked);
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('elevate_hide_generation_confirmation', e.target.checked.toString());
                  }
                }}
                className="w-4 h-4 rounded border-slate-300 cursor-pointer"
              />
              <label htmlFor="dontShowAgain" className="text-sm text-slate-700 cursor-pointer flex-1">
                Don't show this again
              </label>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  setPendingGenerationAction(null);
                }}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setShowConfirmation(false);
                  if (pendingGenerationAction) {
                    await pendingGenerationAction();
                  }
                  setPendingGenerationAction(null);
                }}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Generate & Use Credit
              </button>
            </div>
          </div>
        </div>
      )}

      {showRemoveFurnitureInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Remove All Furniture</h2>
            </div>
            <p className="text-sm text-slate-700 mb-6">
              When enabled, the AI will remove all furniture from the room, leaving it empty. This can change lighting and shadows.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowRemoveFurnitureInfo(false)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {fullscreenImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <button
            className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20 transition"
            title="Close fullscreen"
            onClick={() => setFullscreenImageUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImageUrl}
            alt="Fullscreen staged"
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

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
        ))}      </div>

      {/* Project Selection Modal */}
      <ProjectSelectorModal
        open={showProjectModal}
        onOpenChange={setShowProjectModal}
        teamId={selectedTeamId}
        onSelectProject={async (projectId, projectName) => {
          setSelectedProjectId(projectId);
          setSelectedProjectName(projectName || null);
          setShowProjectModal(false);
          
          // Refresh default project state (user might have set new default)
          const defaultKey = selectedTeamId ? `default_project_team_${selectedTeamId}` : 'default_project_personal';
          const stored = localStorage.getItem(defaultKey);
          if (stored) {
            try {
              setDefaultProject(JSON.parse(stored));
            } catch {}
          }
          
          // Now execute the image generation with projectId
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
            removeFurniture,
            (isLoggedIn && selectedTeamId) ? selectedTeamId : undefined,
            async () => {
              if (isLoggedIn && selectedTeamId && refreshTeamCredits) {
                await refreshTeamCredits();
              }
            },
            projectId || undefined
          );
        }}
      />

      {/* Sign Up Bonus Modal */}
      <SignUpBonusModal
        open={showBonusModal}
        onOpenChange={setShowBonusModal}
      />
      
    </>
  )
}