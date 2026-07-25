/**
 * Auth Storage Utilities
 * Handles persistence of auth data to localStorage
 */

import type { User } from "@/store/slices/authSlice";

const AUTH_STORAGE_KEY = "elevate_spaces_auth";
const TOKEN_STORAGE_KEY = "elevate_spaces_token";
export const AUTH_CHANGED_EVENT = "elevate-spaces-auth-changed";

export interface StoredAuthData {
  user: User;
  token: string;
  timestamp: number;
}

type JwtPayload = {
  exp?: number;
};

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
};

export const getTokenExpiryTimestamp = (token: string): number | null => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp || typeof payload.exp !== "number") {
    return null;
  }

  return payload.exp * 1000;
};

export const isTokenExpired = (token: string, skewMs: number = 5000): boolean => {
  const expiryTs = getTokenExpiryTimestamp(token);
  if (!expiryTs) {
    return false;
  }

  return Date.now() >= expiryTs - skewMs;
};

/**
 * Save auth data to localStorage
 */
export const saveAuthToStorage = (user: User, token: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    const authData: StoredAuthData = {
      user,
      token,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch (error) {
  }
};

/**
 * Retrieve auth data from localStorage
 */
export const getAuthFromStorage = (): StoredAuthData | null => {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const authData: StoredAuthData = JSON.parse(stored);

    if (isTokenExpired(authData.token)) {
      clearAuthFromStorage();
      return null;
    }

    return authData;
  } catch (error) {
    return null;
  }
};

/**
 * Clear auth data from localStorage
 */
export const clearAuthFromStorage = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    // Clear admin redirect flag so they get redirected again on next login
    sessionStorage.removeItem("adminInitialRedirect");
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch (error) {
  }
};

/**
 * Update only the stored user object while preserving token/timestamp.
 */
export const updateStoredAuthUser = (user: User): void => {
  if (typeof window === "undefined") return;

  try {
    const existing = getAuthFromStorage();
    if (!existing) return;

    const nextAuthData: StoredAuthData = {
      ...existing,
      user,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(nextAuthData));
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
  } catch (error) {
  }
};

/**
 * Check if stored auth is still valid (optional: add expiry check)
 */
export const isStoredAuthValid = (): boolean => {
  if (typeof window === "undefined") return false;
  
  const authData = getAuthFromStorage();
  if (!authData) return false;

  if (isTokenExpired(authData.token)) {
    return false;
  }

  return true;
};
