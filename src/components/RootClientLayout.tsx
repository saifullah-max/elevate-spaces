"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setAuth, logout } from "@/store/slices/authSlice";
import {
  AUTH_CHANGED_EVENT,
  getAuthFromStorage,
  clearAuthFromStorage,
  isStoredAuthValid,
  getTokenExpiryTimestamp,
} from "@/lib/auth.storage";
import { installAuthFailureInterceptor } from "@/lib/auth.http";

/**
 * RootClientLayout Component
 * Rehydrates Redux store from localStorage on app initialization
 * This ensures users stay logged in after page refreshes
 */
export function RootClientLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    let logoutTimer: ReturnType<typeof setTimeout> | null = null;

    installAuthFailureInterceptor();

    const clearLogoutTimer = () => {
      if (logoutTimer) {
        clearTimeout(logoutTimer);
        logoutTimer = null;
      }
    };

    const scheduleAutoLogout = (token: string) => {
      const expiryTs = getTokenExpiryTimestamp(token);
      if (!expiryTs) {
        return;
      }

      const msUntilExpiry = expiryTs - Date.now();
      if (msUntilExpiry <= 0) {
        clearAuthFromStorage();
        dispatch(logout());
        return;
      }

      clearLogoutTimer();
      logoutTimer = setTimeout(() => {
        clearAuthFromStorage();
        dispatch(logout());
      }, msUntilExpiry);
    };

    const rehydrateAuth = () => {
      const storedAuth = getAuthFromStorage();

      if (storedAuth && isStoredAuthValid()) {
        dispatch(setAuth({
          user: storedAuth.user,
          token: storedAuth.token,
        }));
        scheduleAutoLogout(storedAuth.token);
      } else {
        clearLogoutTimer();
        if (storedAuth) {
          clearAuthFromStorage();
        }
        dispatch(logout());
      }
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (!event.key || event.key === "elevate_spaces_auth") {
        rehydrateAuth();
      }
    };

    const handleAuthChanged = () => {
      rehydrateAuth();
    };

    rehydrateAuth();

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      clearLogoutTimer();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [dispatch]);

  return <>{children}</>;
}
