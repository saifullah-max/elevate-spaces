import axios from "axios";
import { clearAuthFromStorage } from "@/lib/auth.storage";

let interceptorInstalled = false;

const hasAuthMarker = (headers: unknown): boolean => {
  if (!headers || typeof headers !== "object") {
    return false;
  }

  const normalized = headers as Record<string, unknown>;
  return Boolean(
    normalized.Authorization ||
      normalized.authorization
  );
};

const isBackendApiRequest = (url: string | undefined): boolean => {
  if (!url) return false;
  const apiBase = process.env.NEXT_PUBLIC_BACKEND_API;
  if (!apiBase) return false;

  // Match absolute URLs against the configured backend base, and relative
  // ones only when they start with /api (the in-app fetches use the full
  // backend URL so this mainly guards against false positives).
  try {
    const resolved = new URL(url, window.location.origin);
    const base = new URL(apiBase, window.location.origin);
    return resolved.origin === base.origin && resolved.pathname.startsWith(base.pathname);
  } catch {
    return url.startsWith(apiBase) || url.startsWith("/api");
  }
};

const looksLikeBadToken = (error: import("axios").AxiosError): boolean => {
  const data: any = error.response?.data;
  if (!data) return true; // empty 401 body — assume token is bad

  const code = typeof data.code === "string" ? data.code.toUpperCase() : "";
  const message = typeof data.message === "string"
    ? data.message.toLowerCase()
    : typeof data.error === "string"
      ? data.error.toLowerCase()
      : "";

  if (code.includes("TOKEN") || code === "UNAUTHORIZED") return true;
  if (
    message.includes("invalid or expired token") ||
    message.includes("unauthorized") ||
    message.includes("invalid token") ||
    message.includes("jwt expired") ||
    message.includes("jwt malformed")
  ) {
    return true;
  }

  return false;
};

export const installAuthFailureInterceptor = (): void => {
  if (interceptorInstalled || typeof window === "undefined") {
    return;
  }

  interceptorInstalled = true;

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const requestHeaders = error.config?.headers;
        const requestUrl = error.config?.url;

        // Only force-logout when ALL of these hold:
        //  1. The request actually targeted our backend (third-party 401s
        //     riding through axios must not nuke our session).
        //  2. The request carried an Authorization header (otherwise the
        //     401 isn't about our token).
        //  3. The status is 401 (not 403 — 403 means "your token works but
        //     you lack permission for this resource", clearing auth there
        //     just kicks the user off the app for a missing capability).
        //  4. The response body looks like a token problem (so a controller
        //     returning 401 for a non-auth reason doesn't drop the session).
        if (
          status === 401 &&
          hasAuthMarker(requestHeaders) &&
          isBackendApiRequest(requestUrl) &&
          looksLikeBadToken(error)
        ) {
          clearAuthFromStorage();

          if (window.location.pathname !== "/sign-in") {
            window.location.replace("/sign-in");
          }
        }
      }

      return Promise.reject(error);
    }
  );
};
