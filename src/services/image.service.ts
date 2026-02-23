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

// SSE streaming for image generation
export function stageImageSSE({
  file,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
  deviceId,
  teamId,
  projectId,
  onImage,
  onError,
  onDone,
  removeFurniture
}: StageImageParams & {
  deviceId?: string,
  teamId?: string,
  projectId?: string,
  onImage: (data: any) => void,
  onError?: (err: any) => void,
  onDone?: () => void,
  removeFurniture?: boolean
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("roomType", roomType);
  formData.append("stagingStyle", stagingStyle);
  if (prompt) formData.append("prompt", prompt);
  if (typeof removeFurniture !== 'undefined') formData.append("removeFurniture", String(removeFurniture));
  // Only append teamId if it's a non-empty string
  if (teamId && typeof teamId === 'string' && teamId.trim() !== '') {
    formData.append("teamId", teamId);
    console.log('Image generation will use team credits for team:', teamId);
  } else {
    console.log('Image generation will use personal credits (no team selected)');
  }
  // Only append projectId if it's a non-empty string
  if (projectId && typeof projectId === 'string' && projectId.trim() !== '') {
    formData.append("projectId", projectId);
    console.log('Image will be linked to project:', projectId);
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
  fetch(`${API_BASE_URL}/images/generate`, {
    method: "POST",
    headers: {
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...(deviceId ? { 'x-fingerprint': deviceId } : {}),
    },
    body: formData,
  })
    .then(async (response) => {
      if (!response.body) throw new Error("No response body for SSE");
      const reader = response.body.getReader();
      let buffer = '';
      const decoder = new TextDecoder();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
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
          } else if (eventBlock.startsWith('event: done')) {
            if (onDone) onDone();
          }
        }
      }
      if (onDone) onDone();
    })
    .catch((err) => {
      if (onError) onError(err);
    });
}
export async function stageImage({
  file,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
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
  removeFurniture?: boolean;
}

export interface RestageImageResponse {
  stagedImageUrl: string;
  stagedId: string;
  roomType: string;
  stagingStyle: string;
  prompt: string | null;
  storage?: string;
}

export async function restageImage({
  stagedId,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
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
  roomType?: RoomType;
  stagingStyle?: StagingStyle;
}

export interface StageMultipleImagesResponse {
  total: number;
  imageIds: string[];
}

export async function stageMultipleImages({
  files,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
  removeFurniture,
}: StageMultipleImagesParams & { removeFurniture?: boolean }): Promise<StageMultipleImagesResponse> {
  if (!files || files.length === 0) {
    throw new ImageProcessingError(
      ImageErrorCode.NO_FILE_PROVIDED,
      ErrorMessages[ImageErrorCode.NO_FILE_PROVIDED]
    );
  }

  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("roomType", roomType);
    formData.append("stagingStyle", stagingStyle);
    if (prompt) formData.append("prompt", prompt);
    if (typeof removeFurniture !== 'undefined') formData.append("removeFurniture", String(removeFurniture));

    const response = await axios.post(
      `${API_BASE_URL}/images/multiple-generate`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
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
  filename: string;
  url: string;
  type: "original" | "staged";
  createdAt: string;
  size: number;
}

export interface PairedUpload {
  original: UploadFile;
  staged: UploadFile | null;
  createdAt: string;
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
