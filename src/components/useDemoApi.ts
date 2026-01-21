import { stageImage, restageImage } from "@/services/image.service";
import { useState } from "react";
import { RoomType, StagingStyle } from "@/lib/errors";
import { showError } from "./toastUtils";
import { v4 as uuidv4 } from 'uuid';

export function useDemoApi() {
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
  const [stagedImageUrl, setStagedImageUrl] = useState<string | null>(null);
  const [stagedId, setStagedId] = useState<string | null>(null);
  const [demoCount, setDemoCount] = useState<number>(0);
  const [demoLimit, setDemoLimit] = useState<number>(10);
  const [isDemo, setIsDemo] = useState<boolean>(false);
  const [isRepeatDemoUser, setIsRepeatDemoUser] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [limitReached, setLimitReached] = useState<boolean>(false);

  const handleStageImage = async (file: File | null, roomType: RoomType | undefined, exteriorType: RoomType | undefined, stagingStyle: StagingStyle | undefined, prompt: string, areaType: "interior" | "exterior") => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const response = await stageImage({
        file,
        roomType: areaType === "interior" ? roomType : exteriorType,
        stagingStyle,
        prompt,
        deviceId,
      });
      setStagedImageUrl(response.stagedImageUrl);
      setStagedId(response.stagedId || null);
      if (typeof response.demoCount === "number") setDemoCount(response.demoCount);
      if (typeof response.demoLimit === "number") setDemoLimit(response.demoLimit);
      if ((response.demoCount ?? 0) >= (response.demoLimit ?? 10)) setLimitReached(true);
      if (response.isDemo) {
        setError("This is a watermarked demo preview. Sign up or purchase credits to download full-resolution images.");
      }
      if (typeof response.isDemo === "boolean") setIsDemo(response.isDemo);
      if (response.demoCount === 0 && (response.demoLimit ?? 10) === 10 && limitReached) {
        setIsRepeatDemoUser(true);
      }
    } catch (err: any) {
      if (err?.code === "DEMO_LIMIT_REACHED") {
        setLimitReached(true);
        setError("Demo limit reached. Please sign up or purchase credits to continue.");
      } else if (err?.code === "DEMO_BLOCKED") {
        setIsBlocked(true);
        setError("Demo access blocked due to repeated use. Please sign up or contact support.");
      } else {
        setError(err.message || "Failed to stage image");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRestageImage = async (stagedId: string | null, restagePrompt: string, roomType: RoomType | undefined, exteriorType: RoomType | undefined, stagingStyle: StagingStyle | undefined, areaType: "interior" | "exterior") => {
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
      setStagedImageUrl(restaged.stagedImageUrl);
      setStagedId(restaged.stagedId || stagedId);
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
  };
}
