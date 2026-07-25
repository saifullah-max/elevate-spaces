"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RoomType, StagingStyle } from "@/lib/errors";
import { stageImageSSE, stageMultipleImagesSSE, restageImage, normalizeImageUrl } from "@/services/image.service";
import { getUserCredits, getPaymentSummary, type PaymentSummary } from "@/services/payment.service";
import { getMyProjects } from "@/services/projects.service";
import { getTeams, getTeamEligibility } from "@/services/teams.service";
import type { Team } from "@/types/teams.types";
import { canUserCustomizeStyling } from "@/helpers/subscription.helpers";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { initGuestSession, getOrCreateFingerprint } from "@/services/guest.service";

export type AreaType = "interior" | "exterior";
export type CreditSource = "personal" | "team";

export interface StudioProject {
  id: string;
  name: string;
}

export interface StudioVariant {
  url: string;
  variantIdx: number;
  stagedId?: string;
}

export interface StudioResult {
  file: File;
  fileUrl: string;
  variants: StudioVariant[];
  selectedVariantIdx: number;
  roomType: RoomType;
  stagingStyle: StagingStyle;
  areaType: AreaType;
  isWatermarked: boolean;
}

export interface PerImageSetting {
  roomType: RoomType;
  stagingStyle: StagingStyle;
  areaType: AreaType;
  prompt: string;
}

// Approx wall-clock time for a single image (3 variants), matching the
// demo page's estimate. Used as the initial countdown for a 1-photo batch,
// before/if the backend gives us a more precise per-batch estimate.
const SINGLE_STAGE_ESTIMATE_SEC = 35;

