import axios from "axios";
import {
  parseApiError,
  ImageProcessingError,
  ImageErrorCode,
  ErrorMessages,
  type RoomType,
  type StagingStyle,
} from "@/lib/errors";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;
// Total wall-clock ceiling for a staging request. Raised from 120s → 240s because
// running multiple stagings in parallel pushes Phase 1 + Phase 2 past 2 minutes
// per tab even when each variant is healthy.
const STAGE_SSE_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_STAGE_SSE_TIMEOUT_MS || "240000");
// Inactivity timeout: abort only if NO bytes arrive for this long. The total ceiling
// above still applies, but as long as the server is actively streaming we keep going.
const STAGE_SSE_INACTIVITY_MS = Number(process.env.NEXT_PUBLIC_STAGE_SSE_INACTIVITY_MS || "90000");
// Show "taking too long" message after 25 seconds
const SLOW_STAGING_THRESHOLD_MS = 25000;

function getBackendBaseUrl(): string {
  if (!API_BASE_URL) return "";
  return API_BASE_URL.replace(/\/api\/?$/i, "");
}

export function normalizeImageUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  if (/^https?:\/\//i.test(rawUrl) || rawUrl.startsWith("data:") || rawUrl.startsWith("blob:")) {
    return rawUrl;
  }

  const normalized = rawUrl.replace(/\\/g, "/");
  const uploadsMatch = normalized.match(/(?:^|\/)(uploads\/.+)$/i);

  if (uploadsMatch) {
    const backendBase = getBackendBaseUrl();
    if (!backendBase) return `/${uploadsMatch[1]}`;
    return `${backendBase}/${uploadsMatch[1]}`;
  }

  if (normalized.startsWith("/")) {
    const backendBase = getBackendBaseUrl();
    if (!backendBase) return normalized;
    return `${backendBase}${normalized}`;
  }

  return rawUrl;
}

