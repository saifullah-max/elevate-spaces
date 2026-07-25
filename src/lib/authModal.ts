export const AUTH_MODAL_OPEN_EVENT = "auth-modal:open";
const AUTH_MODAL_PENDING_KEY = "elevate_spaces_pending_auth_modal";

export type AuthModalView = "login" | "signup";

export interface AuthModalOpenDetail {
  view: AuthModalView;
  error?: string | null;
}

export const OAUTH_ERROR_MAP: Record<string, string> = {
  oauth_account_not_found: "No account found for that Google user. Please sign up first.",
  oauth_agreements_required:
    "You must accept the registration agreements before signing up with Google.",
  oauth_email_taken: "An account with that email already exists. Please log in instead.",
  auth_failed: "Google authentication failed. Please try again.",
  server_error: "Google authentication failed due to a server error. Please try again.",
  oauth_failed: "Google authentication failed. Please try again.",
};

/**
 * Fire an event to open the auth modal AND persist the request to sessionStorage.
 * The sessionStorage fallback is essential because when this is called from the
 * /sign-in or /sign-up trampoline, the CustomEvent is dispatched before the
 * Navbar on the destination route has attached its listener — the event is lost.
 * Navbar drains the sessionStorage on mount.
 */
export function openAuthModal(view: AuthModalView, error?: string | null) {
  if (typeof window === "undefined") return;
  const detail: AuthModalOpenDetail = { view, error: error ?? null };
  try {
    sessionStorage.setItem(AUTH_MODAL_PENDING_KEY, JSON.stringify(detail));
  } catch {}
  window.dispatchEvent(new CustomEvent(AUTH_MODAL_OPEN_EVENT, { detail }));
}

/** Read (and clear) a pending auth-modal request stashed by openAuthModal. */
export function consumePendingAuthModal(): AuthModalOpenDetail | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(AUTH_MODAL_PENDING_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(AUTH_MODAL_PENDING_KEY);
    const parsed = JSON.parse(raw) as AuthModalOpenDetail;
    if (parsed?.view !== "login" && parsed?.view !== "signup") return null;
    return parsed;
  } catch {
    return null;
  }
}

const ACCOUNT_NOT_FOUND_PATTERNS = [
  /no.*account/i,
  /account.*not.*found/i,
  /user.*not.*found/i,
  /no.*user/i,
  /please.*sign.*up/i,
  /invalid.*credentials/i,
  /email.*not.*registered/i,
];

const ACCOUNT_EXISTS_PATTERNS = [
  /already.*exists/i,
  /email.*taken/i,
  /already.*registered/i,
  /already.*have.*account/i,
  /email.*in.*use/i,
];

export function isAccountNotFoundError(message: string | null | undefined): boolean {
  if (!message) return false;
  return ACCOUNT_NOT_FOUND_PATTERNS.some((r) => r.test(message));
}

export function isAccountExistsError(message: string | null | undefined): boolean {
  if (!message) return false;
  return ACCOUNT_EXISTS_PATTERNS.some((r) => r.test(message));
}