export function useStudio(initialFiles?: File[]) {
  const [files, setFiles] = useState<File[]>([]);
  const [roomType, setRoomType] = useState<RoomType>("living-room");
  const [stagingStyle, setStagingStyle] = useState<StagingStyle>("modern");
  const [areaType, setAreaType] = useState<AreaType>("interior");
  const [prompt, setPrompt] = useState("");
  const [creditSource, setCreditSource] = useState<CreditSource>("personal");
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [personalBalance, setPersonalBalance] = useState<number>(0);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamCredits, setTeamCredits] = useState<number>(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [demoCreditsRemaining, setDemoCreditsRemaining] = useState<number>(0);
  const [demoCreditsLimit, setDemoCreditsLimit] = useState<number>(10);
  const [processing, setProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Backend-provided estimate (seconds) for how long the current batch
  // will take. Set from the backend's "accepted" event for multi-photo
  // batches; falls back to a fixed per-photo estimate for single photos.
  const [estimatedSeconds, setEstimatedSeconds] = useState(0);

  // Guest (not-logged-in) demo credit balance. Logged-in users use
  // personalBalance / team wallets instead.
  const [guestDemoCreditsRemaining, setGuestDemoCreditsRemaining] = useState<number>(0);
  const [guestCreditsLoaded, setGuestCreditsLoaded] = useState(false);
  // Flips true the moment a guest's demo credits hit 0 during generation,
  // so the Studio page can show the "sign up for 5 bonus credits" modal.
  const [justHitGuestLimit, setJustHitGuestLimit] = useState(false);

  // Stable per-device fingerprint, sent as the x-fingerprint header on
  // every staging call. Required so the backend can reliably identify a
  // returning guest across a cross-domain setup where the device_id
  // cookie doesn't travel to the backend.
  const [deviceId, setDeviceIdState] = useState<string>("");

  // Per-image customization (Pro/Team subscription required)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [teamEligibility, setTeamEligibility] = useState<any>(null);
  const [useCustomStyling, setUseCustomStyling] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [perImageSettings, setPerImageSettings] = useState<PerImageSetting[]>([]);

  // Restage: free re-editing of an already-staged image with a new prompt.
  const [restaging, setRestaging] = useState(false);
  const [restagePrompt, setRestagePrompt] = useState("");

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles.slice(0, 15));
    }
  }, [initialFiles]);

  useEffect(() => {
    const auth = getAuthFromStorage();
    setIsLoggedIn(Boolean(auth?.token));

    // Always resolve the device fingerprint regardless of login state -
    // staging requests need it for stable identity attribution.
    (async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setDeviceIdState(fp);

        if (!auth?.token) {
          const response: any = await initGuestSession(fp);
          const usage = response?.data?.usageCount ?? 0;
          const limit = response?.data?.limit ?? 10;
          const remaining =
            typeof response?.data?.remainingDemoCredits === "number"
              ? response.data.remainingDemoCredits
              : Math.max(0, limit - usage);
          setDemoCreditsLimit(limit);
          setDemoCreditsRemaining(remaining);
          setGuestDemoCreditsRemaining(remaining);
        }
      } catch {
        // Leave deviceId empty / credits at 0 if this fails - staging can
        // still proceed via the backend's IP-based fallback.
      } finally {
        setGuestCreditsLoaded(true);
      }
    })();

    if (!auth?.token) {
      return;
    }

    (async () => {
      try {
        const credits = await getUserCredits();
        setPersonalBalance(Number(credits?.currentBalance ?? 0));
      } catch {}
      try {
        const p = await getMyProjects();
        setProjects(
          (p.projects || []).map((x) => ({ id: String(x.id), name: String(x.name || "Untitled") }))
        );
      } catch {}
      try {
        const t = await getTeams();
        setTeams(t.teams || []);
      } catch {}
      try {
        const s = await getPaymentSummary();
        setPaymentSummary(s);
      } catch {}
    })();
  }, []);

  // Team eligibility for the *currently selected* team - needed to gate
  // per-image customization when spending team credits.
  useEffect(() => {
    if (creditSource !== "team" || !teamId) {
      setTeamEligibility(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const e = await getTeamEligibility(teamId);
        if (!cancelled) setTeamEligibility(e?.data ?? e);
      } catch {
        if (!cancelled) setTeamEligibility(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [creditSource, teamId]);

  useEffect(() => {
    if (creditSource !== "team") {
      setTeamCredits(0);
      return;
    }
    const t = teams.find((x) => x.id === teamId);
    setTeamCredits(Number(t?.wallet ?? 0));
  }, [creditSource, teamId, teams]);

  const selectedTeam = useMemo(
    () => teams.find((x) => x.id === teamId) || null,
    [teams, teamId]
  );

  const canCustomizePerImage = useMemo(
    () => canUserCustomizeStyling(creditSource, selectedTeam, paymentSummary, teamEligibility),
    [creditSource, selectedTeam, paymentSummary, teamEligibility]
  );

  const addProject = useCallback((project: StudioProject, select = true) => {
    setProjects((prev) => (prev.some((p) => p.id === project.id) ? prev : [...prev, project]));
    if (select) setProjectId(project.id);
  }, []);

  // Keep perImageSettings in sync with the file list - grow when adding
  // photos, shrink when removing them. Uses the current bulk defaults for
  // any newly added row so the modal starts from a sensible state.
  useEffect(() => {
    setPerImageSettings((prev) => {
      if (prev.length === files.length) return prev;
      const next = files.map((_, i) => prev[i] || { roomType, stagingStyle, areaType, prompt });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files.length]);

  const addFiles = useCallback((incoming: FileList | File[] | null) => {
    if (!incoming) return;
    const arr = Array.from(incoming as any as File[]);
    setFiles((prev) => [...prev, ...arr].slice(0, 15));
  }, []);

  const removeFile = useCallback((idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const clearFiles = useCallback(() => setFiles([]), []);

  const creditsNeeded = files.length;

  // Determine WHY generation might be blocked, so the UI can show a
  // specific, friendly message instead of just disabling the button.
  const insufficientCreditsReason = useMemo((): "personal" | "team" | "guest" | null => {
    if (files.length === 0) return null;
    if (!isLoggedIn) {
      if (guestCreditsLoaded && guestDemoCreditsRemaining <= 0) return "guest";
      return null;
    }
    if (creditSource === "team") {
      if (!teamId) return null; // handled separately as "select a team"
      if (teamCredits < creditsNeeded) return "team";
      return null;
    }
    if (personalBalance < creditsNeeded) return "personal";
    return null;
  }, [files.length, isLoggedIn, guestCreditsLoaded, guestDemoCreditsRemaining, creditSource, teamId, teamCredits, personalBalance, creditsNeeded]);

  const canGenerate = useMemo(() => {
    if (processing) return false;
    if (files.length === 0) return false;
    if (insufficientCreditsReason) return false;
    return true;
  }, [processing, files.length, insufficientCreditsReason]);

  useEffect(() => {
    if (!processing) {
      setElapsedSec(0);
      return;
    }
    const start = Date.now();
    const t = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, [processing]);

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    setError(null);
    setProcessing(true);
    setProgressMessage("Preparing...");
    setProgressPercent(2);
    setResults([]);
    setEstimatedSeconds(files.length > 1 ? 0 : SINGLE_STAGE_ESTIMATE_SEC);

    const perFileResults: StudioResult[] = files.map((f, i) => {
      const s = useCustomStyling && perImageSettings[i] ? perImageSettings[i] : null;
      return {
        file: f,
        fileUrl: URL.createObjectURL(f),
        variants: [],
        selectedVariantIdx: 0,
        roomType: s?.roomType ?? roomType,
        stagingStyle: s?.stagingStyle ?? stagingStyle,
        areaType: s?.areaType ?? areaType,
        isWatermarked: false,
      };
    });
    setResults(perFileResults);

    const totalVariantsTarget = files.length * 3;
    let variantsReceived = 0;

    const applyImageUpdate = (photoIdx: number, data: any) => {
      const url = normalizeImageUrl(data?.imageUrl || data?.url || data?.stagedImageUrl || "");
      if (!url) return;
      variantsReceived += 1;
      setProgressPercent(Math.min(98, Math.round((variantsReceived / totalVariantsTarget) * 100)));

      // freeCleanUploadsUsed is the count BEFORE this photo - matches the
      // backend's own watermark decision: watermarked once that count
      // reaches 5 (i.e. this is the 6th+ clean-eligible photo).
      const isPhotoWatermarked =
        !isLoggedIn && typeof data?.freeCleanUploadsUsed === "number"
          ? data.freeCleanUploadsUsed >= 5
          : false;

      setResults((prev) => {
        const next = prev.slice();
        const entry = next[photoIdx];
        if (!entry) return prev;
        const nextVariants = entry.variants.slice();
        nextVariants.push({ url, variantIdx: nextVariants.length, stagedId: data?.stagedId });
        next[photoIdx] = { ...entry, variants: nextVariants, isWatermarked: isPhotoWatermarked };
        return next;
      });

      if (!isLoggedIn && typeof data?.remainingDemoCredits === "number") {
        setGuestDemoCreditsRemaining(data.remainingDemoCredits);
        setDemoCreditsRemaining(data.remainingDemoCredits);
        if (data.remainingDemoCredits <= 0) {
          setJustHitGuestLimit(true);
        }
      }
    };

    if (files.length <= 1) {
      // Single photo - stage directly.
      const file = files[0];
      setSelectedPhotoIdx(0);
      setProgressMessage("Processing your image...");

      const perImg = useCustomStyling ? perImageSettings[0] : undefined;
      const rt = perImg?.roomType ?? roomType;
      const ss = perImg?.stagingStyle ?? stagingStyle;
      const at = perImg?.areaType ?? areaType;
      const pr = (perImg?.prompt || prompt) || undefined;

      await new Promise<void>((resolve) => {
        stageImageSSE({
          file,
          prompt: pr,
          roomType: rt,
          stagingStyle: ss,
          areaType: at,
          projectId: projectId || undefined,
          teamId: creditSource === "team" && teamId ? teamId : undefined,
          creditSource,
          removeFurniture: false,
          deviceId: deviceId || undefined,
          onImage: (data) => applyImageUpdate(0, data),
          onProgress: (msg) => setProgressMessage(msg),
          onError: (err) => {
            setError(err?.message || "Staging failed");
          },
          onDone: () => resolve(),
        });
      });
    } else {
      // Multi-photo batch - send everything to the backend at once so it
      // can process in parallel, and pick up its time estimate.
      const perImageRoomTypes = useCustomStyling
        ? perImageSettings.map((s) => s.roomType)
        : undefined;
      const perImageStagingStyles = useCustomStyling
        ? perImageSettings.map((s) => s.stagingStyle)
        : undefined;
      const perImageAreaTypes = useCustomStyling
        ? perImageSettings.map((s) => s.areaType)
        : undefined;
      const perImagePrompts = useCustomStyling
        ? perImageSettings.map((s) => s.prompt)
        : undefined;

      await new Promise<void>((resolve) => {
        stageMultipleImagesSSE({
          files,
          roomType,
          stagingStyle,
          areaType,
          roomTypes: perImageRoomTypes,
          stagingStyles: perImageStagingStyles,
          areaTypes: perImageAreaTypes,
          prompts: perImagePrompts,
          prompt,
          removeFurniture: false,
          deviceId: deviceId || undefined,
          teamId: creditSource === "team" && teamId ? teamId : undefined,
          projectId: projectId || undefined,
          creditSource,
          onAccepted: (data) => {
            if (typeof data?.estimatedSeconds === "number") {
              setEstimatedSeconds(data.estimatedSeconds);
            }
            if (!isLoggedIn && typeof data?.remainingDemoCredits === "number") {
              setGuestDemoCreditsRemaining(data.remainingDemoCredits);
              setDemoCreditsRemaining(data.remainingDemoCredits);
            }
            const total = typeof data?.expectedTotalVariants === "number" ? data.expectedTotalVariants : totalVariantsTarget;
            setProgressMessage(`Processing ${files.length} images (0/${total} variants)`);
          },
          onImage: (data) => {
            const photoIdx = typeof data?.originalIndex === "number" ? data.originalIndex : 0;
            setSelectedPhotoIdx(photoIdx);
            applyImageUpdate(photoIdx, data);
            setProgressMessage(`Processing ${files.length} images (${variantsReceived}/${totalVariantsTarget} variants)`);
          },
          onError: (err) => {
            setError(err?.message || "Staging failed");
          },
          onDone: () => resolve(),
        });
      });
    }

    setProgressPercent(100);
    setProgressMessage("Done");
    setProcessing(false);
  }, [canGenerate, files, prompt, roomType, stagingStyle, areaType, projectId, creditSource, teamId, useCustomStyling, perImageSettings, isLoggedIn, deviceId]);

  // Countdown based on the backend's estimate for this batch, with a
  // small buffer for multi-photo batches so it doesn't hit 0 before the
  // last variant actually arrives.
  const remainingSec = processing
    ? Math.max(0, estimatedSeconds - elapsedSec + (files.length > 1 ? 30 : 0))
    : 0;

  const restageSelected = useCallback(async (): Promise<boolean> => {
    const currentResult = results[selectedPhotoIdx];
    const currentVariant = currentResult?.variants[currentResult.selectedVariantIdx];
    const stagedId = currentVariant?.stagedId;

    if (!stagedId) {
      setError("This image can't be restaged yet - please wait for staging to finish.");
      return false;
    }
    if (!restagePrompt.trim()) {
      setError("Enter a prompt describing what to change before restaging.");
      return false;
    }

    setRestaging(true);
    setError(null);
    try {
      const restaged = await restageImage({
        stagedId,
        prompt: restagePrompt,
        roomType: currentResult.roomType,
        stagingStyle: currentResult.stagingStyle,
        areaType: currentResult.areaType,
        deviceId: deviceId || undefined,
      });

      const url = normalizeImageUrl(restaged.stagedImageUrl);
      setResults((prev) => {
        const next = prev.slice();
        const entry = next[selectedPhotoIdx];
        if (!entry) return prev;
        const nextVariants = entry.variants.slice();
        const variantIdx = entry.selectedVariantIdx;
        nextVariants[variantIdx] = {
          ...nextVariants[variantIdx],
          url,
          stagedId: restaged.stagedId || stagedId,
        };
        const isWatermarked =
          typeof restaged.watermarked === "boolean" ? restaged.watermarked : entry.isWatermarked;
        next[selectedPhotoIdx] = { ...entry, variants: nextVariants, isWatermarked };
        return next;
      });

      setRestagePrompt("");
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to restage image");
      return false;
    } finally {
      setRestaging(false);
    }
  }, [results, selectedPhotoIdx, restagePrompt, deviceId]);

  const selectVariant = useCallback((photoIdx: number, variantIdx: number) => {
    setResults((prev) => {
      const next = prev.slice();
      if (next[photoIdx]) next[photoIdx] = { ...next[photoIdx], selectedVariantIdx: variantIdx };
      return next;
    });
  }, []);

  return {
    files,
    addFiles,
    removeFile,
    clearFiles,
    roomType,
    setRoomType,
    stagingStyle,
    setStagingStyle,
    areaType,
    setAreaType,
    prompt,
    setPrompt,
    creditSource,
    setCreditSource,
    projects,
    projectId,
    setProjectId,
    addProject,
    paymentSummary,
    teams,
    teamId,
    setTeamId,
    teamCredits,
    personalBalance,
    guestDemoCreditsRemaining,
    guestCreditsLoaded,
    justHitGuestLimit,
    setJustHitGuestLimit,
    deviceId,
    isLoggedIn,
    demoCreditsRemaining,
    demoCreditsLimit,
    processing,
    progressMessage,
    progressPercent,
    elapsedSec,
    remainingSec,
    estimatedSeconds,
    creditsNeeded,
    canGenerate,
    insufficientCreditsReason,
    generate,
    results,
    selectedPhotoIdx,
    setSelectedPhotoIdx,
    selectVariant,
    restaging,
    restagePrompt,
    setRestagePrompt,
    restageSelected,
    error,
    setError,
    // Per-image customization
    canCustomizePerImage,
    useCustomStyling,
    setUseCustomStyling,
    customizeModalOpen,
    setCustomizeModalOpen,
    perImageSettings,
    setPerImageSettings,
  };
}

export type StudioController = ReturnType<typeof useStudio>;