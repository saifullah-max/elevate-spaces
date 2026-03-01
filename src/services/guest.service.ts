const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000/api";

export interface GuestStatusData {
    deviceId?: string | null;
    userId?: string;
    usageCount: number;
    limit: number;
    limitReached: boolean;
    blocked: boolean;
    isNewGuest?: boolean;
    isDemo?: boolean;
    hasPurchasedCredits?: boolean;
    remainingDemoCredits?: number;
    exists?: boolean;
    resetInfo?: string;
    lastUsedAt?: string;
    lastResetAt?: string;
}

export interface GuestResponse {
    success: boolean;
    data?: GuestStatusData;
    error?: { message: string };
}

/**
 * Initialize demo tracking session - call this on app load
 * Creates a new guest record if needed, or returns existing state
 * For logged-in users, returns user_demo_tracking
 * For guests, returns guest_tracking
 */
export async function initGuestSession(deviceId?: string): Promise<GuestResponse> {
    console.log('[guest.service] initGuestSession called with deviceId:', deviceId);
    console.log('[guest.service] API_BASE_URL:', API_BASE_URL);
    
    try {
        const url = `${API_BASE_URL}/guest/init`;
        console.log('[guest.service] Fetching:', url);
        
        // Get token from localStorage if available
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
        
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(deviceId ? { "x-fingerprint": deviceId } : {}),
            },
            credentials: "include", // Important: Include cookies
        });

        console.log('[guest.service] Response status:', response.status);
        const data = await response.json();
        console.log("[guest.service] Response data:", data);
        return data;
    } catch (error) {
        console.error("[initGuestSession] Error:", error);
        return {
            success: false,
            error: { message: "Failed to initialize guest session" },
        };
    }
}

/**
 * Get current demo tracking status without side effects
 * For logged-in users, returns user_demo_tracking
 * For guests, returns guest_tracking
 */
export async function getGuestStatus(deviceId?: string): Promise<GuestResponse> {
    try {
        // Get token from localStorage if available
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
        
        const response = await fetch(`${API_BASE_URL}/guest/status`, {
            method: "GET",
            headers: {
                ...(token ? { "Authorization": `Bearer ${token}` } : {}),
                ...(deviceId ? { "x-fingerprint": deviceId } : {}),
            },
            credentials: "include", // Important: Include cookies
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("[getGuestStatus] Error:", error);
        return {
            success: false,
            error: { message: "Failed to get guest status" },
        };
    }
}

/**
 * Cookie utility functions
 */
export function getDeviceIdFromCookie(): string | null {
    if (typeof document === "undefined") return null;

    const match = document.cookie.match(/(?:^|;\s*)device_id=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : null;
}

export function setDeviceIdCookie(deviceId: string): void {
    if (typeof document === "undefined") return;

    const expires = new Date();
    expires.setDate(expires.getDate() + 30); // 30 days

    document.cookie = `device_id=${encodeURIComponent(deviceId)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
}
