
import { getAuthFromStorage } from "@/lib/auth.storage";

export const getAuthToken = (): string | null => {
    const auth = getAuthFromStorage();
    return auth?.token || null;
};

export const getAuthHeaders = (): Record<string, string> => {
    const token = getAuthToken();
    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
};
