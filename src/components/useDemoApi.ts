import { stageImage, restageImage, stageImageSSE } from "@/services/image.service";
import { useState } from "react";
import { RoomType, StagingStyle } from "@/lib/errors";
import { showError } from "./toastUtils";
import { v4 as uuidv4 } from 'uuid';

// Accept selectedImageIdx/setSelectedImageIdx as props
export function useDemoApi(props?: { selectedImageIdx: number, setSelectedImageIdx: (idx: number) => void }) {
    // Ensure device ID is generated and stored
    function getOrCreateDeviceId() {
        if (typeof window === 'undefined') return '';
        let deviceId = localStorage.getItem('device_id');
        if (!deviceId || typeof deviceId !== 'string') {
            deviceId = uuidv4();
            localStorage.setItem('device_id', deviceId);
        }
        return deviceId || '';
    }
    const deviceId = typeof window !== 'undefined' ? getOrCreateDeviceId() : '';
    const [loading, setLoading] = useState(false);
    const [restageLoading, setRestageLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stagedImageUrls, setStagedImageUrls] = useState<string[]>([]);
    const [stagedIds, setStagedIds] = useState<string[]>([]);
    // Load demoCount and demoLimit from localStorage if available
    const getStoredDemoCount = () => {
        if (typeof window === 'undefined') return 0;
        const val = localStorage.getItem('demo_count');
        return val ? parseInt(val, 10) : 0;
    };
    const getStoredDemoLimit = () => {
        if (typeof window === 'undefined') return 10;
        const val = localStorage.getItem('demo_limit');
        return val ? parseInt(val, 10) : 10;
    };
    const [demoCount, setDemoCountState] = useState<number>(getStoredDemoCount());
    const [demoLimit, setDemoLimitState] = useState<number>(getStoredDemoLimit());

    // Update localStorage whenever demoCount or demoLimit changes
    const setDemoCount = (val: number) => {
        setDemoCountState(val);
        if (typeof window !== 'undefined') localStorage.setItem('demo_count', val.toString());
    };
    const setDemoLimit = (val: number) => {
        setDemoLimitState(val);
        if (typeof window !== 'undefined') localStorage.setItem('demo_limit', val.toString());
    };
    const [isDemo, setIsDemo] = useState<boolean>(false);
    const [isRepeatDemoUser, setIsRepeatDemoUser] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [limitReached, setLimitReached] = useState<boolean>(false);

    // Use props for selectedImageIdx/setSelectedImageIdx
    const selectedImageIdx = props?.selectedImageIdx ?? 0;
    const setSelectedImageIdx = props?.setSelectedImageIdx ?? (() => { });

    const handleStageImage = (file: File | null, roomType: RoomType | undefined, exteriorType: RoomType | undefined, stagingStyle: StagingStyle | undefined, prompt: string, areaType: "interior" | "exterior", removeFurniture?: boolean) => {
        if (!file) return;
        setLoading(true);
        setError(null);
        // Only clear images for new generation, not for restage
        setStagedImageUrls([]);
        setStagedIds([]);
        let demoCountValue = 0;
        let demoLimitValue = 10;
        let isDemoValue = false;
        let done = false;
        stageImageSSE({
            file,
            roomType: areaType === "interior" ? roomType : exteriorType,
            stagingStyle,
            prompt,
            deviceId,
            onImage: (data) => {
                setStagedImageUrls(prev => [...prev, data.stagedImageUrl]);
                setStagedIds(prev => [...prev, data.stagedId]);
                setSelectedImageIdx(0); // Always select the first image after new generation
                if (typeof data.demoCount === "number") demoCountValue = data.demoCount;
                if (typeof data.demoLimit === "number") demoLimitValue = data.demoLimit;
                if (typeof data.isDemo === "boolean") isDemoValue = data.isDemo;
                setDemoCount(demoCountValue);
                setDemoLimit(demoLimitValue);
                setIsDemo(isDemoValue);
                if ((demoCountValue ?? 0) >= (demoLimitValue ?? 10)) setLimitReached(true);
                if (isDemoValue) {
                    setError("This is a watermarked demo preview. Sign up or purchase credits to download full-resolution images.");
                }
            },
            onError: (err) => {
                setError(err.message || "Failed to stage image");
                setLoading(false);
            },
            onDone: () => {
                setLoading(false);
                done = true;
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
                // Replace the selected image with the new restaged image
                const updated = [...prev];
                updated[props?.selectedImageIdx ?? 0] = restaged.stagedImageUrl;
                setSelectedImageIdx(props?.selectedImageIdx ?? 0);
                return updated;
            });
            setStagedIds(prev => {
                if (!restaged.stagedId) return prev;
                const updated = [...prev];
                updated[props?.selectedImageIdx ?? 0] = restaged.stagedId;
                return updated;
            });
        } catch (err: any) {
            setError(err?.message || "Failed to restage image");
        } finally {
            setRestageLoading(false);
        }
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
        selectedImageIdx,
        setSelectedImageIdx,
    };
}
