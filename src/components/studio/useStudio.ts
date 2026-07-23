"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RoomType, StagingStyle } from "@/lib/errors";
import { stageImageSSE, normalizeImageUrl } from "@/services/image.service";
import { getUserCredits, getPaymentSummary, type PaymentSummary } from "@/services/payment.service";
import { getMyProjects } from "@/services/projects.service";
import { getTeams, getTeamEligibility } from "@/services/teams.service";
import type { Team } from "@/types/teams.types";
import { canUserCustomizeStyling } from "@/helpers/subscription.helpers";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { getOrCreateFingerprint, initGuestSession } from "@/services/guest.service";

export type AreaType = "interior" | "exterior";
export type CreditSource = "personal" | "team";

export interface StudioProject {
  id: string;
  name: string;
}

export interface StudioVariant {
  url: string;
  variantIdx: number;
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
  const [processing, setProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

  // Guest (not-logged-in) demo credit balance. Logged-in users use
  // personalBalance / team wallets instead; this only applies to guests so
  // the Studio's credit display matches what a guest can actually use
  // (previously this always showed 0 for guests even though the backend
  // still honored their free demo credits when staging).
  const [guestDemoCreditsRemaining, setGuestDemoCreditsRemaining] = useState<number>(0);
  const [guestCreditsLoaded, setGuestCreditsLoaded] = useState(false);
  // Set true the moment a guest's demo credits hit 0 during generation, so
  // the Studio page can show the "sign up for 5 bonus credits" modal at
  // exactly the right time (same behavior as the demo page).
  const [justHitGuestLimit, setJustHitGuestLimit] = useState(false);

  // Stable per-device fingerprint, sent as the x-fingerprint header on every
  // staging call. This is REQUIRED for the backend to reliably identify a
  // returning guest (the device_id cookie lives on the frontend domain and
  // is never automatically sent to the backend's separate domain). Without
  // this, the backend falls back to IP-based identification, which is
  // unstable and was causing demo credit usage to appear to "reset."
  const [deviceId, setDeviceIdState] = useState<string>("");

  // Per-image customization (Pro/Team subscription required)
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary | null>(null);
  const [teamEligibility, setTeamEligibility] = useState<any>(null);
  const [useCustomStyling, setUseCustomStyling] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [perImageSettings, setPerImageSettings] = useState<PerImageSetting[]>([]);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles.slice(0, 15));
    }
  }, [initialFiles]);

  useEffect(() => {
    const auth = getAuthFromStorage();
    setIsLoggedIn(Boolean(auth?.token));

    // Always resolve the device fingerprint, regardless of login state -
    // the backend needs it on every staging request to correctly attribute
    // usage to this device instead of falling back to unstable IP-based
    // identity, which was causing demo credits to appear to reset.
    (async () => {
      try {
        const fp = await getOrCreateFingerprint();
        setDeviceIdState(fp);

        if (!auth?.token) {
          const response: any = await initGuestSession(fp);
          const remaining =
            typeof response?.data?.remainingDemoCredits === "number"
              ? response.data.remainingDemoCredits
              : Math.max(0, (response?.data?.limit ?? 10) - (response?.data?.usageCount ?? 0));
          setGuestDemoCreditsRemaining(remaining);
        }
      } catch {
        // Leave deviceId empty / credits at 0 if this fails - staging can
        // still proceed (backend falls back to IP-based identity), this
        // only affects reliability of demo credit attribution and display.
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

  // Team eligibility for the *currently selected* team - needed to gate the
  // per-image customization feature when spending team credits.
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

  const canGenerate = useMemo(() => {
    if (processing) return false;
    if (files.length === 0) return false;
    return true;
  }, [processing, files.length]);

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

    let completedFiles = 0;
    const totalVariantsTarget = files.length * 3;
    let variantsReceived = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setSelectedPhotoIdx(i);
      setProgressMessage(`Processing image ${i + 1} of ${files.length}...`);

      const perImg = useCustomStyling ? perImageSettings[i] : undefined;
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
          onImage: (data) => {
            const url = normalizeImageUrl(data?.imageUrl || data?.url || data?.stagedImageUrl || "");
            if (!url) return;
            variantsReceived += 1;
            setProgressPercent(Math.min(98, Math.round((variantsReceived / totalVariantsTarget) * 100)));

            // The backend reports freeCleanUploadsUsed as the cumulative
            // count of clean (non-watermarked) uploads AFTER this photo.
            // Values 1-5 mean this photo was free/clean; 6+ means it was
            // watermarked. Only applies to guests/non-subscribers - the
            // backend itself only sends a meaningful value in that case.
            const isPhotoWatermarked =
              !isLoggedIn && typeof data?.freeCleanUploadsUsed === "number"
                ? data.freeCleanUploadsUsed > 5
                : false;

            setResults((prev) => {
              const next = prev.slice();
              const entry = next[i];
              if (!entry) return prev;
              const nextVariants = entry.variants.slice();
              nextVariants.push({ url, variantIdx: nextVariants.length });
              next[i] = { ...entry, variants: nextVariants, isWatermarked: isPhotoWatermarked };
              return next;
            });

            // Keep the guest's displayed credit count accurate as staging
            // consumes their demo credits, same as the demo page does.
            if (!isLoggedIn && typeof data?.remainingDemoCredits === "number") {
              setGuestDemoCreditsRemaining(data.remainingDemoCredits);
              if (data.remainingDemoCredits <= 0) {
                setJustHitGuestLimit(true);
              }
            }
          },
          onProgress: (msg) => setProgressMessage(msg),
          onError: (err) => {
            const msg = err?.message || "Staging failed";
            setError(msg);
          },
          onDone: () => {
            completedFiles += 1;
            resolve();
          },
        });
      });
    }

    setProgressPercent(100);
    setProgressMessage("Done");
    setProcessing(false);
  }, [canGenerate, files, prompt, roomType, stagingStyle, areaType, projectId, creditSource, teamId, useCustomStyling, perImageSettings, isLoggedIn, deviceId]);

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
    processing,
    progressMessage,
    progressPercent,
    elapsedSec,
    creditsNeeded,
    canGenerate,
    generate,
    results,
    selectedPhotoIdx,
    setSelectedPhotoIdx,
    selectVariant,
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
