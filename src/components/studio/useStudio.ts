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
}

export interface StudioResult {
  file: File;
  fileUrl: string;
  variants: StudioVariant[];
  selectedVariantIdx: number;
  roomType: RoomType;
  stagingStyle: StagingStyle;
  areaType: AreaType;
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
  const [demoCreditsRemaining, setDemoCreditsRemaining] = useState<number>(0);
  const [demoCreditsLimit, setDemoCreditsLimit] = useState<number>(10);
  const [processing, setProcessing] = useState(false);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [results, setResults] = useState<StudioResult[]>([]);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [variantsReceived, setVariantsReceived] = useState(0);
  const [totalVariantsTarget, setTotalVariantsTarget] = useState(0);
  const [estimatedEndAt, setEstimatedEndAt] = useState<number | null>(null);
  const [estimatedRemainingSec, setEstimatedRemainingSec] = useState<number | null>(null);

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

    if (!auth?.token) {
      // Guest: fetch demo credit balance so the sidebar can show it.
      (async () => {
        try {
          const deviceId = await getOrCreateFingerprint();
          const res = await initGuestSession(deviceId);
          const usage = res?.data?.usageCount ?? 0;
          const limit = res?.data?.limit ?? 10;
          const remaining =
            typeof res?.data?.remainingDemoCredits === "number"
              ? res.data.remainingDemoCredits
              : Math.max(0, limit - usage);
          setDemoCreditsLimit(limit);
          setDemoCreditsRemaining(remaining);
        } catch {}
      })();
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

  // Team eligibility for the *currently selected* team — needed to gate the
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

  const addProject = useCallback((project: StudioProject, select = true) => {
    setProjects((prev) => (prev.some((p) => p.id === project.id) ? prev : [...prev, project]));
    if (select) setProjectId(project.id);
  }, []);

  // Keep perImageSettings in sync with the file list — grow when adding
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
      setEstimatedRemainingSec(null);
      return;
    }
    const start = Date.now();
    const t = window.setInterval(() => {
      const now = Date.now();
      setElapsedSec(Math.floor((now - start) / 1000));
      setEstimatedRemainingSec((prev) => {
        if (estimatedEndAt == null) return prev;
        return Math.max(0, Math.round((estimatedEndAt - now) / 1000));
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [processing, estimatedEndAt]);

  const generate = useCallback(async () => {
    if (!canGenerate) return;
    setError(null);
    setProcessing(true);
    setProgressMessage("Preparing…");
    setProgressPercent(2);
    setResults([]);
    setVariantsReceived(0);
    setTotalVariantsTarget(files.length * 3);
    setEstimatedEndAt(null);
    setEstimatedRemainingSec(null);
    const generationStart = Date.now();

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
      };
    });
    setResults(perFileResults);

    let completedFiles = 0;
    const totalTarget = files.length * 3;
    let received = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setSelectedPhotoIdx(i);
      setProgressMessage(`Processing image ${i + 1} of ${files.length}…`);

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
          onImage: (data) => {
            const url = normalizeImageUrl(data?.imageUrl || data?.url || data?.stagedImageUrl || "");
            if (!url) return;
            received += 1;
            setVariantsReceived(received);
            setProgressPercent(Math.min(98, Math.round((received / totalTarget) * 100)));
            const now = Date.now();
            const avgMs = (now - generationStart) / received;
            const remainingMs = avgMs * (totalTarget - received);
            const newEnd = now + remainingMs;
            setEstimatedEndAt((prev) =>
              prev == null ? newEnd : Math.min(prev, newEnd)
            );
            setEstimatedRemainingSec(Math.max(0, Math.round(remainingMs / 1000)));
            setResults((prev) => {
              const next = prev.slice();
              const entry = next[i];
              if (!entry) return prev;
              const nextVariants = entry.variants.slice();
              nextVariants.push({ url, variantIdx: nextVariants.length });
              next[i] = { ...entry, variants: nextVariants };
              return next;
            });
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
  }, [canGenerate, files, prompt, roomType, stagingStyle, areaType, projectId, creditSource, teamId, useCustomStyling, perImageSettings]);

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
    isLoggedIn,
    demoCreditsRemaining,
    demoCreditsLimit,
    processing,
    progressMessage,
    progressPercent,
    elapsedSec,
    variantsReceived,
    totalVariantsTarget,
    estimatedRemainingSec,
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
