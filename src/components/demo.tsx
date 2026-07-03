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
  File,
  Folder,
  Recycle,
} from "lucide-react";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useDemoApi } from "@/components/useDemoApi";
import { showInfo, showError } from './toastUtils';
import { DemoDropdown } from "./DemoDropdown";
import { UploadArea } from "./UploadArea";
import { RoomType, StagingStyle } from "@/lib/errors";
import { exteriorOptions, interiorOptions, stagingStyles } from "./data/dropdown";
import { DEFAULT_DEMO_STYLE } from "./data/demoStylePreview";
import { getDemoComparisonImageUrl, DEFAULT_DEMO_INTERIOR_TYPE } from "./data/demoImagePaths";
import { TeamCreditsSelector } from "./TeamCreditsSelector";
import { CreditBalance } from "./CreditBalance";
import { ProjectSelectorModal } from "./ProjectSelectorModal";
import { SignUpBonusModal } from "./SignUpBonusModal";
import { getRecentUploads, normalizeImageUrl } from "@/services/image.service";
import { getMyProjects } from "@/services/projects.service";
import { getPaymentSummary } from "@/services/payment.service";
import { getTeams, getTeamsByUserId, getTeamEligibility } from "@/services/teams.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { recordAiGenerationConsent } from "@/services/consent.service";
import { teamHasActiveSubscription, userHasActivePersonalSubscription, canUserCustomizeStyling } from "@/helpers/subscription.helpers";
import SupportModalTrigger from "@/components/support/SupportModalTrigger";
import BonusBanner from "@/components/BonusBanner";
import InfoHint from "@/components/ui/InfoHint";

