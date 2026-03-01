"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
    initGuestSession,
    getGuestStatus,
    getDeviceIdFromCookie,
    setDeviceIdCookie,
    GuestStatusData,
} from "@/services/guest.service";

interface UseGuestTrackingReturn {
    deviceId: string | null;
    usageCount: number;
    limit: number;
    limitReached: boolean;
    blocked: boolean;
    loading: boolean;
    error: string | null;
    isInitialized: boolean;
    refresh: () => Promise<void>;
}

/**
 * Hook for managing guest (non-authenticated) user tracking
 * - Initializes guest session on mount
 * - Uses cookies for device ID (avoids localStorage hydration issues)
 * - Syncs state with backend database
 */
export function useGuestTracking(): UseGuestTrackingReturn {
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [usageCount, setUsageCount] = useState<number>(0);
    const [limit, setLimit] = useState<number>(10);
    const [limitReached, setLimitReached] = useState<boolean>(false);
    const [blocked, setBlocked] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isInitialized, setIsInitialized] = useState<boolean>(false);

    // Track if we've initialized to prevent duplicate calls
    const hasInitialized = useRef(false);

    const updateStateFromData = useCallback((data: GuestStatusData) => {
        setDeviceId(data.deviceId!);
        setUsageCount(data.usageCount);
        setLimit(data.limit);
        setLimitReached(data.limitReached);
        setBlocked(data.blocked);

        // Also set the cookie on client side for fallback
        if (data.deviceId) {
            setDeviceIdCookie(data.deviceId);
        }
    }, []);

    const initializeGuest = useCallback(async () => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        setLoading(true);
        setError(null);

        try {
            // Try to get existing device ID from cookie
            const existingDeviceId = getDeviceIdFromCookie();

            // Initialize session with backend
            const response = await initGuestSession(existingDeviceId || undefined);
            console.log("data:", response)

            if (response.success && response.data) {
                updateStateFromData(response.data);
                setIsInitialized(true);
            } else {
                setError(response.error?.message || "Failed to initialize guest session");
            }
        } catch (err) {
            console.error("[useGuestTracking] Init error:", err);
            setError("Failed to initialize guest tracking");
        } finally {
            setLoading(false);
        }
    }, [updateStateFromData]);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const currentDeviceId = deviceId || getDeviceIdFromCookie();
            const response = await getGuestStatus(currentDeviceId || undefined);

            if (response.success && response.data) {
                updateStateFromData(response.data);
            } else {
                setError(response.error?.message || "Failed to refresh guest status");
            }
        } catch (err) {
            console.error("[useGuestTracking] Refresh error:", err);
            setError("Failed to refresh guest tracking");
        } finally {
            setLoading(false);
        }
    }, [deviceId, updateStateFromData]);

    // Initialize on mount
    useEffect(() => {
        initializeGuest();
    }, [initializeGuest]);

    // Listen for storage events from other tabs (cross-tab sync)
    useEffect(() => {
        const handleStorageChange = () => {
            // Re-fetch status when another tab might have updated
            if (isInitialized) {
                refresh();
            }
        };

        // Use visibilitychange to refresh when tab becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && isInitialized) {
                refresh();
            }
        };

        window.addEventListener("storage", handleStorageChange);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [isInitialized, refresh]);

    return {
        deviceId,
        usageCount,
        limit,
        limitReached,
        blocked,
        loading,
        error,
        isInitialized,
        refresh,
    };
}
