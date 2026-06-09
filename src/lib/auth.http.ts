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

        if (hasAuthMarker(requestHeaders) && (status === 401 || status === 403)) {
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