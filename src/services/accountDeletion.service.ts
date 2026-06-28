import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

function requireApiBase(): string {
  if (!API_BASE_URL) throw new Error("Backend API URL is not configured");
  return API_BASE_URL;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export async function requestAccountDeletion(): Promise<{ message: string }> {
  try {
    const response = await axios.post<{ success: boolean; message: string }>(
      `${requireApiBase()}/account/deletion/request`,
      {},
      { headers: getAuthHeaders() }
    );
    return { message: response.data.message };
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to start account deletion"));
  }
}

export async function verifyAccountDeletion(code: string): Promise<{ purgeAt: string; deadlineHuman: string }> {
  try {
    const response = await axios.post<{ success: boolean; data: { purgeAt: string; deadlineHuman: string } }>(
      `${requireApiBase()}/account/deletion/verify`,
      { code },
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to verify deletion"));
  }
}

export interface PendingDeletionUser {
  id: string;
  email: string;
  name: string | null;
  deletion_requested_at: string;
  deletion_purge_at: string;
}

export async function listPendingDeletions(): Promise<PendingDeletionUser[]> {
  try {
    const response = await axios.get<{ success: boolean; data: PendingDeletionUser[] }>(
      `${requireApiBase()}/account/deletion/admin/pending`,
      { headers: getAuthHeaders() }
    );
    return response.data.data || [];
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to load pending deletions"));
  }
}

export async function revertAccountDeletion(userId: string): Promise<void> {
  try {
    await axios.post(
      `${requireApiBase()}/account/deletion/admin/${userId}/revert`,
      {},
      { headers: getAuthHeaders() }
    );
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to revert deletion"));
  }
}