export function stageImageSSE({
  file,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
  areaType = "interior",
  deviceId,
  teamId,
  projectId,
  creditSource,
  onImage,
  onError,
  onDone,
  onProgress,
  removeFurniture
}: StageImageParams & {
  deviceId?: string,
  teamId?: string,
  projectId?: string,
  creditSource?: "personal" | "team",
  onImage: (data: any) => void,
  onError?: (err: any) => void,
  onDone?: () => void,
  onProgress?: (message: string) => void,
  removeFurniture?: boolean
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("roomType", roomType);
  formData.append("stagingStyle", stagingStyle);
  if (prompt) formData.append("prompt", prompt);
  if (prompt) formData.append("prompt", prompt);
  if (typeof removeFurniture !== 'undefined') formData.append("removeFurniture", String(removeFurniture));
  // Only append teamId if it's a non-empty string
  if (teamId && typeof teamId === 'string' && teamId.trim() !== '') {
    formData.append("teamId", teamId);
  } else {
  }
  // Only append projectId if it's a non-empty string
  if (projectId && typeof projectId === 'string' && projectId.trim() !== '') {
    formData.append("projectId", projectId);
  }
  if (creditSource) {
    formData.append("creditSource", creditSource);
  }

  // First, upload the file and get a token or temp id (or use a presigned URL approach)
  // For simplicity, we'll POST to a special /images/generate/stream endpoint (must match backend route)
  // Get token from localStorage only
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    const authRaw = localStorage.getItem('elevate_spaces_auth');
    if (authRaw) {
      try {
        const auth = JSON.parse(authRaw);
        token = auth.token || null;
      } catch {}
    }
  }
  const controller = new AbortController();
  let progressMessageShown = false;
  const timeoutHandle = setTimeout(() => {
    controller.abort(new Error(`Staging request timed out after ${STAGE_SSE_TIMEOUT_MS}ms`));
  }, STAGE_SSE_TIMEOUT_MS);

  // Inactivity watchdog: aborts only if the stream goes silent. Refreshed below
  // every time bytes arrive from the SSE response.
  let inactivityHandle: ReturnType<typeof setTimeout> | null = null;
  const armInactivity = () => {
    if (inactivityHandle) clearTimeout(inactivityHandle);
    inactivityHandle = setTimeout(() => {
      controller.abort(new Error(`Staging request idle for ${STAGE_SSE_INACTIVITY_MS}ms`));
    }, STAGE_SSE_INACTIVITY_MS);
  };
  armInactivity();

  // Show slow processing message after threshold
  const slowProcessingHandle = setTimeout(() => {
    if (onProgress && !progressMessageShown) {
      onProgress("Processing, Please wait...");
      progressMessageShown = true;
    }
  }, SLOW_STAGING_THRESHOLD_MS);

  fetch(`${API_BASE_URL}/images/stage-with-variants`, {
    method: "POST",
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(deviceId ? { 'x-fingerprint': deviceId } : {}),
    },
    body: formData,
    signal: controller.signal,
  })
    .then(async (response) => {
      // Check for non-2xx responses (e.g., 429 for demo limit)
      if (!response.ok) {
        const errorData = await response.json();
        if (onError) {
          onError(errorData.error || { message: 'Request failed' });
        }
        return;
      }
      if (!response.body) throw new Error("No response body for SSE");
      const reader = response.body.getReader();
      let buffer = '';
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        // Any bytes from the server count as activity — keeps the stream alive.
        armInactivity();
        buffer += decoder.decode(value, { stream: true });
        let eventIdx;
        while ((eventIdx = buffer.indexOf('\n\n')) !== -1) {
          const eventBlock = buffer.slice(0, eventIdx);
          buffer = buffer.slice(eventIdx + 2);
          if (eventBlock.startsWith('event: image')) {
            const dataLine = eventBlock.split('\n').find(l => l.startsWith('data: '));
            if (dataLine) {
              const data = JSON.parse(dataLine.slice(6));
              onImage(data);
            }
          } else if (eventBlock.startsWith('event: error')) {
            const dataLine = eventBlock.split('\n').find(l => l.startsWith('data: '));
            if (dataLine && onError) {
              const data = JSON.parse(dataLine.slice(6));
              onError(data);
            }
          } else if (eventBlock.startsWith('event: done') || eventBlock.startsWith('event: complete')) {
            if (onDone) onDone();
          } else if (eventBlock.startsWith('event: variant_error')) {
            const dataLine = eventBlock.split('\n').find(l => l.startsWith('data: '));
            if (dataLine && onError) {
              const data = JSON.parse(dataLine.slice(6));
              onError(data);
            }
          }
        }
      }
      if (onDone) onDone();
    })
    .catch((err) => {
      if (onError) {
        const message = err?.name === "AbortError"
          ? `Staging timed out after ${Math.round(STAGE_SSE_TIMEOUT_MS / 1000)} seconds. Please try again.`
          : err?.message || "Staging request failed";
        onError({ message, code: err?.name === "AbortError" ? "STAGE_TIMEOUT" : undefined });
      }
    })
    .finally(() => {
      clearTimeout(timeoutHandle);
      clearTimeout(slowProcessingHandle);
      if (inactivityHandle) clearTimeout(inactivityHandle);
    });
}
export async function stageImage({
  file,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
  areaType = "interior",
  removeFurniture,
  deviceId,
  teamId,
}: StageImageParams & { deviceId?: string; teamId?: string }): Promise<StageImageResponse> {
  if (!file) {
    throw new ImageProcessingError(
      ImageErrorCode.NO_FILE_PROVIDED,
      ErrorMessages[ImageErrorCode.NO_FILE_PROVIDED]
    );
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomType", roomType);
    formData.append("stagingStyle", stagingStyle);
    formData.append("areaType", areaType);
    if (prompt) formData.append("prompt", prompt);
    if (typeof removeFurniture !== 'undefined') formData.append("removeFurniture", String(removeFurniture));
    if (teamId) formData.append("teamId", teamId);

    // Get token from localStorage only
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          token = auth.token || null;
        } catch {}
      }
    }
    const response = await axios.post(
      `${API_BASE_URL}/images/generate`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(deviceId ? { 'x-fingerprint': deviceId } : {}),
        },
      }
    );

    if (response.data?.success) return response.data.data;

    throw new ImageProcessingError(
      response.data?.error?.code || ImageErrorCode.UNKNOWN_ERROR,
      response.data?.error?.message || ErrorMessages[ImageErrorCode.UNKNOWN_ERROR],
      response.data?.error?.details
    );
  } catch (err) {
    if (err instanceof ImageProcessingError) throw err;
    throw parseApiError(err);
  }
}

