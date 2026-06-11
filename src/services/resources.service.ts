import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000/api";

export interface ResourceItem {
  id: string;
  slug: string;
  title: string;
  content_html: string | null;
  youtube_url: string | null;
  pdf_filename: string | null;
  pdf_mime: string | null;
  video_filename: string | null;
  video_mime: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveResourceOptions {
  onUploadProgress?: (percent: number) => void;
}

export async function getResources(): Promise<ResourceItem[]> {
  const response = await fetch(`${API_BASE_URL}/resources`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to load resources");
  }

  return data.data || [];
}

export async function getResource(slug: string): Promise<ResourceItem> {
  const response = await fetch(`${API_BASE_URL}/resources/${slug}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to load resource");
  }

  return data.data;
}

export async function saveResource(
  slug: string,
  payload: { title: string; contentHtml: string; youtubeUrl?: string; pdf?: File | null; removePdf?: boolean },
  options?: SaveResourceOptions
): Promise<ResourceItem> {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("contentHtml", payload.contentHtml);
  formData.append("youtubeUrl", payload.youtubeUrl?.trim() || "");
  formData.append("removePdf", payload.removePdf ? "true" : "false");

  if (payload.pdf) {
    formData.append("pdf", payload.pdf);
  }

  try {
    const response = await axios.put(`${API_BASE_URL}/resources/${slug}`, formData, {
      headers: {
        ...getAuthHeaders(),
      },
      onUploadProgress: (progressEvent) => {
        if (!options?.onUploadProgress || !progressEvent.total) return;
        const percent = Math.min(100, Math.round((progressEvent.loaded * 100) / progressEvent.total));
        options.onUploadProgress(percent);
      },
    });

    return response.data?.data;
  } catch (error: any) {
    const message = error?.response?.data?.message || "Failed to save resource";
    throw new Error(message);
  }
}

export function getResourceAssetUrl(slug: string, kind: "pdf" | "video" = "pdf") {
  return `${API_BASE_URL}/resources/${slug}/${kind}`;
}
