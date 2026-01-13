/**
 * Image error codes matching the backend error types
 */
export enum ImageErrorCode {
  // Upload errors
  NO_FILE_PROVIDED = "NO_FILE_PROVIDED",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  FILE_READ_ERROR = "FILE_READ_ERROR",

  // Validation errors
  INVALID_ROOM_TYPE = "INVALID_ROOM_TYPE",
  INVALID_STAGING_STYLE = "INVALID_STAGING_STYLE",

  // AI Processing errors
  AI_SERVICE_UNAVAILABLE = "AI_SERVICE_UNAVAILABLE",
  AI_QUOTA_EXCEEDED = "AI_QUOTA_EXCEEDED",
  AI_CONTENT_BLOCKED = "AI_CONTENT_BLOCKED",
  AI_PROCESSING_FAILED = "AI_PROCESSING_FAILED",
  AI_NO_IMAGE_GENERATED = "AI_NO_IMAGE_GENERATED",
  AI_TIMEOUT = "AI_TIMEOUT",

  // Storage errors
  STORAGE_UNAVAILABLE = "STORAGE_UNAVAILABLE",
  STORAGE_UPLOAD_FAILED = "STORAGE_UPLOAD_FAILED",
  STORAGE_BUCKET_ERROR = "STORAGE_BUCKET_ERROR",

  // General errors
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
  NETWORK_ERROR = "NETWORK_ERROR",
}

/**
 * Error messages for user-facing display
 */
export const ErrorMessages: Record<ImageErrorCode, string> = {
  [ImageErrorCode.NO_FILE_PROVIDED]: "Please upload an image file to continue.",
  [ImageErrorCode.INVALID_FILE_TYPE]:
    "Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.",
  [ImageErrorCode.FILE_TOO_LARGE]: "File is too large. Maximum size is 10MB.",
  [ImageErrorCode.FILE_READ_ERROR]:
    "Unable to read the uploaded file. Please try again.",

  [ImageErrorCode.INVALID_ROOM_TYPE]:
    "Invalid room type selected. Please choose a valid room type.",
  [ImageErrorCode.INVALID_STAGING_STYLE]:
    "Invalid staging style selected. Please choose a valid style.",

  [ImageErrorCode.AI_SERVICE_UNAVAILABLE]:
    "AI staging service is temporarily unavailable. Please try again later.",
  [ImageErrorCode.AI_QUOTA_EXCEEDED]:
    "AI service quota exceeded. Please try again in a few minutes.",
  [ImageErrorCode.AI_CONTENT_BLOCKED]:
    "The image could not be processed due to content restrictions. Please upload a different image.",
  [ImageErrorCode.AI_PROCESSING_FAILED]:
    "Failed to process the image. Please try again with a different image.",
  [ImageErrorCode.AI_NO_IMAGE_GENERATED]:
    "Unable to generate a staged image. Please try with a clearer photo of the room.",
  [ImageErrorCode.AI_TIMEOUT]: "Image processing timed out. Please try again.",

  [ImageErrorCode.STORAGE_UNAVAILABLE]:
    "Storage service is temporarily unavailable. Please try again later.",
  [ImageErrorCode.STORAGE_UPLOAD_FAILED]:
    "Failed to save the processed images. Please try again.",
  [ImageErrorCode.STORAGE_BUCKET_ERROR]:
    "Storage configuration error. Please contact support.",

  [ImageErrorCode.UNKNOWN_ERROR]:
    "An unexpected error occurred. Please try again.",
  [ImageErrorCode.NETWORK_ERROR]:
    "Network error. Please check your connection and try again.",
};

/**
 * Valid room types for staging
 */
export const VALID_ROOM_TYPES = [
  "living-room",
  "bedroom",
  "kitchen",
  "bathroom",
  "dining-room",
  "office",
  "outdoor",
  "garage",
  "basement",
  "attic",
  "hallway",
  "other",
] as const;

export type RoomType = (typeof VALID_ROOM_TYPES)[number];

/**
 * Valid staging styles
 */
export const VALID_STAGING_STYLES = [
  "modern",
  "contemporary",
  "minimalist",
  "scandinavian",
  "industrial",
  "traditional",
  "transitional",
  "farmhouse",
  "coastal",
  "bohemian",
  "mid-century",
  "luxury",
] as const;

export type StagingStyle = (typeof VALID_STAGING_STYLES)[number];

/**
 * Backend error response structure
 */
export interface BackendErrorResponse {
  success: false;
  error: {
    code: ImageErrorCode;
    message: string;
    details?: string;
  };
}

/**
 * Custom error class for image processing errors
 */
export class ImageProcessingError extends Error {
  public code: ImageErrorCode;
  public userMessage: string;
  public details?: string;

  constructor(code: ImageErrorCode, userMessage?: string, details?: string) {
    super(userMessage || ErrorMessages[code]);
    this.name = "ImageProcessingError";
    this.code = code;
    this.userMessage = userMessage || ErrorMessages[code];
    this.details = details;
  }
}

/**
 * Parse error from backend response or axios error
 */
export function parseApiError(error: unknown): ImageProcessingError {
  // Handle axios errors
  if (isAxiosError(error)) {
    // Network error (no response)
    if (!error.response) {
      return new ImageProcessingError(
        ImageErrorCode.NETWORK_ERROR,
        ErrorMessages[ImageErrorCode.NETWORK_ERROR]
      );
    }

    // Backend returned structured error
    const data = error.response.data as BackendErrorResponse | undefined;
    if (data?.error?.code) {
      return new ImageProcessingError(
        data.error.code,
        data.error.message,
        data.error.details
      );
    }

    // Generic HTTP error
    const status = error.response.status;
    if (status === 429) {
      return new ImageProcessingError(ImageErrorCode.AI_QUOTA_EXCEEDED);
    }
    if (status === 503) {
      return new ImageProcessingError(ImageErrorCode.AI_SERVICE_UNAVAILABLE);
    }
    if (status === 504) {
      return new ImageProcessingError(ImageErrorCode.AI_TIMEOUT);
    }
  }

  // Handle ImageProcessingError
  if (error instanceof ImageProcessingError) {
    return error;
  }

  // Handle generic errors
  if (error instanceof Error) {
    return new ImageProcessingError(
      ImageErrorCode.UNKNOWN_ERROR,
      error.message || ErrorMessages[ImageErrorCode.UNKNOWN_ERROR]
    );
  }

  return new ImageProcessingError(ImageErrorCode.UNKNOWN_ERROR);
}

/**
 * Type guard for axios errors
 */
function isAxiosError(
  error: unknown
): error is {
  response?: { status: number; data?: unknown };
  message: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    ("response" in error || "request" in error)
  );
}
