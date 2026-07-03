import { restageImage, stageImageSSE, stageMultipleImagesSSE, normalizeImageUrl } from "@/services/image.service";
import { useCallback, useEffect, useRef, useState } from "react";
import { RoomType, StagingStyle } from "@/lib/errors";
import { v4 as uuidv4 } from "uuid";
import { getDeviceIdFromCookie, setDeviceIdCookie, initGuestSession } from "@/services/guest.service";
import { trackDemoPhotoGenerated, trackDemoWatermarkShown } from "@/lib/analytics";

type GuestSessionResponse = {
  success?: boolean;
  data?: {
    deviceId?: string | null;
    usageCount?: number;
    limit?: number;
    limitReached?: boolean;
    blocked?: boolean;
    isDemo?: boolean;
    hasPurchasedCredits?: boolean;
    remainingDemoCredits?: number;
  };
};

const DEMO_STORAGE_KEYS = {
  usageCount: "elevate_demo_usage_count",
  limit: "elevate_demo_limit",
  remaining: "elevate_demo_credits_remaining",
};

function readStoredDemoNumber(key: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useDemoApi(props?: { selectedImageIdx: number; setSelectedImageIdx: (idx: number) => void }) {
  function getOrCreateDeviceId(): string {
    if (typeof window === "undefined") return "";

    let deviceId = getDeviceIdFromCookie();
    if (!deviceId) {
      deviceId = localStorage.getItem("device_id") || "";
      if (deviceId) {
        setDeviceIdCookie(deviceId);
        localStorage.removeItem("device_id");
      }
    }

    if (!deviceId) {
      deviceId = uuidv4();
      setDeviceIdCookie(deviceId);
    }

    return deviceId;
  }

  const [deviceId, setDeviceId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [restageLoading, setRestageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stagedImageUrls, setStagedImageUrls] = useState<string[]>([]);
  const [stagedIds, setStagedIds] = useState<string[]>([]);
  const [stagedFreeClean, setStagedFreeClean] = useState<boolean[]>([]);
  const FREE_CLEAN_UPLOADS_LIMIT = 5;
  const requestIdRef = useRef(0);
  const hasInitialized = useRef(false);

  const [demoCount, setDemoCountState] = useState<number>(() => readStoredDemoNumber(DEMO_STORAGE_KEYS.usageCount, 0));
  const [demoLimit, setDemoLimitState] = useState<number>(() => readStoredDemoNumber(DEMO_STORAGE_KEYS.limit, 10));
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const VARIANTS_PER_IMAGE = 3;
  const [isRepeatDemoUser, setIsRepeatDemoUser] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [limitReached, setLimitReached] = useState<boolean>(false);
  const [hasPurchasedCredits, setHasPurchasedCredits] = useState<boolean>(false);
  const [demoCreditsRemaining, setDemoCreditsRemaining] = useState<number>(() => readStoredDemoNumber(DEMO_STORAGE_KEYS.remaining, 10));
  const [demoSessionReady, setDemoSessionReady] = useState<boolean>(false);
  const [multiProgress, setMultiProgress] = useState({
    active: false,
    totalImages: 0,
    expectedTotalVariants: 0,
    completedVariants: 0,
    estimatedSeconds: 0,
    startedAt: 0,
    failedOrMissing: 0,
  });

  type PerImageAreaType = "interior" | "exterior";
  const streamedIdsRef = useRef<Set<string>>(new Set());
  const hasFiredWatermarkShownRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(DEMO_STORAGE_KEYS.usageCount, String(demoCount));
    localStorage.setItem(DEMO_STORAGE_KEYS.limit, String(demoLimit));
    localStorage.setItem(DEMO_STORAGE_KEYS.remaining, String(demoCreditsRemaining));
  }, [demoCount, demoLimit, demoCreditsRemaining]);

  const applyGuestSessionResponse = useCallback((response: GuestSessionResponse) => {
    if (!response?.success || !response.data) return;

    const usageCount = response.data.usageCount ?? 0;
    const limit = response.data.limit ?? 10;
    const remaining = typeof response.data.remainingDemoCredits === "number"
      ? response.data.remainingDemoCredits
      : Math.max(0, limit - usageCount);

    setIsDemo(response.data.isDemo ?? true);
    setDemoCountState(usageCount);
    setDemoLimitState(limit);
    setLimitReached(response.data.limitReached ?? usageCount >= limit);
    setIsBlocked(response.data.blocked ?? false);
    setHasPurchasedCredits(Boolean(response.data.hasPurchasedCredits));
    setDemoCreditsRemaining(remaining);

    if (response.data.deviceId) {
      setDeviceId(response.data.deviceId);
      setDeviceIdCookie(response.data.deviceId);
    }
  }, []);

  const refreshDemoStatus = useCallback(async () => {
    if (typeof window === "undefined") return;

    try {
      const id = deviceId || getOrCreateDeviceId();
      setDeviceId(id);
      const response = (await initGuestSession(id)) as GuestSessionResponse;
      applyGuestSessionResponse(response);
    } catch (error) {
    }
  }, [applyGuestSessionResponse, deviceId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const init = async () => {
      const id = getOrCreateDeviceId();
      setDeviceId(id);

      const isLoggedIn = !!localStorage.getItem("elevate_spaces_auth");
      setIsDemo(!isLoggedIn);

      try {
        const response = (await initGuestSession(id)) as GuestSessionResponse;
        applyGuestSessionResponse(response);
      } catch (err) {
      } finally {
        setDemoSessionReady(true);
      }
    };

    void init();
  }, [applyGuestSessionResponse]);

  const setDemoCount = (val: number) => setDemoCountState(val);
  const setDemoLimit = (val: number) => setDemoLimitState(val);

  const selectedImageIdx = props?.selectedImageIdx ?? 0;
  const setSelectedImageIdx = props?.setSelectedImageIdx ?? (() => {});

  const handleStageImage = (
    file: File | null,
    roomType: RoomType | undefined,
    exteriorType: RoomType | undefined,
    stagingStyle: StagingStyle | undefined,
    prompt: string,
    areaType: "interior" | "exterior",
    removeFurniture?: boolean,
    teamId?: string,
    creditSource?: "personal" | "team",
    onSuccess?: () => void,
    projectId?: string,
  ) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setStagedImageUrls([]);
    setStagedIds([]);
    setStagedFreeClean([]);
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    let demoCountValue = demoCount;
    let demoLimitValue = demoLimit;
    let isDemoValue = isDemo;
    let hasTrackedThisPhoto = false;

    stageImageSSE({
      file,
      roomType: areaType === "interior" ? roomType : exteriorType,
      stagingStyle,
      areaType,
      prompt,
      deviceId,
      teamId,
      projectId,
      creditSource,
      removeFurniture,
      onImage: (data) => {
        if (requestId !== requestIdRef.current) return;

        const normalizedUrl = normalizeImageUrl(data.stagedImageUrl);
        setStagedImageUrls((previous) => [...previous, normalizedUrl]);
        setStagedIds((previous) => [...previous, data.stagedId]);
        const isPhotoFreeClean =
          typeof data.freeCleanUploadsUsed === "number"
            ? data.freeCleanUploadsUsed < FREE_CLEAN_UPLOADS_LIMIT
            : true;
        setStagedFreeClean((previous) => [...previous, isPhotoFreeClean]);
        setSelectedImageIdx(0);

        if (!hasTrackedThisPhoto) {
          hasTrackedThisPhoto = true;
          const photoNumber =
            typeof data.freeCleanUploadsUsed === "number" ? data.freeCleanUploadsUsed + 1 : 1;
          trackDemoPhotoGenerated(photoNumber, !isPhotoFreeClean);
          if (!isPhotoFreeClean && !hasFiredWatermarkShownRef.current) {
            hasFiredWatermarkShownRef.current = true;
            trackDemoWatermarkShown(photoNumber);
          }
        }

        if (typeof data.demoCount === "number") demoCountValue = data.demoCount;
        if (typeof data.demoLimit === "number") demoLimitValue = data.demoLimit;
        if (typeof data.isDemo === "boolean") isDemoValue = data.isDemo;

        setDemoCount(demoCountValue);
        setDemoLimit(demoLimitValue);
        setIsDemo(isDemoValue);
        setLimitReached(isDemoValue && demoCountValue >= demoLimitValue);
        setDemoCreditsRemaining(
          typeof data.remainingDemoCredits === "number"
            ? data.remainingDemoCredits
            : Math.max(0, demoLimitValue - demoCountValue)
        );

        if (isDemoValue) {
          const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("elevate_spaces_auth");
          setError(
            isLoggedIn
              ? "This is a watermarked demo preview. Purchase credits to download full-resolution images."
              : "This is a watermarked demo preview. Sign up or purchase credits to download full-resolution images."
          );
        }
      },
      onError: (err) => {
        if (requestId !== requestIdRef.current) return;
        if (typeof window !== "undefined") {
          localStorage.removeItem("elevate_pending_staging_recovery");
        }
        if (err.code === "DEMO_LIMIT_REACHED") {
          setError("Demo limit reached. Please sign up or purchase credits to continue.");
          setLimitReached(true);
        } else if (err.code === "DEMO_BLOCKED") {
          setError("Demo access blocked due to repeated use. Please sign up or contact support.");
          setIsBlocked(true);
        } else {
          setError(err.message || "Failed to stage image");
        }
        setLoading(false);
      },
      onProgress: (message) => {
        // Show progress message as a non-error warning
        setError(message);
      },
      onDone: () => {
        if (requestId !== requestIdRef.current) return;
        setLoading(false);
        if (typeof window !== "undefined") {
          localStorage.removeItem("elevate_pending_staging_recovery");
        }

        void refreshDemoStatus().finally(() => {
          if (onSuccess) onSuccess();
        });
      },
    });
  };

  const handleRestageImage = async (
    stagedId: string | null,
    restagePrompt: string,
    roomType: RoomType | undefined,
    exteriorType: RoomType | undefined,
    stagingStyle: StagingStyle | undefined,
    areaType: "interior" | "exterior",
    removeFurniture?: boolean
  ): Promise<boolean> => {
    if (!stagedId) {
      setError("No staged image available for restaging.");
      return false;
    }

    setRestageLoading(true);
    setError(null);

    try {
      const restaged = await restageImage({
        stagedId,
        prompt: restagePrompt,
        roomType: areaType === "interior" ? roomType : exteriorType,
        stagingStyle,
        areaType,
        deviceId,
        removeFurniture,
      });

      setStagedImageUrls((previous) => {
        if (!restaged.stagedImageUrl) return previous;
        const updated = [...previous];
        updated[props?.selectedImageIdx ?? 0] = normalizeImageUrl(restaged.stagedImageUrl);
        setSelectedImageIdx(props?.selectedImageIdx ?? 0);
        return updated;
      });

      // Restaging always watermarks demo users' results (backend applies no
      // free-clean-count exception for restages), so mark this slot as not
      // free regardless of whether the original photo was within the free limit.
      if (restaged.isDemo) {
        setStagedFreeClean((previous) => {
          const updated = [...previous];
          updated[props?.selectedImageIdx ?? 0] = false;
          return updated;
        });
      }

      setStagedIds((previous) => {
        if (!restaged.stagedId) return previous;
        const updated = [...previous];
        updated[props?.selectedImageIdx ?? 0] = restaged.stagedId;
        return updated;
      });

      if (typeof restaged.demoCount === "number") setDemoCount(restaged.demoCount);
      if (typeof restaged.demoLimit === "number") setDemoLimit(restaged.demoLimit);
      if (typeof restaged.isDemo === "boolean") {
        setIsDemo(restaged.isDemo);
        if (restaged.isDemo && typeof restaged.demoCount === "number" && typeof restaged.demoLimit === "number") {
          setLimitReached(restaged.demoCount >= restaged.demoLimit);
        }
      }

      await refreshDemoStatus();
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to restage image");
      return false;
    } finally {
      setRestageLoading(false);
    }
  };

  const handleStageMultipleImages = async (
    files: File[],
    roomType: RoomType | undefined,
    exteriorType: RoomType | undefined,
    stagingStyle: StagingStyle | undefined,
    prompt: string,
    areaType: "interior" | "exterior",
    removeFurniture?: boolean,
    teamId?: string,
    creditSource?: "personal" | "team",
    onSuccess?: () => void,
    projectId?: string,
    perImageRoomTypes?: (RoomType | undefined)[],
    perImageStagingStyles?: (StagingStyle | undefined)[],
    perImageAreaTypes?: (PerImageAreaType | undefined)[],
    perImagePrompts?: (string | undefined)[],
    isContinuation?: boolean,
    batchPhotoOffset: number = 0
  ) => {
    if (!files || files.length === 0) return null;

    setLoading(true);
    setError(null);
    if (!isContinuation) {
      setStagedImageUrls([]);
      setStagedIds([]);
      setStagedFreeClean([]);
      streamedIdsRef.current.clear();
    }

    setMultiProgress((previous) =>
      isContinuation
        ? {
            ...previous,
            active: true,
            totalImages: previous.totalImages + files.length,
            expectedTotalVariants: previous.expectedTotalVariants + files.length * VARIANTS_PER_IMAGE,
          }
        : {
            active: true,
            totalImages: files.length,
            expectedTotalVariants: files.length * VARIANTS_PER_IMAGE,
            completedVariants: 0,
            estimatedSeconds: 0,
            startedAt: Date.now(),
            failedOrMissing: 0,
          }
    );

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;
    let demoCountValue = demoCount;
    let demoLimitValue = demoLimit;
    let isDemoValue = isDemo;

    return new Promise<{ total: number; imageIds: string[]; creditsUsed?: number; creditScope?: "team" | "personal" } | null>((resolve) => {
      stageMultipleImagesSSE({
        files,
        roomType: areaType === "interior" ? roomType : exteriorType,
        stagingStyle,
        areaType,
        roomTypes: areaType === "interior" && perImageRoomTypes ? perImageRoomTypes.filter((value): value is RoomType => value !== undefined) : undefined,
        stagingStyles: perImageStagingStyles ? perImageStagingStyles.filter((value): value is StagingStyle => value !== undefined) : undefined,
        areaTypes: perImageAreaTypes ? perImageAreaTypes.filter((value): value is PerImageAreaType => value !== undefined) : undefined,
        prompts: perImagePrompts ? perImagePrompts.map((value) => value || "") : undefined,
        prompt,
        removeFurniture,
        deviceId,
        teamId,
        projectId,
        creditSource,
        onAccepted: (data) => {
          if (requestId !== requestIdRef.current) return;
          
          // Update demo status from accepted event
          if (typeof data.demoCount === "number") demoCountValue = data.demoCount;
          if (typeof data.demoLimit === "number") demoLimitValue = data.demoLimit;
          if (typeof data.isDemo === "boolean") isDemoValue = data.isDemo;

          setDemoCount(demoCountValue);
          setDemoLimit(demoLimitValue);
          setIsDemo(isDemoValue);
          setLimitReached(isDemoValue && demoCountValue >= demoLimitValue);
          setDemoCreditsRemaining(
            typeof data.remainingDemoCredits === "number"
              ? data.remainingDemoCredits
              : Math.max(0, demoLimitValue - demoCountValue)
          );
          
          setMultiProgress((previous) => ({
            ...previous,
            active: true,
            totalImages: typeof data.totalImages === "number" ? data.totalImages : previous.totalImages,
            expectedTotalVariants: typeof data.expectedTotalVariants === "number" ? data.expectedTotalVariants : previous.expectedTotalVariants,
            estimatedSeconds: typeof data.estimatedSeconds === "number" ? data.estimatedSeconds : previous.estimatedSeconds,
            startedAt: previous.startedAt || Date.now(),
          }));
        },
        onImage: (data) => {
          if (requestId !== requestIdRef.current) return;

          const originalIndex = typeof data.originalIndex === "number" ? data.originalIndex : 0;
          const variationIndex = typeof data.variationIndex === "number" ? data.variationIndex : 0;
          const absoluteIndex = (batchPhotoOffset + originalIndex) * VARIANTS_PER_IMAGE + variationIndex;
          const normalizedUrl = normalizeImageUrl(data.stagedImageUrl);

          setStagedImageUrls((previous) => {
            const next = [...previous];
            next[absoluteIndex] = normalizedUrl;
            return next;
          });

          setStagedIds((previous) => {
            const next = [...previous];
            next[absoluteIndex] = data.stagedId;
            return next;
          });

          const isPhotoFreeClean =
            typeof data.freeCleanUploadsUsed === "number"
              ? data.freeCleanUploadsUsed <= FREE_CLEAN_UPLOADS_LIMIT
              : true;

          setStagedFreeClean((previous) => {
            const next = [...previous];
            // Batch events report freeCleanUploadsUsed AFTER incrementing for
            // this photo, so a value of 1 or 2 means this was the 1st/2nd
            // free photo; 3+ means it was watermarked.
            next[absoluteIndex] = isPhotoFreeClean;
            return next;
          });

          // Only fire once per photo (variationIndex 0), not once per variant.
          if (variationIndex === 0 && typeof data.freeCleanUploadsUsed === "number") {
            trackDemoPhotoGenerated(data.freeCleanUploadsUsed, !isPhotoFreeClean);
            if (!isPhotoFreeClean && !hasFiredWatermarkShownRef.current) {
              hasFiredWatermarkShownRef.current = true;
              trackDemoWatermarkShown(data.freeCleanUploadsUsed);
            }
          }

          if (data.imageId && !streamedIdsRef.current.has(data.imageId)) {
            streamedIdsRef.current.add(data.imageId);
            setMultiProgress((previous) => ({
              ...previous,
              completedVariants: previous.completedVariants + 1,
            }));
          }

          // Update demo/credit status from response (like single-image does)
          if (typeof data.demoCount === "number") demoCountValue = data.demoCount;
          if (typeof data.demoLimit === "number") demoLimitValue = data.demoLimit;
          if (typeof data.isDemo === "boolean") isDemoValue = data.isDemo;

          setDemoCount(demoCountValue);
          setDemoLimit(demoLimitValue);
          setIsDemo(isDemoValue);
          setLimitReached(isDemoValue && demoCountValue >= demoLimitValue);
          setDemoCreditsRemaining(
            typeof data.remainingDemoCredits === "number"
              ? data.remainingDemoCredits
              : Math.max(0, demoLimitValue - demoCountValue)
          );

          // Show demo watermark message like single-image does
          if (isDemoValue) {
            const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("elevate_spaces_auth");
            setError(
              isLoggedIn
                ? "This is a watermarked demo preview. Purchase credits to download full-resolution images."
                : "This is a watermarked demo preview. Sign up or purchase credits to download full-resolution images."
            );
          }

          setSelectedImageIdx(0);
        },
        onError: (err) => {
          if (requestId !== requestIdRef.current) return;
          if (typeof window !== "undefined") {
            localStorage.removeItem("elevate_pending_staging_recovery");
          }
          // Handle errors same way as single-image staging
          if (err.code === "DEMO_LIMIT_REACHED") {
            setError("Demo limit reached. Please sign up or purchase credits to continue.");
            setLimitReached(true);
          } else if (err.code === "DEMO_BLOCKED") {
            setError("Demo access blocked due to repeated use. Please sign up or contact support.");
            setIsBlocked(true);
          } else {
            setError(err.message || "Failed to stage images");
          }
          setLoading(false);
          setMultiProgress((previous) => ({ ...previous, active: false }));
          resolve(null);
        },
        onDone: async (data) => {
          if (requestId !== requestIdRef.current) return;
          setLoading(false);
          setMultiProgress((previous) => ({
            ...previous,
            active: false,
            completedVariants: typeof data?.totalStreamed === "number" ? data.totalStreamed : previous.completedVariants,
            expectedTotalVariants: typeof data?.expectedTotalVariants === "number" ? data.expectedTotalVariants : previous.expectedTotalVariants,
            failedOrMissing: typeof data?.failedOrMissing === "number" ? data.failedOrMissing : previous.failedOrMissing,
          }));

          if (typeof window !== "undefined") {
            localStorage.removeItem("elevate_pending_staging_recovery");
            window.dispatchEvent(
              new CustomEvent("elevate:recent-uploads-refresh", {
                detail: { source: "multi-stage", total: files.length },
              })
            );
          }

          await refreshDemoStatus().finally(() => {
            if (onSuccess) void onSuccess();
          });

          resolve({
            total: files.length,
            imageIds: [],
            creditsUsed: files.length,
            creditScope: teamId ? "team" : "personal",
          });
        },
      });
    });
  };

  return {
    loading,
    restageLoading,
    error,
    deviceId,
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
    refreshDemoStatus,
    handleStageImage,
    handleStageMultipleImages,
    handleRestageImage,
    multiProgress,
    selectedImageIdx,
    setSelectedImageIdx,
  };
}
