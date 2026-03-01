import { stageImage, restageImage, stageImageSSE, stageMultipleImagesSSE, normalizeImageUrl } from "@/services/image.service";
import { useRef, useState, useEffect } from "react";
import { RoomType, StagingStyle } from "@/lib/errors";
import { showError } from "./toastUtils";
import { v4 as uuidv4 } from 'uuid';
import { getDeviceIdFromCookie, setDeviceIdCookie, initGuestSession } from "@/services/guest.service";

// Accept selectedImageIdx/setSelectedImageIdx as props
export function useDemoApi(props?: { selectedImageIdx: number, setSelectedImageIdx: (idx: number) => void }) {
    // Get device ID from cookie, fallback to creating one
    function getOrCreateDeviceId(): string {
        if (typeof window === 'undefined') return '';

        // First try to get from cookie
        let deviceId = getDeviceIdFromCookie();

        // Fallback to localStorage for migration, then move to cookie
        if (!deviceId) {
            deviceId = localStorage.getItem('device_id');
            if (deviceId) {
                // Migrate to cookie
                setDeviceIdCookie(deviceId);
                // Clean up localStorage
                localStorage.removeItem('device_id');
            }
        }

        // If still no device ID, create one
        if (!deviceId || typeof deviceId !== 'string') {
            deviceId = uuidv4();
            setDeviceIdCookie(deviceId);
        }

        return deviceId || '';
    }

    const [deviceId, setDeviceId] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const [restageLoading, setRestageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stagedImageUrls, setStagedImageUrls] = useState<string[]>([]);
    const [stagedIds, setStagedIds] = useState<string[]>([]);
    const requestIdRef = useRef(0);
    const hasInitialized = useRef(false);

    // Demo state - initialized from API
    const [demoCount, setDemoCountState] = useState<number>(0);
    const [demoLimit, setDemoLimitState] = useState<number>(10);
    const [isDemo, setIsDemo] = useState<boolean>(true);
    const [isRepeatDemoUser, setIsRepeatDemoUser] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [limitReached, setLimitReached] = useState<boolean>(false);
    const [hasPurchasedCredits, setHasPurchasedCredits] = useState<boolean>(false);
    const [demoCreditsRemaining, setDemoCreditsRemaining] = useState<number>(10);
    const [demoSessionReady, setDemoSessionReady] = useState<boolean>(false);

    // Initialize guest session on mount
    useEffect(() => {
        if (typeof window === 'undefined') return; // SSR guard
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const init = async () => {
            console.log('[useDemoApi] Initializing guest session...');
            const id = getOrCreateDeviceId();
            console.log('[useDemoApi] Device ID:', id);
            setDeviceId(id);

            // Check if logged in
            const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('elevate_spaces_auth');
            console.log('[useDemoApi] Is logged in:', isLoggedIn);
            setIsDemo(!isLoggedIn);

            // Always fetch demo tracking status (works for both guests and logged-in users)
            if (id || isLoggedIn) {
                // Fetch current demo status from API
                try {
                    console.log('[useDemoApi] Calling initGuestSession API...');
                    const response = await initGuestSession(id);
                    console.log('[useDemoApi] API response:', response);
                    if (response.success && response.data) {
                        // Update demo state based on backend response
                        const isInDemoMode = response.data.isDemo ?? true;
                        const usageCount = response.data.usageCount ?? 0;
                        const limit = response.data.limit ?? 10;
                        const computedRemaining = typeof response.data.remainingDemoCredits === 'number'
                            ? response.data.remainingDemoCredits
                            : Math.max(0, limit - usageCount);
                        setIsDemo(isInDemoMode);
                        setDemoCountState(usageCount);
                        setDemoLimitState(limit);
                        setLimitReached(response.data.limitReached ?? usageCount >= limit);
                        setIsBlocked(response.data.blocked ?? false);
                        setHasPurchasedCredits(Boolean(response.data.hasPurchasedCredits));
                        setDemoCreditsRemaining(computedRemaining);

                        // Update device ID if server returned one (for guests)
                        if (response.data.deviceId) {
                            setDeviceId(response.data.deviceId);
                            setDeviceIdCookie(response.data.deviceId);
                        }
                    }
                } catch (err) {
                    console.error('[useDemoApi] Failed to init guest session:', err);
                } finally {
                    setDemoSessionReady(true);
                }
            } else {
                console.warn('[useDemoApi] No device ID or auth available');
                setDemoSessionReady(true);
            }
        };

        init();
    }, []);

    // Update state without localStorage
    const setDemoCount = (val: number) => {
        setDemoCountState(val);
    };
    const setDemoLimit = (val: number) => {
        setDemoLimitState(val);
    };

    // Use props for selectedImageIdx/setSelectedImageIdx
    const selectedImageIdx = props?.selectedImageIdx ?? 0;
    const setSelectedImageIdx = props?.setSelectedImageIdx ?? (() => { });

    const handleStageImage = (file: File | null, roomType: RoomType | undefined, exteriorType: RoomType | undefined, stagingStyle: StagingStyle | undefined, prompt: string, areaType: "interior" | "exterior", removeFurniture?: boolean, teamId?: string, onSuccess?: () => void, projectId?: string) => {
        if (!file) return;
        setLoading(true);
        setError(null);
        // Only clear images for new generation, not for restage
        setStagedImageUrls([]);
        setStagedIds([]);
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;
        let demoCountValue = demoCount;
        let demoLimitValue = demoLimit;
        let isDemoValue = isDemo;
        let done = false;
        stageImageSSE({
            file,
            roomType: areaType === "interior" ? roomType : exteriorType,
            stagingStyle,
            prompt,
            deviceId,
            teamId,
            projectId,
            onImage: (data) => {
                if (requestId !== requestIdRef.current) return;
                const normalizedUrl = normalizeImageUrl(data.stagedImageUrl);
                setStagedImageUrls(prev => [...prev, normalizedUrl]);
                setStagedIds(prev => [...prev, data.stagedId]);
                setSelectedImageIdx(0); // Always select the first image after new generation
                if (typeof data.demoCount === "number") demoCountValue = data.demoCount;
                if (typeof data.demoLimit === "number") demoLimitValue = data.demoLimit;
                if (typeof data.isDemo === "boolean") isDemoValue = data.isDemo;
                setDemoCount(demoCountValue);
                setDemoLimit(demoLimitValue);
                setIsDemo(isDemoValue);
                setLimitReached(isDemoValue && demoCountValue >= demoLimitValue);
                setDemoCreditsRemaining(Math.max(0, demoLimitValue - demoCountValue));
                if (isDemoValue) {
                    // Check if user is logged in
                    const isLoggedIn = typeof window !== 'undefined' && !!localStorage.getItem('elevate_spaces_auth');
                    if (isLoggedIn) {
                        setError("This is a watermarked demo preview. Purchase credits to download full-resolution images.");
                    } else {
                        setError("This is a watermarked demo preview. Sign up or purchase credits to download full-resolution images.");
                    }
                }
            },
            onError: (err) => {
                if (requestId !== requestIdRef.current) return;
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('elevate_pending_staging_recovery');
                }
                if (err.code === 'DEMO_LIMIT_REACHED') {
                    setError('Demo limit reached. Please sign up or purchase credits to continue.');
                    setLimitReached(true);
                } else if (err.code === 'DEMO_BLOCKED') {
                    setError('Demo access blocked due to repeated use. Please sign up or contact support.');
                    setIsBlocked(true);
                } else {
                    setError(err.message || "Failed to stage image");
                }
                setLoading(false);
            },
            onDone: () => {
                if (requestId !== requestIdRef.current) return;
                setLoading(false);
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('elevate_pending_staging_recovery');
                }
                done = true;
                // Call success callback if provided (for credit refresh)
                if (onSuccess) {
                    onSuccess();
                }
            }
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
    ) => {
        if (!stagedId) {
            setError("No staged image available for restaging.");
            return;
        }
        setRestageLoading(true);
        setError(null);
        try {
            const restaged = await restageImage({
                stagedId,
                prompt: restagePrompt,
                roomType: areaType === "interior" ? roomType : exteriorType,
                stagingStyle,
                deviceId,
                removeFurniture,
            });
            // Append the new restaged image and select it atomically
            setStagedImageUrls(prev => {
                if (!restaged.stagedImageUrl) return prev;
                const normalizedUrl = normalizeImageUrl(restaged.stagedImageUrl);
                // Replace the selected image with the new restaged image
                const updated = [...prev];
                updated[props?.selectedImageIdx ?? 0] = normalizedUrl;
                setSelectedImageIdx(props?.selectedImageIdx ?? 0);
                return updated;
            });
            setStagedIds(prev => {
                if (!restaged.stagedId) return prev;
                const updated = [...prev];
                updated[props?.selectedImageIdx ?? 0] = restaged.stagedId;
                return updated;
            });
            if (typeof restaged.demoCount === "number") {
                setDemoCount(restaged.demoCount);
            }
            if (typeof restaged.demoLimit === "number") {
                setDemoLimit(restaged.demoLimit);
            }
            if (typeof restaged.isDemo === "boolean") {
                setIsDemo(restaged.isDemo);
                if (
                    restaged.isDemo &&
                    typeof restaged.demoCount === "number" &&
                    typeof restaged.demoLimit === "number"
                ) {
                    setLimitReached(restaged.demoCount >= restaged.demoLimit);
                }
            }
        } catch (err: any) {
            setError(err?.message || "Failed to restage image");
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
        onSuccess?: () => void,
        projectId?: string
    ) => {
        if (!files || files.length === 0) return null;

        setLoading(true);
        setError(null);
        setStagedImageUrls([]);
        setStagedIds([]);
        requestIdRef.current += 1;
        const requestId = requestIdRef.current;

        return new Promise<{ total: number; imageIds: string[]; creditsUsed?: number; creditScope?: "team" | "personal" } | null>((resolve) => {
            stageMultipleImagesSSE({
                files,
                roomType: areaType === "interior" ? roomType : exteriorType,
                stagingStyle,
                prompt,
                removeFurniture,
                deviceId,
                teamId,
                projectId,
                onAccepted: (data) => {
                    if (requestId !== requestIdRef.current) return;
                },
                onImage: (data) => {
                    if (requestId !== requestIdRef.current) return;

                    const originalIndex = typeof data.originalIndex === "number" ? data.originalIndex : 0;
                    const variationIndex = typeof data.variationIndex === "number" ? data.variationIndex : 0;
                    const absoluteIndex = originalIndex * 5 + variationIndex;
                    const normalizedUrl = normalizeImageUrl(data.stagedImageUrl);

                    setStagedImageUrls((prev) => {
                        const next = [...prev];
                        next[absoluteIndex] = normalizedUrl;
                        return next;
                    });

                    setStagedIds((prev) => {
                        const next = [...prev];
                        next[absoluteIndex] = data.stagedId;
                        return next;
                    });

                    setSelectedImageIdx(0);
                },
                onError: (err) => {
                    if (requestId !== requestIdRef.current) return;
                    setError(err?.message || "Failed to start multi-image staging");
                    setLoading(false);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('elevate_pending_staging_recovery');
                    }
                    resolve(null);
                },
                onDone: async (data) => {
                    if (requestId !== requestIdRef.current) return;
                    setLoading(false);
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem('elevate_pending_staging_recovery');
                    }
                    if (onSuccess) {
                        await onSuccess();
                    }
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
        selectedImageIdx,
        setSelectedImageIdx,
    };
}
