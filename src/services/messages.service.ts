import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

function requireApiBase(): string {
  if (!API_BASE_URL) {
    throw new Error("Backend API URL is not configured");
  }
  return API_BASE_URL;
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  return error instanceof Error ? error.message : fallback;
}

export interface MessageUser {
  id: string;
  name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface DirectMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  body: string | null;
  attachments: Array<{ name: string; type: string; size: number; url: string }> | null;
  read_at: string | null;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  peer: MessageUser;
  lastMessage: DirectMessage | null;
  updatedAt: string;
}

export async function getConversations(): Promise<ConversationItem[]> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: ConversationItem[] }>(`${base}/messages/conversations`, {
      headers: getAuthHeaders(),
    });
    return response.data.data || [];
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to load conversations"));
  }
}

export async function getConversationByPeer(peerUserId: string): Promise<{ conversationId: string; peer: MessageUser; messages: DirectMessage[] }> {
  try {
    const base = requireApiBase();
    const response = await axios.get<{ success: boolean; data: { conversationId: string; peer: MessageUser; messages: DirectMessage[] } }>(
      `${base}/messages/conversations/${peerUserId}`,
      { headers: getAuthHeaders() }
    );
    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to load conversation"));
  }
}

export async function sendDirectMessage(data: { peerUserId: string; body?: string; attachments?: File[] }): Promise<DirectMessage> {
  try {
    const base = requireApiBase();
    const formData = new FormData();
    formData.append("peerUserId", data.peerUserId);
    if (data.body?.trim()) formData.append("body", data.body.trim());
    if (data.attachments?.length) {
      data.attachments.forEach((file) => formData.append("attachments", file));
    }

    const response = await axios.post<{ success: boolean; data: DirectMessage }>(`${base}/messages/send`, formData, {
      headers: {
        ...getAuthHeaders(),
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  } catch (error) {
    throw new Error(toErrorMessage(error, "Failed to send message"));
  }
}
