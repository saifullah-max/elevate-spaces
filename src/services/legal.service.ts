import { getAuthHeaders } from "@/helpers/auth.helpers";
import type { LegalDocumentSlug } from "@/lib/legal-documents";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000/api";

export interface LegalDocument {
  slug: LegalDocumentSlug;
  title: string;
  description: string;
  contentHtml: string;
  updatedAt: string;
  updatedBy: string | null;
}

export async function getLegalDocuments(): Promise<LegalDocument[]> {
  const response = await fetch(`${API_BASE_URL}/legal-documents`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to load legal documents");
  }

  return data.data || [];
}

export async function getLegalDocument(slug: LegalDocumentSlug): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/legal-documents/${slug}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to load legal document");
  }

  return data.data;
}

export async function saveLegalDocument(
  slug: LegalDocumentSlug,
  payload: Pick<LegalDocument, "title" | "description" | "contentHtml">
): Promise<LegalDocument> {
  const response = await fetch(`${API_BASE_URL}/legal-documents/${slug}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Failed to save legal document");
  }

  return data.data;
}
