export async function stageImage({
  file,
  prompt,
  roomType = "living-room",
  stagingStyle = "modern",
}: StageImageParams): Promise<StageImageResponse> {
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

    const response = await axios.post(
      `${API_BASE_URL}/images/generate`,
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

export interface RestageImageParams {
  stagedId: string;
  prompt?: string;
  roomType?: RoomType;
  stagingStyle?: StagingStyle;
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
}: RestageImageParams): Promise<RestageImageResponse> {
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
    };
    const response = await axios.post(
      `${API_BASE_URL}/images/restage`,
      payload
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

// ---------- Single Image ----------
export interface StageImageParams {
  file: File;
  prompt?: string;
  roomType?: RoomType;
  stagingStyle?: StagingStyle;
}

export interface StageImageResponse {
  originalImageUrl?: string;
  stagedImageUrl: string;
  stagedId?: string;
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
    formData.append("roomType", roomType);
    formData.append("stagingStyle", stagingStyle);
    if (prompt) formData.append("prompt", prompt);

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

export async function getRecentUploads(
  limit = 10
): Promise<RecentUploadsResponse> {
  try {
    const response = await axios.get(`${API_BASE_URL}/images/recent`, {
      params: { limit },
    });

    if (response.data && response.data.success) {
      return response.data.data;
    }

    throw new ImageProcessingError(
      response.data?.error?.code || ImageErrorCode.UNKNOWN_ERROR,
      response.data?.error?.message ||
        ErrorMessages[ImageErrorCode.UNKNOWN_ERROR],
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
