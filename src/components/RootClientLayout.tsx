"use client";

import { useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { setAuth, logout } from "@/store/slices/authSlice";
import { getAuthFromStorage, clearAuthFromStorage, isStoredAuthValid } from "@/lib/auth.storage";

/**
 * RootClientLayout Component
 * Rehydrates Redux store from localStorage on app initialization
 * This ensures users stay logged in after page refreshes
 */
export function RootClientLayout({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Check if user data exists in localStorage
    const storedAuth = getAuthFromStorage();

    if (storedAuth && isStoredAuthValid()) {
      // Rehydrate Redux store with saved auth data
      dispatch(setAuth({
        user: storedAuth.user,
        token: storedAuth.token,
      }));
    } else if (storedAuth) {
      // Token is expired, clear storage and logout
      clearAuthFromStorage();
      dispatch(logout());
    }
  }, [dispatch]);

  return <>{children}</>;
}
