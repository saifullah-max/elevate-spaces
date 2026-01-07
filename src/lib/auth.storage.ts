/**
 * Auth Storage Utilities
 * Handles persistence of auth data to localStorage
 */

import type { User } from "@/store/slices/authSlice";

const AUTH_STORAGE_KEY = "elevate_spaces_auth";
const TOKEN_STORAGE_KEY = "elevate_spaces_token";

export interface StoredAuthData {
  user: User;
  token: string;
  timestamp: number;
}

/**
 * Save auth data to localStorage
 */
export const saveAuthToStorage = (user: User, token: string): void => {
  try {
    const authData: StoredAuthData = {
      user,
      token,
      timestamp: Date.now(),
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authData));
  } catch (error) {
    console.error("Failed to save auth to localStorage:", error);
  }
};

/**
 * Retrieve auth data from localStorage
 */
export const getAuthFromStorage = (): StoredAuthData | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const authData: StoredAuthData = JSON.parse(stored);
    return authData;
  } catch (error) {
    console.error("Failed to retrieve auth from localStorage:", error);
    return null;
  }
};

/**
 * Clear auth data from localStorage
 */
export const clearAuthFromStorage = (): void => {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear auth from localStorage:", error);
  }
};

/**
 * Check if stored auth is still valid (optional: add expiry check)
 */
export const isStoredAuthValid = (): boolean => {
  const authData = getAuthFromStorage();
  if (!authData) return false;

  // Optional: Check if token is older than 24 hours
  const MAX_AUTH_AGE = 24 * 60 * 60 * 1000; // 24 hours
  const age = Date.now() - authData.timestamp;

  return age < MAX_AUTH_AGE;
};