const VARIANTS_PER_IMAGE = 3;
const MAX_BATCH_SIZE = 15;
const GENERATE_CONSENT_KEY = 'elevate_ai_generation_consent_acknowledged';
const PROJECT_SELECTOR_PLANS = new Set([
  'plan_pro',
  'plan_pro_annual',
  'plan_team',
  'plan_team_annual',
  'enterprise',
]);

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
  const imageDimensionsRef = useRef<Array<{ width: number; height: number }>>([]);
  // Toggle for generate vs restage
  const [mode, setMode] = useState<'generate' | 'restage'>('generate');
  const stagedImgRef = useRef<HTMLImageElement | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState("");
  const [areaType, setAreaType] = useState<"interior" | "exterior">("interior");
  const [roomType, setRoomType] = useState<RoomType | undefined>("living-room");
  const [exteriorType, setExteriorType] = useState<RoomType | undefined>("outdoor");
  const [selectedStagingStyle, setSelectedStagingStyle] = useState<StagingStyle | undefined>(DEFAULT_DEMO_STYLE);
  const [removeFurniture, setRemoveFurniture] = useState(false);
  const [showRemoveFurnitureInfo, setShowRemoveFurnitureInfo] = useState(false);
  const [resolutionInsight, setResolutionInsight] = useState<string | null>(null);
  const [recommendedResolution, setRecommendedResolution] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<Array<{ width: number; height: number }>>([]);
  const [fullscreenImageUrl, setFullscreenImageUrl] = useState<string | null>(null);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState<number>(0);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false); // Track overall batch status
  const [singleStageStartTs, setSingleStageStartTs] = useState<number | null>(null); // Per-image stage timer (all users)
  const SINGLE_STAGE_ESTIMATE_SEC = 35; // Approx wall-clock time for a single image generation

  // Multi-image custom styling state
  const [useCustomStyling, setUseCustomStyling] = useState(false);
  const [showCustomStylingModal, setShowCustomStylingModal] = useState(false);
  const [perImageSettings, setPerImageSettings] = useState<Array<{ roomType: RoomType | undefined; stagingStyle: StagingStyle | undefined; prompt?: string; areaType?: 'interior' | 'exterior' }>>([])

  // Team selection state - persist to localStorage
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);
  const [refreshTeamCredits, setRefreshTeamCredits] = useState<(() => Promise<void>) | null>(null);


  // Credit source selection
  const [creditSource, setCreditSource] = useState<'personal' | 'team'>('personal');
  const [personalBalance, setPersonalBalance] = useState<number>(0);
  const [personalCreditsRefreshTrigger, setPersonalCreditsRefreshTrigger] = useState<number>(0);

  // Confirmation modal state
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [dontShowConfirmationAgain, setDontShowConfirmationAgain] = useState(false);
  const [aiConsentAcknowledged, setAiConsentAcknowledged] = useState(false);
  const [aiConsentSaving, setAiConsentSaving] = useState(false);
  const [pendingGenerationAction, setPendingGenerationAction] = useState<(() => Promise<void>) | null>(null);

  // Project selection modal state
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedProjectName, setSelectedProjectName] = useState<string | null>(null);
  const [defaultProject, setDefaultProject] = useState<{ projectId: string, projectName: string } | null>(null);
  const [nowTs, setNowTs] = useState<number>(Date.now());
  const [planTier, setPlanTier] = useState<'free' | 'starter' | 'pro' | 'team' | 'enterprise'>('free');
  const [subscriptionStatusLoaded, setSubscriptionStatusLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Subscription eligibility state
  const [paymentSummary, setPaymentSummary] = useState<any | null>(null);
  const [teamsData, setTeamsData] = useState<any[] | null>(null);
  const [selectedTeamData, setSelectedTeamData] = useState<any | null>(null);
  const [teamEligibility, setTeamEligibility] = useState<any | null>(null);
  const [isEligibleToLink, setIsEligibleToLink] = useState<boolean>(false);
  const [ineligibilityReason, setIneligibilityReason] = useState<string | null>(null);

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
    stagedFreeClean,
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
    multiProgress,
    deviceId,
  } = useDemoApi({ selectedImageIdx, setSelectedImageIdx });

  const getCurrentUserIdFromStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      if (!authRaw) return null;
      const auth = JSON.parse(authRaw);
      return auth?.user?.id || null;
    } catch {
      return null;
    }
  };

  const getDefaultProjectStorageKey = (teamId: string | null, userId?: string | null) => {
    const baseKey = teamId ? `default_project_team_${teamId}` : 'default_project_personal';
    const resolvedUserId = userId ?? getCurrentUserIdFromStorage();
    return resolvedUserId ? `${baseKey}_user_${resolvedUserId}` : baseKey;
  };

  const imagesToStageCount = selectedFiles.length > 0 ? selectedFiles.length : (file ? 1 : 0);
  const creditsToUseCount = imagesToStageCount;
  const isMultiImageMode = imagesToStageCount > 1;
  const totalStagedPhotos = Math.ceil(stagedImageUrls.length / VARIANTS_PER_IMAGE);
  const loadedPhotoCount = (() => {
    const loaded = new Set<number>();
    stagedImageUrls.forEach((url: string, idx: number) => {
      if (url) {
        loaded.add(Math.floor(idx / VARIANTS_PER_IMAGE));
      }
    });
    return loaded.size;
  })();
  const currentBeforePreviewUrl = getDemoComparisonImageUrl({
    areaType,
    roomType,
    exteriorType,
    stagingStyle: selectedStagingStyle,
    before: true,
  });
  const currentAfterPreviewUrl = getDemoComparisonImageUrl({
    areaType,
    roomType,
    exteriorType,
    stagingStyle: selectedStagingStyle,
    before: false,
  });
  const expectedPhotoCount = isMultiImageMode ? imagesToStageCount : totalStagedPhotos;
  const hasGeneratedResults = stagedImageUrls.length > 0;

  // Watermark-free rules: Free for first 2 uploads (guests only).
  // Uses the per-photo flag captured from the backend at generation time,
  // NOT the live/global demoCount — demoCount keeps changing as later
  // photos complete, which would incorrectly retroactively mark earlier
  // (already-free) photos as watermarked once the total crossed 2.
  const currentResultIndex = isMultiImageMode
    ? selectedPhotoIdx * VARIANTS_PER_IMAGE + selectedImageIdx
    : selectedImageIdx;
  const isWatermarkFreeUpload =
    isDemo && !hasPurchasedCredits && (stagedFreeClean[currentResultIndex] ?? true);

  const currentGeneratedImageUrl = normalizeImageUrl(
    stagedImageUrls[currentResultIndex]
  );
  const currentDisplayImageUrl = hasGeneratedResults ? currentGeneratedImageUrl : currentAfterPreviewUrl;
  const maxMultiImages = 15;

  const previewImageUrls = useMemo(() => {
    return Array.from(
      new Set([
        currentBeforePreviewUrl,
        currentAfterPreviewUrl,
        currentDisplayImageUrl,
      ].filter((url): url is string => Boolean(url)))
    );
  }, [currentBeforePreviewUrl, currentAfterPreviewUrl, currentDisplayImageUrl]);

  const warmupPreviewUrls = useMemo(() => {
    const allRoomTypes = interiorOptions.map(o => o.value);
    return Array.from(
      new Set(
        allRoomTypes.flatMap((room) =>
          stagingStyles.map((style) =>
            getDemoComparisonImageUrl({
              areaType: "interior",
              roomType: room as RoomType,
              stagingStyle: style.value,
              before: false,
            })
          )
        )
      )
    );
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    previewImageUrls.forEach((url) => {
      const image = new window.Image();
      image.decoding = 'async';
      image.loading = 'eager';
      image.src = url;
    });
  }, [previewImageUrls]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const timer = window.setTimeout(() => {
      warmupPreviewUrls.forEach((url) => {
        const image = new window.Image();
        image.decoding = 'async';
        image.loading = 'eager';
        image.src = url;
      });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [warmupPreviewUrls]);

  const elapsedSeconds = multiProgress.startedAt
    ? Math.floor((nowTs - multiProgress.startedAt) / 1000)
    : 0;
  const singleElapsedSec = singleStageStartTs ? Math.floor((nowTs - singleStageStartTs) / 1000) : 0;
  const singleRemainingSec = Math.max(0, SINGLE_STAGE_ESTIMATE_SEC - singleElapsedSec);
  const progressPct = multiProgress.expectedTotalVariants > 0
    ? Math.min(100, Math.round((multiProgress.completedVariants / multiProgress.expectedTotalVariants) * 100))
    : 0;
  const estimatedRemainingSeconds = multiProgress.estimatedSeconds > 0
    ? Math.max(0, multiProgress.estimatedSeconds - elapsedSeconds + 30)
    : 0;

  const visiblePhotoStart = Math.max(
    0,
    Math.min(totalStagedPhotos - 5, selectedPhotoIdx - 2)
  );
  const visiblePhotoIndices = Array.from({ length: Math.max(0, Math.min(5, totalStagedPhotos)) }).map(
    (_, idx) => visiblePhotoStart + idx
  );
  const displayPersonalCredits = personalBalance + demoCreditsRemaining;
  const canCustomizePerImageStyles = canUserCustomizeStyling(creditSource, selectedTeamData, paymentSummary, teamEligibility);
  const openCustomStylingModal = () => setShowCustomStylingModal(true);
  const shouldShowProjectSelector = isEligibleToLink;

  const [uploadedPreviewUrls, setUploadedPreviewUrls] = useState<string[]>([]);

  useEffect(() => {
    const sourceFiles = selectedFiles.length > 0 ? selectedFiles : file ? [file] : [];
    if (sourceFiles.length === 0) {
      setUploadedPreviewUrls([]);
      return;
    }

    const objectUrls = sourceFiles.map((sourceFile) => URL.createObjectURL(sourceFile));
    setUploadedPreviewUrls(objectUrls);

    return () => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [file, selectedFiles]);

  const uploadedPreviewUrl =
    uploadedPreviewUrls[isMultiImageMode ? selectedPhotoIdx : 0] || uploadedPreviewUrls[0] || null;

  const leftPreviewImageUrl = uploadedPreviewUrl || currentBeforePreviewUrl;

  useEffect(() => {
    let cancelled = false;
    const computeEligibility = async () => {
      if (!isLoggedIn) {
        setIsEligibleToLink(false);
        setIneligibilityReason(null);
        return;
      }

      if (creditSource === 'team') {
        if (!selectedTeamId) {
          if (cancelled) return;
          setTeamEligibility(null);
          setIsEligibleToLink(false);
          setIneligibilityReason('Select a team to continue with team credits.');
          return;
        }

        try {
          const eligibility = await getTeamEligibility(selectedTeamId);
          if (cancelled) return;
          setTeamEligibility(eligibility);
          const eligible = Boolean(
            eligibility.teamHasActivePurchase ||
            eligibility.ownerHasActivePersonal ||
            eligibility.userHasActivePersonal ||
            eligibility.userHasProjectInTeam
          );
          setIsEligibleToLink(eligible);
          if (!eligible) {
            setIneligibilityReason('Saving staged images to projects is available on Pro plans and above. Upgrade to Pro to save and organize staged images into projects.');
          } else {
            const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
            let reason: string | null = null;

            if (eligibility.userHasActivePersonal && eligibility.userExpiry) {
              const now = new Date();
              if (new Date(eligibility.userExpiry) > now) {
                const dateStr = new Date(eligibility.userExpiry).toLocaleDateString();
                reason = `Your Pro subscription has been cancelled but you can still use project features until ${dateStr}.`;
              }
            } else if (eligibility.ownerHasActivePersonal && eligibility.ownerExpiry) {
              const now = new Date();
              if (new Date(eligibility.ownerExpiry) > now) {
                const dateStr = new Date(eligibility.ownerExpiry).toLocaleDateString();
                reason = `The team owner's Pro subscription has been cancelled but the team can still use project features until ${dateStr}.`;
              }
            }

            setIneligibilityReason(reason);
          }
        } catch (error: any) {
          if (cancelled) return;
          if (error?.status === 404 || error?.code === 'TEAM_NOT_FOUND') {
            setSelectedTeamId(null);
            setSelectedTeamData(null);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('elevate_selected_team_id');
            }
          }
          setTeamEligibility(null);
          setIsEligibleToLink(false);
          setIneligibilityReason('Select a team to continue with team credits.');
        }
      } else {
        const GRACE_PERIOD_MS = 30 * 24 * 60 * 60 * 1000;

        let userHasPersonal = false;
        let graceExpiryDate: Date | null = null;

        if (paymentSummary?.activeSubscriptions && paymentSummary.activeSubscriptions.length > 0) {
          const eligibleSubscription = paymentSummary.activeSubscriptions.find((s: any) => {
            const pkg = String(s.package || "").toLowerCase();
            return pkg === "plan_pro" || pkg === "plan_team" || pkg === "enterprise" || pkg.includes("pro") || pkg.includes("team");
          });

          if (eligibleSubscription) {
            const now = new Date();
            if (!eligibleSubscription.cancelledAt && eligibleSubscription.autoRenewEnabled) {
              userHasPersonal = true;
            } else if (eligibleSubscription.completedAt) {
              const graceExpiry = new Date(new Date(eligibleSubscription.completedAt).getTime() + GRACE_PERIOD_MS);
              if (now < graceExpiry) {
                userHasPersonal = true;
                graceExpiryDate = graceExpiry;
              }
            }
          }
        }

        setIsEligibleToLink(userHasPersonal);
        if (!userHasPersonal) {
          setIneligibilityReason('Saving staged images to projects is available on Pro plans and above. Upgrade to Pro to save and organize staged images into projects.');
        } else if (graceExpiryDate) {
          const dateStr = graceExpiryDate.toLocaleDateString();
          setIneligibilityReason(`Your Pro subscription has been cancelled but you can still use project features until ${dateStr}.`);
        } else {
          setIneligibilityReason(null);
        }
      }
    };

    void computeEligibility();
    return () => { cancelled = true; };
  }, [selectedTeamId, creditSource, paymentSummary, isLoggedIn]);

  useEffect(() => {
  }, [planTier]);

  useEffect(() => {
    setMounted(true);

    if (!multiProgress.active && !isBatchProcessing && !singleStageStartTs) return;
    const timer = window.setInterval(() => setNowTs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [multiProgress.active, isBatchProcessing, singleStageStartTs]);

  useEffect(() => {
    const isStaging = (loading || restageLoading) && !isMultiImageMode;
    if (isStaging && !singleStageStartTs) {
      setSingleStageStartTs(Date.now());
    } else if (!isStaging && singleStageStartTs) {
      setSingleStageStartTs(null);
    }
  }, [loading, restageLoading, isMultiImageMode, singleStageStartTs]);

  const prevStagingStyleRef = useRef<StagingStyle | undefined>(undefined);
  useEffect(() => {
    if (prevStagingStyleRef.current !== selectedStagingStyle) {
      prevStagingStyleRef.current = selectedStagingStyle;
      if (stagedImageUrls.length > 0) {
        setSelectedImageIdx(0);
      }
    }
  }, [selectedStagingStyle, stagedImageUrls.length]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setAiConsentAcknowledged(localStorage.getItem(GENERATE_CONSENT_KEY) === 'true');
  }, []);

  useEffect(() => {
    if (!teamsData || !selectedTeamId) {
      return;
    }

    const teamStillExists = teamsData.some((team) => team.id === selectedTeamId);
    if (teamStillExists) {
      return;
    }

    setSelectedTeamId(null);
    setSelectedTeamData(null);
    setTeamEligibility(null);
    setIsEligibleToLink(false);
    setIneligibilityReason('Select a team to continue with team credits.');

    if (typeof window !== 'undefined') {
      localStorage.removeItem('elevate_selected_team_id');
    }
  }, [selectedTeamId, teamsData]);

  useEffect(() => {
    let cancelled = false;

    const loadPlanTier = async () => {
      if (!authChecked) {
        return;
      }

      if (!isLoggedIn) {
        if (!cancelled) setPlanTier('free');
        if (!cancelled) setSubscriptionStatusLoaded(true);
        return;
      }

      try {
        const summary = await getPaymentSummary();
        if (cancelled) return;

        setPaymentSummary(summary);

        const activePackages = (summary.activeSubscriptions || []).map((subscription) => subscription.package.toLowerCase());

        const nextTier = activePackages.some((packageName) => packageName.includes('enterprise'))
          ? 'enterprise'
          : activePackages.some((packageName) => packageName.includes('team'))
            ? 'team'
            : activePackages.some((packageName) => packageName.includes('pro'))
              ? 'pro'
              : activePackages.some((packageName) => packageName.includes('starter'))
                ? 'starter'
                : 'free';

        setPlanTier(nextTier);

        try {
          const auth = getAuthFromStorage();
          const userId = auth?.user?.id;
          const [ownedTeamsResponse, memberTeamsResponse] = await Promise.all([
            getTeams(),
            userId ? getTeamsByUserId(userId) : Promise.resolve({ success: true, message: "", teams: [] }),
          ]);

          const mergedTeams = [...(ownedTeamsResponse.teams || []), ...(memberTeamsResponse.teams || [])];
          const uniqueTeams = mergedTeams.filter((team, index, self) => self.findIndex((candidate) => candidate.id === team.id) === index);
          if (!cancelled) {
            setTeamsData(uniqueTeams);
          }
        } catch (teamsError) {
        }
      } catch (error) {
        if (!cancelled) setPlanTier('free');
      } finally {
        if (!cancelled) setSubscriptionStatusLoaded(true);
      }
    };

    void loadPlanTier();

    return () => {
      cancelled = true;
    };
  }, [authChecked, isLoggedIn]);

  const handleAiConsentChange = (nextChecked: boolean) => {
    setAiConsentAcknowledged(nextChecked);
    if (!nextChecked && typeof window !== 'undefined') {
      localStorage.removeItem(GENERATE_CONSENT_KEY);
    }
  };

  const recordAiConsentIfNeeded = async () => {
    const auth = getAuthFromStorage();
    const payload = {
      name: auth?.user?.name || null,
      email: auth?.user?.email || null,
      deviceId: deviceId || null,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: typeof navigator !== 'undefined' ? navigator.language : undefined,
      acknowledgedAt: new Date().toISOString(),
    };

    await recordAiGenerationConsent(payload);
    if (typeof window !== 'undefined') {
      localStorage.setItem(GENERATE_CONSENT_KEY, 'true');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const getInsight = async () => {
      const files = selectedFiles.length > 0 ? selectedFiles : (file ? [file] : []);
      if (files.length === 0) {
        setResolutionInsight(null);
        return;
      }

      const dimensions = await Promise.all(
        files.map((imageFile) =>
          new Promise<{ width: number; height: number }>((resolve) => {
            const img = new window.Image();
            const objectUrl = URL.createObjectURL(imageFile);
            img.onload = () => {
              resolve({ width: img.naturalWidth || 0, height: img.naturalHeight || 0 });
              URL.revokeObjectURL(objectUrl);
            };
            img.onerror = () => {
              resolve({ width: 0, height: 0 });
              URL.revokeObjectURL(objectUrl);
            };
            img.src = objectUrl;
          })
        )
      );

      if (cancelled) return;

      const valid = dimensions.filter((item) => item.width > 0 && item.height > 0);
      if (valid.length === 0) {
        setResolutionInsight("Resolution check unavailable for selected image(s).");
        return;
      }

      const minPixels = Math.min(...valid.map((item) => item.width * item.height));
      const minItem = valid.reduce((prev, current) =>
        current.width * current.height < prev.width * prev.height ? current : prev
      );

      imageDimensionsRef.current = valid;
      setImageDimensions(valid);

      const allHighQuality = valid.every(item => item.width * item.height >= 1024 * 768);

      if (allHighQuality) {
        setResolutionInsight("Your uploaded images have good resolution.");
        setRecommendedResolution(null);
      } else {
        setResolutionInsight(`Some of your uploaded images are of low quality (${minItem.width}x${minItem.height}).`);
        const recommended = '1280x720';
        setRecommendedResolution(recommended);
      }
    };

    void getInsight();

    return () => {
      cancelled = true;
    };
  }, [file, selectedFiles]);

  const hasAnyActiveSubscription = Boolean(paymentSummary?.activeSubscriptions?.length) || teamHasActiveSubscription(selectedTeamData);
  const shouldEnforceDemoLimit = limitReached && creditSource === 'personal' && !selectedTeamId && !hasPurchasedCredits && !hasAnyActiveSubscription;
  const shouldRequireTeamSelectionForStaging = creditSource === 'team' && !selectedTeamId;
  const shouldShowDemoNotice = authChecked && demoSessionReady && demoCreditsRemaining > 0 && isDemo && !hasPurchasedCredits && !hasAnyActiveSubscription;

  useEffect(() => {
    if (!shouldShowDemoNotice || hasShownDemoInfoRef.current) return;
    const demoScope = isLoggedIn ? "per account" : "per device";
    showInfo(
      `You have ${demoCreditsRemaining} of ${demoLimit} free demo credits left ${demoScope} this month.`
    );
    hasShownDemoInfoRef.current = true;
  }, [shouldShowDemoNotice, demoCreditsRemaining, demoLimit, isLoggedIn]);

  const prevUrlsRef = useRef<string[]>([]);
  useEffect(() => {
    const justArrived = prevUrlsRef.current.length === 0 && stagedImageUrls.length > 0;
    const shrunk = prevUrlsRef.current.length > 1 && stagedImageUrls.length > 0 && stagedImageUrls.length < prevUrlsRef.current.length;
    if (justArrived || shrunk) {
      setSelectedImageIdx(0);
      setSliderPosition(50);
    }
    prevUrlsRef.current = stagedImageUrls;
    setSelectedPhotoIdx(0);
  }, [stagedImageUrls]);

  useEffect(() => {
    if (isBlocked) {
      showError('Demo access has been blocked for this device due to repeated use. Please sign up or contact support for help.');
    }
  }, [isBlocked]);

  useEffect(() => {
    if (!hasInitializedLimitWatcherRef.current) {
      hasInitializedLimitWatcherRef.current = true;
      prevLimitReachedRef.current = limitReached;
      return;
    }

    const justReachedLimit = !prevLimitReachedRef.current && limitReached;
    prevLimitReachedRef.current = limitReached;

    if (justReachedLimit && !bonusOfferShownToday && !isLoggedIn && demoCreditsRemaining === 0) {
      const today = new Date().toDateString();
      const lastOfferDate = localStorage.getItem('demo_bonus_offer_date');

      if (lastOfferDate !== today) {
        setShowBonusModal(true);
        setBonusOfferShownToday(true);
        localStorage.setItem('demo_bonus_offer_date', today);
      }
    }
  }, [limitReached, bonusOfferShownToday, isLoggedIn, demoCreditsRemaining]);

  useEffect(() => {
    let cancelled = false;

    const loadDefaultProject = async () => {
      if (typeof window === 'undefined' || !isLoggedIn) {
        if (!cancelled) setDefaultProject(null);
        return;
      }

      const userId = getCurrentUserIdFromStorage();
      const defaultKey = getDefaultProjectStorageKey(selectedTeamId, userId);
      const legacyKey = selectedTeamId ? `default_project_team_${selectedTeamId}` : 'default_project_personal';

      const stored = localStorage.getItem(defaultKey) || localStorage.getItem(legacyKey);
      if (!stored) {
        if (!cancelled) setDefaultProject(null);
        return;
      }

      let parsed: { projectId: string; projectName: string } | null = null;
      try {
        parsed = JSON.parse(stored);
      } catch {
        localStorage.removeItem(defaultKey);
        localStorage.removeItem(legacyKey);
        if (!cancelled) setDefaultProject(null);
        return;
      }

      if (!parsed?.projectId) {
        localStorage.removeItem(defaultKey);
        localStorage.removeItem(legacyKey);
        if (!cancelled) setDefaultProject(null);
        return;
      }

      try {
        const response = await getMyProjects();
        const allProjects = response?.projects || [];

        const hasAccess = allProjects.some((project: any) => {
          if (project?.id !== parsed?.projectId) return false;
          const projectTeamId = project?.team_id || project?.team?.id || null;
          if (selectedTeamId) {
            return projectTeamId === selectedTeamId;
          }
          return !projectTeamId;
        });

        if (!hasAccess) {
          localStorage.removeItem(defaultKey);
          localStorage.removeItem(legacyKey);
          if (!cancelled) setDefaultProject(null);
          return;
        }

        if (!localStorage.getItem(defaultKey)) {
          localStorage.setItem(defaultKey, JSON.stringify(parsed));
        }
        localStorage.removeItem(legacyKey);

        if (!cancelled) setDefaultProject(parsed);
      } catch {
        localStorage.removeItem(defaultKey);
        localStorage.removeItem(legacyKey);
        if (!cancelled) setDefaultProject(null);
      }
    };

    loadDefaultProject();

    return () => {
      cancelled = true;
    };
  }, [isLoggedIn, selectedTeamId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      setIsLoggedIn(!!authRaw);

      const savedTeamId = localStorage.getItem('elevate_selected_team_id');
      if (savedTeamId && savedTeamId !== 'null') {
        setSelectedTeamId(savedTeamId);
        setCreditSource('team');
      }

      const savedConfirmationPref = localStorage.getItem('elevate_hide_generation_confirmation');
      if (savedConfirmationPref === 'true') {
        setDontShowConfirmationAgain(true);
      }

      setAuthChecked(true);
    }
  }, []);

  useEffect(() => {
    if (selectedFiles.length > 1) {
      const perImageDefaultArea: 'interior' | 'exterior' = 'interior';
      const defaultRoomType = perImageDefaultArea === "interior" ? (roomType || "living-room") : (exteriorType || "outdoor");
      const defaultStagingStyle = perImageDefaultArea === "interior" ? selectedStagingStyle : undefined;
      setPerImageSettings(
        selectedFiles.map(() => ({
          roomType: defaultRoomType,
          stagingStyle: defaultStagingStyle,
          areaType: perImageDefaultArea,
        }))
      );
      setUseCustomStyling(false);
    }
  }, [selectedFiles, roomType, exteriorType, selectedStagingStyle, areaType]);

  const handleTeamSelect = (teamId: string | null, remaining: number) => {
    setSelectedTeamId(teamId);
    setRemainingCredits(remaining);

    if (teamId) {
      setCreditSource('team');
    }

    if (typeof window !== 'undefined') {
      if (teamId) {
        localStorage.setItem('elevate_selected_team_id', teamId);
      } else {
        localStorage.removeItem('elevate_selected_team_id');
      }
    }
  };

  const handleCreditSourceChange = (source: 'personal' | 'team') => {
    setCreditSource(source);
    if (source === 'personal') {
      setSelectedTeamId(null);
      setRemainingCredits(0);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('elevate_selected_team_id');
      }
    }
  };

  const handleRefreshReady = (refreshFn: () => Promise<void>) => {
    setRefreshTeamCredits(() => refreshFn);
  };

  const runGenerate = useCallback(async (projectId?: string) => {
    if (imagesToStageCount > maxMultiImages) {
      setError(`You can stage up to ${maxMultiImages} images at once. Please remove ${imagesToStageCount - maxMultiImages} image(s).`);
      return;
    }

    if (
      isLoggedIn &&
      creditSource === 'personal' &&
      personalBalance < creditsToUseCount &&
      !(isDemo && demoCreditsRemaining >= creditsToUseCount)
    ) {
      setError(`You need ${creditsToUseCount} personal credits, but only ${personalBalance} are available.`);
      return;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('elevate_pending_staging_recovery', JSON.stringify({ startedAt: Date.now() }));
    }

    setStagedImageUrls([]);
    setStagedIds([]);
    setSelectedImageIdx(0);
    setSelectedPhotoIdx(0);

    let finalPrompt = prompt;
    if (areaType === 'exterior' && !prompt) {
      finalPrompt = 'clean the garbage, make grass cleaner and greener and keep layout and all same just make the outdoor look better';
    }

    if (imagesToStageCount > 1) {
      setIsBatchProcessing(true);
      try {
        const totalBatches = Math.ceil(selectedFiles.length / MAX_BATCH_SIZE);
        let totalCreditsUsed = 0;
        const resolvedCreditSource = selectedTeamId ? 'team' : creditSource;

        for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
          const batchStart = batchIndex * MAX_BATCH_SIZE;
          const batchFiles = selectedFiles.slice(batchStart, batchStart + MAX_BATCH_SIZE);
          const batchRoomTypes = useCustomStyling ? perImageSettings.slice(batchStart, batchStart + MAX_BATCH_SIZE).map(s => s.roomType) : undefined;
          const batchStyles = useCustomStyling ? perImageSettings.slice(batchStart, batchStart + MAX_BATCH_SIZE).map(s => s.stagingStyle) : undefined;
          const batchAreaTypes = useCustomStyling ? perImageSettings.slice(batchStart, batchStart + MAX_BATCH_SIZE).map(s => s.areaType) : undefined;
          const batchPrompts = useCustomStyling ? perImageSettings.slice(batchStart, batchStart + MAX_BATCH_SIZE).map(s => s.prompt) : undefined;

          showInfo(`Processing batch ${batchIndex + 1}/${totalBatches} (${batchFiles.length} images)`);

          const response = await handleStageMultipleImages(
            batchFiles,
            roomType,
            areaType === "exterior" ? (exteriorType || "outdoor") : exteriorType,
            areaType === 'exterior' ? undefined : selectedStagingStyle,
            finalPrompt,
            areaType,
            removeFurniture,
            (isLoggedIn && selectedTeamId) ? selectedTeamId : undefined,
            resolvedCreditSource,
            async () => {
              if (isLoggedIn && selectedTeamId && refreshTeamCredits) {
                await refreshTeamCredits();
              } else if (isLoggedIn && resolvedCreditSource === 'personal') {
                setPersonalCreditsRefreshTrigger((prev) => prev + 1);
              }
            },
            projectId,
            batchRoomTypes,
            batchStyles,
            batchAreaTypes,
            batchPrompts,
            batchIndex > 0,
            batchStart
          );

          totalCreditsUsed += response?.creditsUsed ?? batchFiles.length;
        }

        showInfo(`All batches completed. Total credits used: ${totalCreditsUsed}`);
        setSelectedPhotoIdx(0);
      } finally {
        setIsBatchProcessing(false);
      }
      return;
    }

    const singleResolvedCreditSource = selectedTeamId ? 'team' : creditSource;
    await handleStageImage(
      file,
      roomType,
      areaType === "exterior" ? (exteriorType || "outdoor") : exteriorType,
      areaType === 'exterior' ? undefined : selectedStagingStyle,
      finalPrompt,
      areaType,
      removeFurniture,
      (isLoggedIn && selectedTeamId) ? selectedTeamId : undefined,
      singleResolvedCreditSource,
      async () => {
        if (isLoggedIn && selectedTeamId && refreshTeamCredits) {
          await refreshTeamCredits();
        } else if (isLoggedIn && singleResolvedCreditSource === 'personal') {
          setPersonalCreditsRefreshTrigger((prev) => prev + 1);
        }
      },
      projectId
    );
  }, [
    prompt,
    areaType,
    imagesToStageCount,
    maxMultiImages,
    isLoggedIn,
    handleStageMultipleImages,
    selectedFiles,
    roomType,
    exteriorType,
    selectedStagingStyle,
    removeFurniture,
    selectedTeamId,
    creditSource,
    personalBalance,
    refreshTeamCredits,
    handleStageImage,
    file,
    setStagedImageUrls,
    setStagedIds,
    setError,
  ]);

  const startGeneration = useCallback(async () => {
    if (isLoggedIn && !subscriptionStatusLoaded) {
      showInfo('Checking your plan status. Please try again in a moment.');
      return;
    }

    if (!shouldShowProjectSelector) {
      await runGenerate(undefined);
      return;
    }

    if (defaultProject && defaultProject.projectId) {
      await runGenerate(defaultProject.projectId);
      return;
    }

    setShowProjectModal(true);
  }, [defaultProject, isLoggedIn, runGenerate, shouldShowProjectSelector, subscriptionStatusLoaded]);

  const downloadImage = useCallback(async (imageUrl: string) => {
    try {
      const response = await fetch(imageUrl, {
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) throw new Error('Failed to fetch image');

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `staged-image-${Date.now()}.png`;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    } catch (error) {
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

  const handleDrag = useCallback((e: any) => {
    if ("touches" in e) e.preventDefault();
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
      window.addEventListener("touchmove", handleDrag as any, { passive: false });
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

  useEffect(() => {
    if (selectedTeamId && teamsData) {
      const team = teamsData.find(t => t.id === selectedTeamId);
      setSelectedTeamData(team || null);
    } else {
      setSelectedTeamData(null);
    }
  }, [selectedTeamId, teamsData]);

  return (
    <>
      <section id="try-it-free" className="pt-8 pb-12">
        {isBlocked && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 text-red-900 text-sm font-semibold border border-red-200 shadow animate-slide-down">
              <span>🚫</span>
              <span>
                Demo access has been <b>blocked</b> due to repeated use. Please <a href="/sign-up" className="underline text-red-700">sign up</a> or <SupportModalTrigger className="underline text-red-700 inline">contact support</SupportModalTrigger> for help.
              </span>
            </div>
          </div>
        )}
        {isRepeatDemoUser && !isBlocked && (
          <div className="max-w-2xl mx-auto mb-6 animate-fade-in">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 text-blue-900 text-sm font-semibold border border-blue-200 shadow animate-slide-down">
              <span>💬</span>
              <span>
                Hey, we noticed you've visited a few times but haven't signed up yet. Is there anything holding you back? <SupportModalTrigger className="underline text-blue-700 inline">Chat with us</SupportModalTrigger> or <a href="/feedback" className="underline text-blue-700">share feedback</a>!
              </span>
            </div>
          </div>
        )}

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
              <path
                d="M10 20 C 40 60, 80 60, 100 30"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M10 20 L30 20 M10 20 L10 40"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />
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
              <path
                d="M10 20 C 40 60, 80 60, 100 30"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <path
                d="M10 20 L30 20 M10 20 L10 40"
                stroke="black"
                strokeWidth="3"
                strokeLinecap="round"
              />
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
            AI Staging, Virtual Renovation &amp; Furnishing for modern real estate.
          </p>
        </div>

        <div className="mt-8 max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in delay-500">
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center px-6">
            <span className="font-bold flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span id="workspace-title">Instant AI Staging</span>
            </span>
          </div>

          <div className="grid lg:grid-cols-3 relative">
            <div
              ref={leftPanelRef}
              className="p-4 border-r border-slate-200 bg-linear-to-b from-slate-50 to-white flex flex-col gap-3 relative overflow-y-auto"
              style={imageAreaHeight ? { height: imageAreaHeight } : undefined}
            >
              {(file || (stagedImageUrls && stagedImageUrls.length > 0)) && (
                <div className="flex lg:hidden w-full justify-center mt-2 animate-bounce" aria-hidden="true">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="feather feather-arrow-down">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <polyline points="19 12 12 19 5 12"></polyline>
                  </svg>
                </div>
              )}
              <span className="text-md font-medium text-indigo-700 ">
                *Each staging provides 3 different variants
              </span>
              <span className="text-xs text-slate-600">
                Your staging quality is based on the resolution of the image you upload.
              </span>
              {resolutionInsight && (
                <div>
                  <span className="text-xs text-indigo-700 font-medium">{resolutionInsight}</span>
                  {recommendedResolution && (
                    <div className="mt-1 space-y-1 text-xs text-slate-600">
                      <div>
                        Recommended resolution: <span className="font-semibold">{recommendedResolution}</span>. To fix, upload a higher-resolution image or choose a different photo.
                      </div>
                      <button
                        type="button"
                        onClick={openCustomStylingModal}
                        className="text-left font-semibold text-indigo-600 underline decoration-indigo-300 underline-offset-2 hover:text-indigo-700"
                      >
                        These are marked in the image modal.
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Section */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 mb-1 flex flex-col gap-1">
                <div className="flex items-center gap-2 mb-1">
                  <UploadCloud className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">1. Upload Photo</span>
                </div>
                <span className="text-xs text-slate-500 mb-1">JPG/PNG, single or multiple images</span>
                <UploadArea
                  limitReached={shouldEnforceDemoLimit}
                  setFile={setFile}
                  setFiles={setSelectedFiles}
                  setStagedImageUrls={setStagedImageUrls}
                  setError={setError}
                  forceSameStyleForAll={!canCustomizePerImageStyles}
                  perImageSettings={perImageSettings}
                  setPerImageSettings={setPerImageSettings}
                  areaType={areaType}
                  enableCustomStyling={useCustomStyling}
                  onEnableCustomStylingChange={setUseCustomStyling}
                  onApplyCustom={() => setUseCustomStyling(true)}
                  onCustomStylingChange={setUseCustomStyling}
                  imageDimensions={imageDimensions}
                  imageDimensionsRef={imageDimensionsRef}
                  customStylingModalOpen={showCustomStylingModal}
                  onCustomStylingModalChange={setShowCustomStylingModal}
                />
                {imagesToStageCount > maxMultiImages && (
                  <p className="text-xs text-red-600 font-semibold">Maximum {maxMultiImages} images allowed per batch.</p>
                )}
              </div>

              {/* Credits & Project */}
              <details open className="bg-white rounded-xl shadow border border-slate-100 p-3">
                <summary className="flex items-center gap-2 text-sm font-bold text-slate-700 cursor-pointer list-none">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  <span>Credits & Project</span>
                  <ChevronDown className="w-4 h-4 text-slate-500 ml-auto" />
                </summary>
                <div className="mt-3 flex flex-col gap-3">
                  {isLoggedIn ? (
                    <>
                      <div className="flex flex-col gap-2">
                        <label className="text-xs font-semibold text-slate-600 mb-1">Credit Source</label>

                        <label className={`flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-100 ${creditSource === 'personal' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="creditSource"
                              value="personal"
                              checked={creditSource === 'personal'}
                              onChange={() => handleCreditSourceChange('personal')}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Personal Credits</span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold text-indigo-600">{displayPersonalCredits}</span>
                            {demoCreditsRemaining > 0 && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                Free demo credits included
                                <InfoHint
                                  text="If you still have unused demo credits when you purchase any paid plan, those unused demo credits are converted into real credits and added to your wallet automatically."
                                  iconClassName="text-indigo-500 h-3.5 w-3.5"
                                />
                              </p>
                            )}
                          </div>
                        </label>

                        <label className={`flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border-2 cursor-pointer transition-all hover:bg-slate-100 ${creditSource === 'team' ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`}>
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="creditSource"
                              value="team"
                              checked={creditSource === 'team'}
                              onChange={() => handleCreditSourceChange('team')}
                              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="text-sm font-medium text-slate-700">Team Credits</span>
                          </div>
                        </label>

                        {creditSource === 'team' && (
                          <div className="pl-6 pt-1">
                            <TeamCreditsSelector
                              onTeamSelect={handleTeamSelect}
                              selectedTeamId={selectedTeamId}
                              disabled={loading || restageLoading}
                              onRefreshReady={handleRefreshReady}
                            />
                          </div>
                        )}

                        <div className="hidden">
                          <CreditBalance
                            onBalanceChange={setPersonalBalance}
                            refreshTrigger={personalCreditsRefreshTrigger}
                          />
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600">Default Project</span>
                          {defaultProject && (
                            <button
                              onClick={() => {
                                const defaultKey = getDefaultProjectStorageKey(selectedTeamId);
                                const legacyKey = selectedTeamId ? `default_project_team_${selectedTeamId}` : 'default_project_personal';
                                localStorage.removeItem(defaultKey);
                                localStorage.removeItem(legacyKey);
                                setDefaultProject(null);
                              }}
                              className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                              title="Remove default"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {defaultProject ? (
                          <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-300 rounded-lg">
                            <FolderOpen className="w-4 h-4 text-green-600" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-green-900 truncate">{defaultProject.projectName}</p>
                              <p className="text-xs text-green-600">Auto-linked ✓</p>
                            </div>
                          </div>
                        ) : ineligibilityReason ? null : (
                          <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg">
                            <p className="text-xs text-amber-700">You’ll be prompted to create a project when you click Generate.</p>
                          </div>
                        )}

                        {creditSource !== 'team' && !hasAnyActiveSubscription && (
                          <div className="mt-2 rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-3">
                            <div className="flex items-start gap-2">
                              <Sparkles className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-indigo-900">Unlock full staging power</p>
                                <p className="mt-1 text-xs text-indigo-800 leading-relaxed">
                                  Pick a plan pro or up to remove watermarks, get higher-quality renders, save unlimited projects, and stage at full resolution.
                                </p>
                                <a
                                  href="#pricing"
                                  onClick={(event) => {
                                    const pricingSection = typeof document !== 'undefined' ? document.getElementById('pricing') : null;
                                    if (pricingSection) {
                                      event.preventDefault();
                                      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                    }
                                  }}
                                  className="mt-2 inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
                                >
                                  See plans →
                                </a>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <p className="text-sm font-semibold text-indigo-900">Guest Demo Credits</p>
                        </div>
                        <p className="mt-1 text-sm text-indigo-800">
                          You have <b>{mounted ? demoCreditsRemaining : '—'} free demo credits</b> left on this device this month.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-600">Project</span>
                        </div>
                        <div className="p-2.5 bg-amber-50 border border-amber-300 rounded-lg">
                          <p className="text-xs text-amber-700">Sign up or log in to save and reuse projects across sessions.</p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </details>

              {/* Area Type & Options */}
              {!isMultiImageMode && (
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
                        onClick={() => {
                          setAreaType("interior");
                          setRoomType("living-room");
                        }}
                      >
                        Interior
                      </button>
                      <button
                        type="button"
                        className={`flex-1 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-150 ${areaType === "exterior"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow"
                          : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                          }`}
                        onClick={() => {
                          setAreaType("exterior");
                          setExteriorType("outdoor");
                        }}
                      >
                        Exterior
                      </button>
                    </div>

                    {isMultiImageMode && (
                      <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useCustomStyling}
                            onChange={(e) => setUseCustomStyling(e.target.checked)}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-md font-semibold text-slate-700">
                            Customize styling for each image
                          </span>
                        </label>
                        {useCustomStyling && (
                          <button
                            type="button"
                            onClick={openCustomStylingModal}
                            className="w-full px-3 py-2 text-md font-semibold text-indigo-600 border border-indigo-300 rounded-lg hover:bg-indigo-50 transition-all"
                          >
                            View All & Customize
                          </button>
                        )}
                      </div>
                    )}

                    {areaType === "interior" && (
                      <DemoDropdown<RoomType>
                        label="Interior Type"
                        value={roomType}
                        options={interiorOptions}
                        onChange={setRoomType}
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
                    {areaType === "interior" && (
                      <DemoDropdown<StagingStyle>
                        label="Staging Style"
                        value={selectedStagingStyle}
                        options={stagingStyles}
                        onChange={setSelectedStagingStyle}
                      />
                    )}
                  </div>
                </details>
              )}

              {isMultiImageMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-900 flex items-center gap-2">
                  <span className="flex-1">Manage image styles from the</span>
                  <button
                    type="button"
                    onClick={() => setShowCustomStylingModal(true)}
                    className="font-semibold text-amber-700 hover:text-amber-900 underline hover:no-underline"
                  >
                    modal
                  </button>
                </div>
              )}

              {/* Prompt & Action with mode toggle */}
              <div className="bg-white rounded-xl shadow border border-slate-100 p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-indigo-500" />
                  <span className="text-sm font-bold text-slate-700">Step 3: Refine & Generate</span>
                  <InfoHint
                    text="Single image staging may take up to 40-45 seconds on average."
                    className="inline-flex"
                    iconClassName="text-indigo-500 h-4 w-4"
                  />
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
                <div className="mb-2 flex items-center justify-start">
                  <label className="text-sm font-medium text-slate-700">Prompt</label>
                  <InfoHint
                    text="Custom prompts are applied very literally. To get the best results, keep your prompt short and focused, but make sure it includes all essential instructions. The AI will primarily follow the changes you specify, so avoid long or repetitive prompts."
                    className="inline-flex"
                    iconClassName="text-indigo-500 h-4 w-4 ml-4"
                    position="right"
                  />
                </div>

                <textarea
                  placeholder={mode === 'restage' ? "Enter prompt to restage (required)" : "e.g. kid friendly, bright colors (optional)"}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  maxLength={100}
                  required={mode === 'restage'}
                  disabled={mode === 'restage' && !stagedImageUrls.length}
                  rows={2}
                />
                <div className="text-xs text-slate-400 mt-1 text-right">{(prompt || '').length} / 100</div>
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
                    if (shouldRequireTeamSelectionForStaging) {
                      setError('Please select a team before staging with team credits.');
                      return;
                    }

                    if (
                      isLoggedIn &&
                      creditSource === 'personal' &&
                      personalBalance < creditsToUseCount &&
                      !(isDemo && demoCreditsRemaining >= creditsToUseCount)
                    ) {
                      setError(`You need ${creditsToUseCount} personal credits, but only ${personalBalance} are available.`);
                      return;
                    }

                    if (isLoggedIn && selectedTeamId && remainingCredits < creditsToUseCount) {
                      setError(`You need ${creditsToUseCount} team credits, but only ${remainingCredits} are available.`);
                      return;
                    }

                    if (mode === 'generate' && !dontShowConfirmationAgain) {
                      setPendingGenerationAction(() => startGeneration);
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
                      if (!stagedIdToUse) {
                        stagedIdToUse = stagedIds[0];
                        setSelectedImageIdx(0);
                      }
                      if (!stagedIdToUse) {
                        setError('No staged image available for restaging.');
                        return;
                      }
                      const restageSucceeded = await handleRestageImage(
                        stagedIdToUse,
                        finalPrompt,
                        roomType,
                        areaType === "exterior" ? (exteriorType || "outdoor") : exteriorType,
                        areaType === 'exterior' ? undefined : selectedStagingStyle,
                        areaType,
                        removeFurniture,
                      );
                      if (restageSucceeded) {
                        setPrompt('');
                      }
                    } else {
                      await startGeneration();
                    }
                    if (shouldEnforceDemoLimit) {
                      showError('Demo limit reached. Please sign up and continue to buying a plan for further image staging.');
                    }
                  }}
                  disabled={
                    loading ||
                    imagesToStageCount === 0 ||
                    imagesToStageCount > maxMultiImages ||
                    shouldRequireTeamSelectionForStaging ||
                    (isLoggedIn && creditSource === 'personal' && !isDemo && personalBalance < creditsToUseCount) ||
                    shouldEnforceDemoLimit ||
                    (mode === 'restage' && (!stagedImageUrls.length && areaType !== 'exterior' && !prompt))
                  }
                >
                  {loading || restageLoading ? (mode === 'restage' ? "Restaging..." : "Processing...") : (mode === 'restage' ? "Restage Image" : `Generate & Use ${creditsToUseCount || 1} Credit${(creditsToUseCount || 1) > 1 ? 's' : ''}`)}
                </Button>
                {isDemo && !isLoggedIn && (
                  <BonusBanner position="bottom" afterUpload={true} />
                )}
                {singleStageStartTs && !isMultiImageMode && (
                  <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
                    <p className="text-xs font-semibold text-indigo-800">
                      {mode === 'restage' ? 'Restaging your image…' : 'Staging your image…'}
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      Estimated time: ~{SINGLE_STAGE_ESTIMATE_SEC}s (remaining {singleRemainingSec}s, elapsed {singleElapsedSec}s)
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      Please keep this page open while staging runs.
                    </p>
                  </div>
                )}

                {(multiProgress.active || isBatchProcessing) && imagesToStageCount > 1 && (
                  <div className="mt-3 p-3 rounded-lg border border-indigo-200 bg-indigo-50">
                    <p className="text-xs font-semibold text-indigo-800">
                      Processing {multiProgress.totalImages} images ({multiProgress.completedVariants}/{multiProgress.expectedTotalVariants} variants {isBatchProcessing && !multiProgress.active ? '- preparing next batch...' : ''})
                    </p>
                    <div className="w-full h-2 bg-indigo-100 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-2 bg-indigo-600 transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-indigo-700 mt-2">
                      Estimated remaining time: {estimatedRemainingSeconds}s (elapsed {elapsedSeconds}s)
                    </p>
                    <p className="text-[11px] text-indigo-700 mt-1">
                      Please keep this page open while staging runs. Closing the page may impact overall processing performance.
                    </p>
                  </div>
                )}

                {!multiProgress.active && multiProgress.failedOrMissing > 0 && (
                  <p className="text-xs text-amber-700 mt-2">
                    {multiProgress.failedOrMissing} variant(s) failed in this batch. You can re-run staging for those photos.
                  </p>
                )}

                {error && (
                  <div className="mt-2">
                    <p className="text-red-500 text-xs">{error}</p>
                    {error.toLowerCase().includes('insufficient') && (
                      <a
                        href="/#try-it-free"
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
              <img
                src={leftPreviewImageUrl}
                alt={uploadedPreviewUrl ? "Uploaded room preview" : "Empty room before staging"}
                className="absolute inset-0 h-full w-full object-cover"
                loading="eager"
                decoding="async"
                draggable={false}
                style={{ zIndex: 1 }}
              />

              {currentDisplayImageUrl ? (
                <>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      clipPath: `inset(0 0 0 ${sliderPosition}%)`,
                      zIndex: 2,
                    }}
                  >
                    <img
                      ref={stagedImgRef}
                      src={hasGeneratedResults ? currentGeneratedImageUrl : currentAfterPreviewUrl}
                      alt="Staged living room"
                      className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                      draggable={false}
                      onContextMenu={isDemo && !isWatermarkFreeUpload ? (e) => e.preventDefault() : undefined}
                      loading="eager"
                      decoding="async"
                      style={{ userSelect: 'none' }}
                    />
                  </div>
                  <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
                    <button
                      className="bg-white bg-opacity-80 rounded-full p-2 shadow hover:bg-opacity-100 transition"
                      title="Download image"
                      onClick={() => {
                        const url = currentDisplayImageUrl;
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
                        const url = currentDisplayImageUrl;
                        if (!url) return;
                        setFullscreenImageUrl(url);
                      }}
                    >
                      <Maximize2 className="w-6 h-6 text-indigo-600" />
                    </button>
                  </div>
                  {isDemo && !isWatermarkFreeUpload && hasGeneratedResults && (
  <div
    className="absolute inset-0 z-10 overflow-hidden"
    style={{ cursor: 'not-allowed', pointerEvents: 'auto' }}
    onContextMenu={e => e.preventDefault()}
  >
    <div
      className="absolute inset-0 flex flex-wrap content-around justify-around opacity-30 select-none"
      style={{ transform: 'rotate(-30deg) scale(1.4)' }}
      aria-hidden="true"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span key={i} className="text-white font-black text-2xl px-6 py-4 whitespace-nowrap" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
          PREVIEW ONLY
        </span>
      ))}
    </div>
    <div className="absolute inset-0 bg-black/10" />
  </div>
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
                  <img
                    src="/furnished-room.png"
                    alt="Staged living room"
                    className="absolute inset-0 h-full w-full object-cover select-none pointer-events-none"
                    draggable={false}
                    loading="eager"
                    decoding="async"
                    style={{ userSelect: 'none' }}
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

              {restageLoading && (
                <div className="absolute inset-0 z-30 bg-black/35 flex items-center justify-center">
                  <div className="bg-white/95 rounded-xl px-4 py-3 shadow-lg flex items-center gap-2">
                    <Loader className="w-5 h-5 animate-spin text-indigo-600" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-sm font-semibold text-slate-800">
                        Restaging {isMultiImageMode ? `photo ${selectedPhotoIdx + 1} of ${Math.max(1, totalStagedPhotos)}` : "image"}...
                      </span>
                      <span className="text-xs text-slate-500">
                        {isMultiImageMode ? "This is the currently selected staged image." : "This is the currently selected image."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
                <span className="text-lg"><Folder className="text-amber-400" /></span>
                <div>
                  <p className="font-semibold text-indigo-900">
                    {imagesToStageCount || 1} upload{(imagesToStageCount || 1) > 1 ? 's' : ''} = {creditsToUseCount || 1} credit{(creditsToUseCount || 1) > 1 ? 's' : ''}
                  </p>
                  <p className="text-indigo-800 mt-1">
                    Each image you upload is transformed into 3 staged/furnished versions.
                    Credits are charged per upload, not per generated image.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <span className="text-lg"><Recycle /></span>
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

            <div className="flex items-start gap-2 mb-6 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                id="aiConsent"
                checked={aiConsentAcknowledged}
                onChange={(e) => void handleAiConsentChange(e.target.checked)}
                disabled={aiConsentSaving}
                className="mt-1 w-4 h-4 rounded border-slate-300 cursor-pointer"
              />
              <label htmlFor="aiConsent" className="text-sm text-slate-700 cursor-pointer flex-1">
                I understand this is AI-generated staging and it may make mistakes. Elevate Spaces is not responsible for any errors in the generated output.
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
                  if (!aiConsentAcknowledged || aiConsentSaving) {
                    return;
                  }

                  setAiConsentSaving(true);
                  try {
                    await recordAiConsentIfNeeded();
                  } catch (error: any) {
                    setError(error?.message || 'Failed to record AI generation consent');
                    return;
                  } finally {
                    setAiConsentSaving(false);
                  }

                  setShowConfirmation(false);
                  if (pendingGenerationAction) {
                    await pendingGenerationAction();
                  }
                  setPendingGenerationAction(null);
                }}
                disabled={!aiConsentAcknowledged || aiConsentSaving}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition disabled:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed"
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
        {isMultiImageMode && totalStagedPhotos > 0 && (
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-slate-700">
              Photo {selectedPhotoIdx + 1} of {totalStagedPhotos}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <button
                onClick={() => setSelectedPhotoIdx(Math.max(0, selectedPhotoIdx - 1))}
                disabled={selectedPhotoIdx === 0}
                className="px-3 py-1 rounded bg-slate-200 text-slate-700 disabled:opacity-50 hover:bg-slate-300 transition text-xs font-semibold"
              >
                ← Prev
              </button>

              <div className="flex gap-1">
                {visiblePhotoIndices.map((photoIdx) => {
                  const photoStartIdx = photoIdx * VARIANTS_PER_IMAGE;
                  const photoUrls = stagedImageUrls.slice(photoStartIdx, photoStartIdx + VARIANTS_PER_IMAGE);
                  return (
                    <button
                      key={photoIdx}
                      onClick={() => {
                        setSelectedPhotoIdx(photoIdx);
                        setSelectedImageIdx(0);
                      }}
                      className={`w-12 h-12 rounded border-2 transition overflow-hidden ${selectedPhotoIdx === photoIdx
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

        {/* Version Selector */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-end gap-2">
          {hasGeneratedResults && (
            <div className="text-sm font-semibold text-slate-700 mr-8">
              {isMultiImageMode
                ? `Version ${selectedImageIdx + 1} for Photo ${selectedPhotoIdx + 1}`
                : `Version ${selectedImageIdx + 1}`}
            </div>
          )}

          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {Array.from({ length: VARIANTS_PER_IMAGE }).map((_, idx) => {
              const currentPhotoStartIdx = selectedPhotoIdx * VARIANTS_PER_IMAGE;
              const variantUrl = stagedImageUrls[currentPhotoStartIdx + idx];
              const isVariantLoading = !variantUrl && (loading || restageLoading || multiProgress.active || isBatchProcessing);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImageIdx(idx)}
                  disabled={!variantUrl}
                  className="relative w-20 h-14 rounded border-2 flex items-center justify-center bg-slate-50 transition-all overflow-hidden"
                  style={{
                    borderColor: selectedImageIdx === idx ? '#6366f1' : '#e5e7eb',
                    boxShadow: selectedImageIdx === idx ? '0 0 0 2px #6366f1' : undefined,
                    opacity: 1,
                  }}
                >
                  {variantUrl ? (
                    <img
                      src={variantUrl}
                      alt={`Version ${idx + 1}`}
                      className="h-full w-full object-cover"
                      loading="eager"
                      decoding="async"
                    />
                  ) : isVariantLoading ? (
                    <div className="flex h-full w-full items-center justify-center bg-slate-50">
                      <Loader className="h-4 w-4 animate-spin text-indigo-600" />
                    </div>
                  ) : (
                    <div className="h-full w-full bg-linear-to-br from-slate-100 via-white to-slate-100" />
                  )}
                </button>
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
        isEligible={shouldShowProjectSelector}
        ineligibilityReason={ineligibilityReason || undefined}
        onSelectProject={async (projectId, projectName) => {
          setStagedImageUrls([]);
          setStagedIds([]);
          setSelectedImageIdx(0);
          setSelectedPhotoIdx(0);

          setSelectedProjectId(projectId);
          setSelectedProjectName(projectName || null);
          setShowProjectModal(false);

          const defaultKey = getDefaultProjectStorageKey(selectedTeamId);
          const stored = localStorage.getItem(defaultKey);
          if (stored) {
            try {
              setDefaultProject(JSON.parse(stored));
            } catch (error: any) {
            }
          }

          await runGenerate(projectId || undefined);
        }}
      />

      {/* Sign Up Bonus Modal */}
      <SignUpBonusModal
        open={showBonusModal}
        onOpenChange={setShowBonusModal}
      />
    </>
  );
}