export interface RestageImageParams {
  stagedId: string;
  prompt?: string;
  roomType?: RoomType;
  stagingStyle?: StagingStyle;
  areaType?: "interior" | "exterior";
  removeFurniture?: boolean;
}

export interface RestageImageResponse {
  stagedImageUrl: string;
  stagedId: string;
  roomType: string;
  stagingStyle: string;
  prompt: string | null;
  storage?: string;
  demoCount?: number;
  demoLimit?: number;
  isDemo?: boolean;
  watermarked?: boolean;
}

export async function restageImage({
  stagedId,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
  areaType = "interior",
  removeFurniture,
  deviceId,
}: RestageImageParams & { deviceId?: string }): Promise<RestageImageResponse> {
  if (!stagedId) {
    throw new ImageProcessingError(
      ImageErrorCode.NO_FILE_PROVIDED,
      "No staged image ID provided for restaging."
    );
  }
  try {
    const payload = {
      stagedId,
      roomType,
      stagingStyle,
      areaType,
      ...(prompt ? { prompt } : {}),
      ...(removeFurniture !== undefined ? { removeFurniture } : {}),
    };
    // Get token from localStorage only
    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          token = auth.token || null;
        } catch {}
      }
    }
    const response = await axios.post(
      `${API_BASE_URL}/images/restage`,
      payload,
      {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          ...(deviceId ? { 'x-fingerprint': deviceId } : {}),
        },
      }
    );
    if (response.data?.success) return response.data.data;
    throw new ImageProcessingError(
      response.data?.error?.code || ImageErrorCode.UNKNOWN_ERROR,
      response.data?.error?.message || ErrorMessages[ImageErrorCode.UNKNOWN_ERROR],
      response.data?.error?.details
    );
  } catch (err) {
    if (err instanceof ImageProcessingError) throw err;
    throw parseApiError(err);
  }
}

// ---------- Single Image ----------
export interface StageImageParams {
  file: File;
  prompt?: string;
  roomType?: RoomType;
  stagingStyle?: StagingStyle;
  areaType?: "interior" | "exterior";
  removeFurniture?: boolean;
}

export interface StageImageResponse {
  originalImageUrl?: string;
  stagedImageUrls: string[];
  stagedIds?: string[];
  roomType: string;
  stagingStyle: string;
  prompt: string | null;
  demoCount?: number;
  demoLimit?: number;
  isDemo?: boolean;
}

// ---------- Multi Image ----------
export interface StageMultipleImagesParams {
  files: File[];
  prompt?: string;
  prompts?: (string | undefined)[];
  roomType?: RoomType;
  stagingStyle?: StagingStyle;
  areaType?: "interior" | "exterior";
  roomTypes?: RoomType[]; // Per-image room types
  stagingStyles?: StagingStyle[]; // Per-image styling styles
  areaTypes?: ("interior" | "exterior")[]; // Per-image area types
  removeFurniture?: boolean;
  deviceId?: string;
  teamId?: string;
  projectId?: string;
  creditSource?: "personal" | "team";
}

export interface StageMultipleImagesResponse {
  total: number;
  imageIds: string[];
  creditsUsed?: number;
  creditScope?: "team" | "personal";
}

