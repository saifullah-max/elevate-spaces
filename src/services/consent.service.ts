import axios from 'axios';
import { getAuthHeaders } from '@/helpers/auth.helpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export async function recordAiGenerationConsent(params: {
  name?: string | null;
  email?: string | null;
  deviceId?: string | null;
  timezone?: string;
  language?: string;
  acknowledgedAt: string;
}): Promise<{ success: boolean; message: string }> {
  if (!API_BASE_URL) {
    throw new Error('Backend API URL is not configured');
  }

  const response = await axios.post(
    `${API_BASE_URL}/consents/ai-generation`,
    params,
    { headers: getAuthHeaders() }
  );

  return response.data;
}