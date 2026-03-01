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
  ChevronDown,
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
import { CreditBalance } from "./CreditBalance";
import { ProjectSelectorModal } from "./ProjectSelectorModal";
import { SignUpBonusModal } from "./SignUpBonusModal";
import { getRecentUploads, normalizeImageUrl } from "@/services/image.service";
import Image from "next/image";


export default function Demo() {
  // Move selectedImageIdx state to Demo
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusOfferShownToday, setBonusOfferShownToday] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState(false);
  const hasShownDemoInfoRef = useRef(false);
  const hasInitializedLimitWatcherRef = useRef(false);
  const prevLimitReachedRef = useRef(false);
  // Toggle for generate vs restage
  const [mode, setMode] = useState<'generate' | 'restage'>('generate');
  const stagedImgRef = useRef<HTMLImageElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [areaType, setAreaType] = useState<"interior" | "exterior">("interior");
  const [roomType, setRoomType] = useState<RoomType | undefined>(undefined);
  const [exteriorType, setExteriorType] = useState<RoomType | undefined>(undefined);
  const [selectedStagingStyle, setSelectedStagingStyle] = useState<StagingStyle | undefined>(undefined);
  const [removeFurniture, setRemoveFurniture] = useState(false);
  const [showRemoveFurnitureInfo, setShowRemoveFurnitureInfo] = useState(false);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);

  // Team selection state - persist to localStorage
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [refreshTeamCredits, setRefreshTeamCredits] = useState<(() => Promise<void>) | null>(null);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dontShowConfirmationAgain, setDontShowConfirmationAgain] = useState(false);
  const [pendingGenerationAction, setPendingGenerationAction] = useState<(() => Promise<void>) | null>(null);

  // Project selection modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [defaultProject, setDefaultProject] = useState<{ projectId: string, projectName: string } | null>(null);
  // Ref to image area
  const imageAreaRef = useRef<HTMLDivElement | null>(null);
  const leftPanelRef = useRef<HTMLDivElement | null>(null);
  const [imageAreaHeight, setImageAreaHeight] = useState<number | undefined>(undefined);

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
    hasPurchasedCredits,
    demoCreditsRemaining,
    demoSessionReady,
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
    handleStageMultipleImages,
    handleRestageImage,
  } = useDemoApi({ selectedImageIdx, setSelectedImageIdx });

  const imagesToStageCount = selectedFiles.length > 0 ? selectedFiles.length : (file ? 1 : 0);
  const creditsToUseCount = imagesToStageCount;
  const isMultiImageMode = imagesToStageCount > 1;
  const totalStagedPhotos = Math.ceil(stagedImageUrls.length / 5); // 5 variations per photo
  const currentStagedImageUrl = normalizeImageUrl(
    stagedImageUrls[isMultiImageMode ? selectedPhotoIdx * 5 + selectedImageIdx : selectedImageIdx]
  );

  const shouldShowDemoNotice = authChecked && demoSessionReady && demoCreditsRemaining > 0 && (!isLoggedIn || isDemo || hasPurchasedCredits);

  // Show info toast when demo credits are relevant
  useEffect(() => {
    if (!shouldShowDemoNotice || hasShownDemoInfoRef.current) return;
    const demoScope = isLoggedIn ? "per account" : "per device";
    showInfo(
      `You have ${demoCreditsRemaining} of ${demoLimit} free demo credits left ${demoScope} this month.`
    );
    hasShownDemoInfoRef.current = true;
  }, [shouldShowDemoNotice, demoCreditsRemaining, demoLimit, isLoggedIn]);

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
    // Reset photo selection when new results arrive
    setSelectedPhotoIdx(0);
  }, [stagedImageUrls]);


  // Show error toast if blocked
  useEffect(() => {
    if (isBlocked) {
      showError('Demo access has been blocked for this device due to repeated use. Please sign up or contact support for help.');
    }
  }, [isBlocked]);

  useEffect(() => {
    if (!authChecked || !isLoggedIn) return;
    if (stagedImageUrls.length > 0) return;
    if (typeof window !== 'undefined' && !localStorage.getItem('elevate_pending_staging_recovery')) return;

    let cancelled = false;

    (async () => {
      try {
        const data = await getRecentUploads(20);
        if (!data.uploads?.length || cancelled) return;

        const seenKey = 'elevate_seen_recent_group_ids';
        const seenRaw = typeof window !== 'undefined' ? localStorage.getItem(seenKey) : null;
        const seenGroupIds: string[] = seenRaw ? JSON.parse(seenRaw) : [];

        const unseenGroup = data.uploads.find((upload: any) => {
          const groupId = upload.groupId || `${upload.original?.url}:${upload.createdAt}`;
          const hasVariants = Array.isArray(upload.stagedVariants) && upload.stagedVariants.length > 0;
          return hasVariants && !seenGroupIds.includes(groupId);
        });

        if (!unseenGroup || cancelled) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('elevate_pending_staging_recovery');
          }
          return;
        }

        const variantUrls = (unseenGroup.stagedVariants || [])
          .map((variant: any) => normalizeImageUrl(variant.url))
          .filter(Boolean);
        const variantIds = (unseenGroup.stagedVariants || []).map((variant: any) => variant.filename || variant.id).filter(Boolean);

        if (variantUrls.length === 0) return;

        setStagedImageUrls(variantUrls);
        setStagedIds(variantIds);
        setSelectedImageIdx(0);
        setSelectedPhotoIdx(0);

        const groupId = unseenGroup.groupId || `${unseenGroup.original?.url}:${unseenGroup.createdAt}`;
        if (typeof window !== 'undefined') {
          localStorage.setItem(seenKey, JSON.stringify([...seenGroupIds, groupId]));
          localStorage.removeItem('elevate_pending_staging_recovery');
        }

        showInfo('Recovered completed staging results from your previous session.');
      } catch (recoveryError) {
        console.error('Failed to recover recent staged results:', recoveryError);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isLoggedIn, stagedImageUrls.length, setStagedImageUrls, setStagedIds]);

  // Show bonus signup modal when demo limit reached
  useEffect(() => {
    if (!hasInitializedLimitWatcherRef.current) {
      hasInitializedLimitWatcherRef.current = true;
      prevLimitReachedRef.current = limitReached;
      return;
    }

    const justReachedLimit = !prevLimitReachedRef.current && limitReached;
    prevLimitReachedRef.current = limitReached;

    if (justReachedLimit && !bonusOfferShownToday && !isLoggedIn && demoCreditsRemaining === 0) {
      // Check if offer was already shown today
      const today = new Date().toDateString();
      const lastOfferDate = localStorage.getItem('demo_bonus_offer_date');

      if (lastOfferDate !== today) {
        setShowBonusModal(true);
        setBonusOfferShownToday(true);
        localStorage.setItem('demo_bonus_offer_date', today);
      }
    }
  }, [limitReached, bonusOfferShownToday, isLoggedIn, demoCreditsRemaining]);


  // Load default project preference
  useEffect(() => {
    if (typeof window !== 'undefined' && isLoggedIn) {
      const defaultKey = selectedTeamId ? `default_project_team_${selectedTeamId}` : 'default_project_personal';
      const stored = localStorage.getItem(defaultKey);
      if (stored) {
        try {
          setDefaultProject(JSON.parse(stored));
        } catch { }
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

      setAuthChecked(true);
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

  const runGenerate = useCallback(async (projectId?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('elevate_pending_staging_recovery', JSON.stringify({ startedAt: Date.now() }));
    }

    let finalPrompt = prompt;
    if (areaType === 'exterior' && !prompt) {
      finalPrompt = 'clean the garbage, make grass cleaner and greener and keep layout and all same just make the outdoor look better';
    }

    if (imagesToStageCount > 1) {
      if (!isLoggedIn) {
        setError('Multiple image staging requires login. Please sign up or log in first.');
        return;
      }

      const response = await handleStageMultipleImages(
        selectedFiles,
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
        projectId
      );

      if (response) {
        const creditsUsed = response.creditsUsed ?? imagesToStageCount;
        showInfo(`Started staging ${imagesToStageCount} images. ${creditsUsed} credits will be used.`);
      }
      setSelectedPhotoIdx(0);
      return;
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
      projectId
    );
  }, [
    prompt,
    areaType,
    imagesToStageCount,
    isLoggedIn,
    handleStageMultipleImages,
    selectedFiles,
    roomType,
    exteriorType,
    selectedStagingStyle,
    removeFurniture,
    selectedTeamId,
    refreshTeamCredits,
    handleStageImage,
    file,
    setError,
  ]);

  /**
   * Download image directly to device
   * Works across all browsers including Safari on mobile
   */
  const downloadImage = useCallback(async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Create anchor element for download
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `staged-image-${Date.now()}.png`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Cleanup
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch (error) {
      console.error('Download failed:', error);
      showError('Failed to download image. Please try again.');
    }
  }, []);

  const handleMove = useCallback((clientX: number) => {
    const rect = document
      .getElementById("slider-container")
      ?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percentage);
  }, []);

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  }, [handleMove]);

  const handleDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging((isDragging) => {
      if (!isDragging) return false;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      handleMove(clientX);
      return true;
    });
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
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

  useEffect(() => {
    const updateHeights = () => {
      if (imageAreaRef.current) {
        setImageAreaHeight(imageAreaRef.current.offsetHeight);
      }
    };

    updateHeights();
    window.addEventListener("resize", updateHeights);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && imageAreaRef.current) {
      observer = new ResizeObserver(() => updateHeights());
      observer.observe(imageAreaRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeights);
      if (observer) observer.disconnect();
    };
  }, [file, selectedFiles.length, stagedImageUrls.length, loading, restageLoading]);

  return (
    <>
      <ToastContainer closeButton={false} />
      <section id="try-it-free" className="pt-8 pb-12">
        {/* DEMO LIMIT ALERT */}
        {/* {shouldShowDemoNotice && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-yellow-50 text-yellow-900 text-sm font-semibold border border-yellow-200 shadow animate-slide-down">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span>
                You have <b>{demoCreditsRemaining} free demo credits</b> left {isLoggedIn ? "on this account" : "on this device"} this month.
              </span>
            </div>
          </div>
        )} */}
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

        {/* QUICK START FLOW */}
        <div className="max-w-5xl mx-auto mb-8 animate-fade-in">
          <h3 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold text-center mb-8">STEPS :</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-4">
            <div className="bg-white border border-indigo-100 rounded-xl px-4 py-3 min-w-44 text-center shadow-sm">
              <p className="text-xs font-semibold text-indigo-700">Step 1</p>
              <p className="text-sm font-bold text-slate-800">Upload Photo</p>
            </div>
            <svg
              className="hidden md:block w-14 h-10 opacity-80 rotate-155"
              viewBox="0 0 120 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Solid arrow line */}
              <path
                d="M10 20 C 40 60, 80 60, 100 30"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Arrow head */}
              <path
                d="M10 20 L30 20 M10 20 L10 40"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Dotted curve */}
              <path
                d="M60 30 C 80 10, 100 40, 90 70"
                stroke="black"
                strokeWidth="3"
                strokeDasharray="2 8"
                strokeLinecap="round"
              />
            </svg>
            <div className="bg-white border border-indigo-100 rounded-xl px-4 py-3 min-w-44 text-center shadow-sm">
              <p className="text-xs font-semibold text-indigo-700">Step 2</p>
              <p className="text-sm font-bold text-slate-800">Choose Area & Style</p>
            </div>
            <svg
              className="hidden md:block w-14 h-10 opacity-80 rotate-155"
              viewBox="0 0 120 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Solid arrow line */}
              <path
                d="M10 20 C 40 60, 80 60, 100 30"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Arrow head */}
              <path
                d="M10 20 L30 20 M10 20 L10 40"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Dotted curve */}
              <path
                d="M60 30 C 80 10, 100 40, 90 70"
                stroke="black"
                strokeWidth="3"
                strokeDasharray="2 8"
                strokeLinecap="round"
              />
            </svg>
            <div className="bg-white border border-indigo-100 rounded-xl px-4 py-3 min-w-44 text-center shadow-sm">
              <p className="text-xs font-semibold text-indigo-700">Step 3</p>
              <p className="text-sm font-bold text-slate-800">Generate / Restage</p>
            </div>
          </div>
        </div>

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
            {shouldShowDemoNotice && (
              <span className="text-xs font-mono text-indigo-200 ml-auto">
                Demo Used: {demoCount} / {demoLimit}
              </span>
            )}
          </div>

          <div className="grid lg:grid-cols-3 relative">
            {/* Controls */}
            <div
              ref={leftPanelRef}
              className="p-4 border-r border-slate-200 bg-linear-to-b from-slate-50 to-white flex flex-col gap-3 relative overflow-y-auto"
              style={imageAreaHeight ? { height: imageAreaHeight } : undefined}
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
              {shouldShowDemoNotice && (
                <div className="mb-1 bg-white rounded-xl shadow border border-slate-100 p-3">
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
              )}

              {/* Upload Section */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 mb-1 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">1. Upload Photo</span>
                </div>
                <span className="text-xs text-slate-500 mb-1">JPG/PNG, single or multiple images</span>
                <UploadArea limitReached={limitReached} setFile={setFile} setFiles={setSelectedFiles} setStagedImageUrls={setStagedImageUrls} setError={setError} />
              </div>

              {/* Team Credits Selector - Only show for logged-in users */}
              {isLoggedIn && (
                <details className="bg-white rounded-xl shadow border border-slate-100 p-3">
                  <summary className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer list-none">
                    <FolderOpen className="w-4 h-4 text-indigo-500" />
                    <span>Account & Team</span>
                    <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
                  </summary>
                  <div className="mt-3 flex flex-col gap-3">
                    <div className="flex flex-col gap-1">
                      <CreditBalance />
                    </div>
                    <div className="flex flex-col gap-1">
                      <TeamCreditsSelector
                        onTeamSelect={handleTeamSelect}
                        selectedTeamId={selectedTeamId}
                        disabled={loading || restageLoading}
                        onRefreshReady={handleRefreshReady}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-slate-700">Default Project</span>
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
                  </div>
                </details>
              )}

              {/* Area Type & Options */}
              <details className="bg-white rounded-xl shadow border border-slate-100 p-3">
                <summary className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer list-none">
                  <Settings className="w-5 h-5 text-indigo-500" />
                  <span>Step 2: Area & Style</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
                </summary>
                <div className="mt-3 flex flex-col gap-2">
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
              </details>

              {/* Prompt & Action with mode toggle */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Step 3: Refine & Generate</span>
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
                <textarea
                  placeholder={mode === 'restage' ? "Enter prompt to restage (required)" : "e.g. kid friendly, bright colors (optional)"}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  required={mode === 'restage'}
                  disabled={mode === 'restage' && !stagedImageUrls.length}
                  rows={2}
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
                  className="w-full text-sm font-bold mt-1 h-11"
                  onClick={async () => {
                    // Frontend validation for logged-in users with team selected
                    if (isLoggedIn && selectedTeamId && remainingCredits < creditsToUseCount) {
                      setError(`You need ${creditsToUseCount} team credits, but only ${remainingCredits} are available.`);
                      return;
                    }

                    // For new image generation, show confirmation if not disabled
                    if (mode === 'generate' && !dontShowConfirmationAgain) {
                      setPendingGenerationAction(() => async () => {
                        // If logged in, check for default project or show modal
                        if (isLoggedIn) {
                          // Check if default project exists
                          if (defaultProject && defaultProject.projectId) {
                            await runGenerate(defaultProject.projectId);
                          } else {
                            // No default, show modal
                            setShowProjectModal(true);
                          }
                        } else {
                          // Guest user - generate directly
                          await runGenerate(undefined);
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
                          await runGenerate(defaultProject.projectId);
                        } else {
                          // No default, show project modal first
                          setShowProjectModal(true);
                        }
                      } else {
                        // Guest user - execute directly
                        await runGenerate(undefined);
                      }
                    }
                    if (limitReached) {
                      showError('Demo limit reached. Please sign up and continue to buying a plan for further image staging.');
                    }
                  }}
                  disabled={
                    loading ||
                    imagesToStageCount === 0 ||
                    // (!removeFurniture && areaType === "interior" && !roomType) ||
                    // (!removeFurniture && areaType !== 'exterior' && !selectedStagingStyle) ||
                    (mode === 'restage' && (!stagedImageUrls.length && areaType !== 'exterior' && !prompt))
                  }
                >
                  {loading || restageLoading ? (mode === 'restage' ? "Restaging..." : "Processing...") : (mode === 'restage' ? "Restage Image" : `Generate & Use ${creditsToUseCount || 1} Credit${(creditsToUseCount || 1) > 1 ? 's' : ''}`)}
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
              {file ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="Empty room before staging"
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ zIndex: 1 }}
                />
              ) : (
                <Image
                  src="/unfurnished-room.png"
                  alt="Empty room before staging"
                  fill
                  className="object-cover"
                  priority
                  sizes="100vw"
                  style={{ zIndex: 1 }}
                />
              )}

              {/* AFTER Image (Staged) */}
              {stagedImageUrls && stagedImageUrls.length > 0 ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                      zIndex: 2,
                    }}
                  >
                    {currentStagedImageUrl ? (
                      <Image
                        ref={stagedImgRef}
                        src={currentStagedImageUrl}
                        alt="Staged living room"
                        fill
                        className="object-cover select-none pointer-events-none"
                        draggable={false}
                        onContextMenu={isDemo ? (e) => e.preventDefault() : undefined}
                        priority
                        sizes="100vw"
                        unoptimized
                        style={{ userSelect: 'none' }}
                      />
                    ) : null}
                  </div>
                  {/* Download + Fullscreen icons overlay */}
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                      className="bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 transition"
                      title="Download image"
                      onClick={() => {
                        const url = currentStagedImageUrl;
                        if (!url) return;
                        downloadImage(url);
                      }}
                    >
                      <Download className="w-6 h-6 text-indigo-600" />
                    </button>
                    <button
                      className="bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 transition"
                      title="View fullscreen"
                      onClick={() => {
                        const url = currentStagedImageUrl;
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
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                    zIndex: 2,
                  }}
                >
                  <Image
                    src="/furnished-room.png"
                    alt="Staged living room"
                    fill
                    className="object-cover select-none pointer-events-none"
                    draggable={false}
                    priority
                    sizes="100vw"
                    style={{
                      userSelect: 'none',
                    }}
                  />
                </div>
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
                  <p className="font-semibold text-indigo-900">
                    Generating {imagesToStageCount || 1} image{(imagesToStageCount || 1) > 1 ? 's' : ''} uses {creditsToUseCount || 1} credit{(creditsToUseCount || 1) > 1 ? 's' : ''}
                  </p>
                  <p className="text-indigo-800 mt-1">
                    You're staging {imagesToStageCount || 1} image{(imagesToStageCount || 1) > 1 ? 's' : ''} at once, so {creditsToUseCount || 1} credit{(creditsToUseCount || 1) > 1 ? 's' : ''} will be deducted.
                  </p>
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
                Generate & Use {creditsToUseCount || 1} Credit{(creditsToUseCount || 1) > 1 ? 's' : ''}
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

      <div className="max-w-2xl mx-auto mt-4 flex flex-col gap-4 px-4">
        {/* Photo Selector for Multi-Image */}
        {isMultiImageMode && totalStagedPhotos > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              Photo {selectedPhotoIdx + 1} of {totalStagedPhotos}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedPhotoIdx(Math.max(0, selectedPhotoIdx - 1))}
                disabled={selectedPhotoIdx === 0}
                className="px-3 py-1 rounded bg-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-300 transition text-xs font-semibold"
              >
                ← Prev
              </button>
              {/* Photo thumbnails */}
              <div className="flex gap-1">
                {Array.from({ length: totalStagedPhotos }).map((_, photoIdx) => {
                  const photoStartIdx = photoIdx * 5;
                  const photoUrls = stagedImageUrls.slice(photoStartIdx, photoStartIdx + 5);
                  return (
                    <button
                      key={photoIdx}
                      onClick={() => setSelectedPhotoIdx(photoIdx)}
                      className={`w-12 h-12 rounded border-2 transition overflow-hidden ${
                        selectedPhotoIdx === photoIdx
                          ? 'border-indigo-600 shadow-lg'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {photoUrls[0] && (
                        <img
                          src={photoUrls[0]}
                          alt={`Photo ${photoIdx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setSelectedPhotoIdx(Math.min(totalStagedPhotos - 1, selectedPhotoIdx + 1))}
                disabled={selectedPhotoIdx === totalStagedPhotos - 1}
                className="px-3 py-1 rounded bg-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-300 transition text-xs font-semibold"
              >
                Next →
              </button>
            </div>
          </div>
        )}

        {/* Version Selector (5 Versions) */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-700">
            {isMultiImageMode ? `Version ${selectedImageIdx + 1} for Photo ${selectedPhotoIdx + 1}` : `Version ${selectedImageIdx + 1}`}
          </div>
          <div className="flex flex-row gap-2 justify-center">
            {[0, 1, 2, 3, 4].map((idx) => {
              const imageIdx = isMultiImageMode ? selectedPhotoIdx * 5 + idx : idx;
              return (
                <div
                  key={idx}
                  className="relative w-20 h-14 rounded border-2 flex items-center justify-center bg-slate-50 cursor-pointer transition-all overflow-hidden"
                  style={{
                    borderColor: selectedImageIdx === idx ? '#6366f1' : '#e5e7eb',
                    boxShadow: selectedImageIdx === idx ? '0 0 0 2px #6366f1' : undefined,
                    opacity: stagedImageUrls[imageIdx] ? 1 : 0.7,
                  }}
                  onClick={() => stagedImageUrls[imageIdx] && setSelectedImageIdx(idx)}
                >
                  {stagedImageUrls[imageIdx] ? (
                    <Image
                      src={normalizeImageUrl(stagedImageUrls[imageIdx])}
                      alt={`Alternate ${idx + 1}`}
                      width={80}
                      height={56}
                      className="object-cover rounded"
                      unoptimized
                      style={{ pointerEvents: 'none' }}
                    />
                  ) : (
                    <span className="text-xs text-slate-400">{loading ? '...' : ''}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
            } catch { }
          }

          // Now execute the image generation with projectId
          await runGenerate(projectId || undefined);
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