export function stageMultipleImagesSSE({
  files,
  prompt,
  prompts,
  roomType = "living-room",
  stagingStyle = "modern",
  areaType = "interior",
  roomTypes,
  stagingStyles,
  areaTypes,
  removeFurniture,
  deviceId,
  teamId,
  projectId,
  creditSource,
  onAccepted,
  onImage,
  onError,
  onDone,
}: StageMultipleImagesParams & {
  onAccepted?: (data: any) => void;
  onImage: (data: any) => void;
  onError?: (err: any) => void;
  onDone?: (data?: any) => void;
}) {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  // Include staging style always
  formData.append("stagingStyle", stagingStyle);
  if (stagingStyles && stagingStyles.length > 0) {
    formData.append("stagingStyles", JSON.stringify(stagingStyles));
  }

  // Determine exterior selection from explicit areaTypes, single areaType, or roomTypes that indicate outdoor
  const roomTypesIndicateExterior = roomTypes && roomTypes.length > 0 && roomTypes.every(rt => typeof rt === 'string' && (rt.toLowerCase().includes('outdoor') || rt.toLowerCase().includes('outside') || rt.toLowerCase().includes('exterior')));
  const isExterior = areaType === "exterior" || (areaTypes && areaTypes.length > 0 && areaTypes[0] === "exterior") || roomTypesIndicateExterior;

  if (isExterior) {
    formData.append("areaType", "exterior");
    formData.append("areaTypes", JSON.stringify((areaTypes && areaTypes.length > 0) ? areaTypes : Array(files.length).fill("exterior")));
  } else {
    formData.append("roomType", roomType);
    if (roomTypes && roomTypes.length > 0) {
      formData.append("roomTypes", JSON.stringify(roomTypes));
    }
    // ensure areaTypes is present for server-side indexing (filled with interior)
    formData.append("areaTypes", JSON.stringify((areaTypes && areaTypes.length > 0) ? areaTypes : Array(files.length).fill("interior")));
  }
  
  if (prompt) formData.append("prompt", prompt);
  if (prompts && prompts.length > 0) formData.append("prompts", JSON.stringify(prompts));
  if (typeof removeFurniture !== "undefined") formData.append("removeFurniture", String(removeFurniture));
  if (teamId) formData.append("teamId", teamId);
  if (projectId) formData.append("projectId", projectId);
  if (creditSource) formData.append("creditSource", creditSource);

  let token: string | null = null;
  if (typeof window !== "undefined") {
    const authRaw = localStorage.getItem("elevate_spaces_auth");
    if (authRaw) {
      try {
        const auth = JSON.parse(authRaw);
        token = auth.token || null;
      } catch {}
    }
  }

  fetch(`${API_BASE_URL}/images/multiple-generate?stream=`, {
    method: "POST",
    headers: {
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(deviceId ? { "x-fingerprint": deviceId } : {}),
    },
    body: formData,
  })
    .then(async (response) => {
      if (!response.ok) {
        const errorData = await response.json();
        onError?.(errorData.error || { message: "Request failed" });
        return;
      }

      if (!response.body) throw new Error("No response body for SSE");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let doneCalled = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        let eventIdx;

        while ((eventIdx = buffer.indexOf("\n\n")) !== -1) {
          const eventBlock = buffer.slice(0, eventIdx);
          buffer = buffer.slice(eventIdx + 2);

          const dataLine = eventBlock.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;

          const data = JSON.parse(dataLine.slice(6));
          if (eventBlock.startsWith("event: accepted")) {
            onAccepted?.(data);
          } else if (eventBlock.startsWith("event: image")) {
            onImage(data);
          } else if (eventBlock.startsWith("event: error")) {
            onError?.(data);
          } else if (eventBlock.startsWith("event: done")) {
            doneCalled = true;
            onDone?.(data);
          }
        }
      }

      if (!doneCalled) {
        onDone?.();
      }
    })
    .catch((err) => {
      onError?.(err);
    });
}

