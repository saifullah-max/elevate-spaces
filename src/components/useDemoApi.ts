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
    const [demoCount, setDemoCount] = useState<number>(0);
    const [demoLimit, setDemoLimit] = useState<number>(10);
    const [isDemo, setIsDemo] = useState<boolean>(false);
    const [isRepeatDemoUser, setIsRepeatDemoUser] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    const [limitReached, setLimitReached] = useState<boolean>(false);

    // Use props for selectedImageIdx/setSelectedImageIdx
    const selectedImageIdx = props?.selectedImageIdx ?? 0;
    const setSelectedImageIdx = props?.setSelectedImageIdx ?? (() => { });

    const handleStageImage = (file: File | null, roomType: RoomType | undefined, exteriorType: RoomType | undefined, stagingStyle: StagingStyle | undefined, prompt: string, areaType: "interior" | "exterior") => {
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
        areaType: "interior" | "exterior"
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
            });
            // Append the new restaged image and select it atomically
            setStagedImageUrls(prev => {
                const updated = restaged.stagedImageUrl ? [...prev, restaged.stagedImageUrl] : prev;
                if (restaged.stagedImageUrl) setSelectedImageIdx(updated.length - 1);
                return updated;
            });
            setStagedIds(prev => restaged.stagedId ? [...prev, restaged.stagedId] : prev);
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