export async function stageMultipleImages({
  files,
  prompt,
  prompts,
  roomType = "living-room",
  stagingStyle = "modern",
  areaType = "interior",
  roomTypes,
  stagingStyles,
  areaTypes,
  removeFurniture,
  deviceId,
  teamId,
  projectId,
  creditSource,
}: StageMultipleImagesParams): Promise<StageMultipleImagesResponse> {
  if (!files || files.length === 0) {
    throw new ImageProcessingError(
      ImageErrorCode.NO_FILE_PROVIDED,
      ErrorMessages[ImageErrorCode.NO_FILE_PROVIDED]
    );
  }

  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    // Prefer per-image values for top-level fields when available
    const effectiveRoomTypePost = (roomTypes && roomTypes.length > 0) ? roomTypes[0] : roomType;
    const effectiveStagingStylePost = (stagingStyles && stagingStyles.length > 0) ? stagingStyles[0] : stagingStyle;
    const effectiveAreaTypePost = (areaTypes && areaTypes.length > 0) ? areaTypes[0] : areaType;

    // Always include staging style
    formData.append("stagingStyle", effectiveStagingStylePost);
    if (stagingStyles && stagingStyles.length > 0) {
      formData.append("stagingStyles", JSON.stringify(stagingStyles));
    }

    // Determine exterior selection from explicit areaTypes, single areaType, or roomTypes that indicate outdoor
    const roomTypesIndicateExteriorPost = roomTypes && roomTypes.length > 0 && roomTypes.every(rt => typeof rt === 'string' && (rt.toLowerCase().includes('outdoor') || rt.toLowerCase().includes('outside') || rt.toLowerCase().includes('exterior')));
    const isExteriorPost = effectiveAreaTypePost === "exterior" || (areaTypes && areaTypes.length > 0 && areaTypes[0] === "exterior") || roomTypesIndicateExteriorPost;

    if (isExteriorPost) {
      formData.append("areaType", effectiveAreaTypePost);
      formData.append("areaTypes", JSON.stringify((areaTypes && areaTypes.length > 0) ? areaTypes : Array(files.length).fill(effectiveAreaTypePost)));
    } else {
      formData.append("roomType", effectiveRoomTypePost);
      if (roomTypes && roomTypes.length > 0) {
        formData.append("roomTypes", JSON.stringify(roomTypes));
      }
      // ensure areaTypes is present for server-side indexing (filled with interior)
      formData.append("areaTypes", JSON.stringify((areaTypes && areaTypes.length > 0) ? areaTypes : Array(files.length).fill("interior")));
    }
    if (prompt) formData.append("prompt", prompt);
    if (prompts && prompts.length > 0) formData.append("prompts", JSON.stringify(prompts));
    if (typeof removeFurniture !== 'undefined') formData.append("removeFurniture", String(removeFurniture));
    if (teamId) formData.append("teamId", teamId);
    if (projectId) formData.append("projectId", projectId);
    if (creditSource) formData.append("creditSource", creditSource);

    let token: string | null = null;
    if (typeof window !== 'undefined') {
      const authRaw = localStorage.getItem('elevate_spaces_auth');
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          token = auth.token || null;
        } catch {}
      }
    }

    const response = await axios.post(
      `${API_BASE_URL}/images/multiple-generate`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(deviceId ? { 'x-fingerprint': deviceId } : {}),
        },
      }
    );

    if (response.data?.success) return response.data.data;

    throw new ImageProcessingError(
      response.data?.error?.code || ImageErrorCode.UNKNOWN_ERROR,
      response.data?.error?.message || ErrorMessages[ImageErrorCode.UNKNOWN_ERROR],
      response.data?.error?.details
    );
  } catch (err) {
    if (err instanceof ImageProcessingError) throw err;
    throw parseApiError(err);
  }
}

export interface UploadFile {
  id?: string;
  filename: string;
  url: string;
  type?: "original" | "staged";
  createdAt: string;
  size?: number;
  status?: string;
}

export interface PairedUpload {
  groupId?: string;
  original: UploadFile;
  staged: UploadFile | null;
  stagedVariants?: UploadFile[];
  createdAt: string;
  statusSummary?: {
    processing: number;
    completed: number;
    failed: number;
  };
}

export interface RecentUploadsResponse {
  uploads: PairedUpload[];
  total: number;
  limit: number;
}

export async function getRecentUploads(limit = 10): Promise<RecentUploadsResponse> {
  try {
    // Get token from localStorage only
    let token: string | null = null;
    if (typeof window !== "undefined") {
      const authRaw = localStorage.getItem("elevate_spaces_auth");
      if (authRaw) {
        try {
          const auth = JSON.parse(authRaw);
          token = auth.token || null;
        } catch {}
      }
    }
    const response = await axios.get(`${API_BASE_URL}/images/recent`, {
      params: { limit },
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (response.data && response.data.success) {
      return response.data.data;
    }
    throw new ImageProcessingError(
      response.data?.error?.code || ImageErrorCode.UNKNOWN_ERROR,
      response.data?.error?.message || ErrorMessages[ImageErrorCode.UNKNOWN_ERROR],
      response.data?.error?.details
    );
  } catch (error) {
    if (error instanceof ImageProcessingError) {
      throw error;
    }
    throw parseApiError(error);
  }
}

// ---------- Re-export ----------
export { ImageProcessingError, ImageErrorCode } from "@/lib/errors";
