"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, Bolt, FileText, Lock, LogIn, Shield, X } from "lucide-react";
import { signIn, signUp } from "@/services/auth.service";
import { saveAuthToStorage, AUTH_CHANGED_EVENT } from "@/lib/auth.storage";
import { isAccountExistsError, isAccountNotFoundError } from "@/lib/authModal";

type View = "signup" | "login" | "confirm";
type PendingAgreementAction = "none" | "google-signup" | "email-signup";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialView?: View;
  /** Pre-filled error to show when modal opens (e.g. OAuth failure). */
  initialError?: string | null;
  /** When true, renders full-page (no backdrop dim, no close button). */
  fullPage?: boolean;
}

const API_BASE = (process.env.NEXT_PUBLIC_BACKEND_API || "").replace(/\/api\/?$/i, "");

function googleAuthUrl(intent: "signin" | "signup", agreementsAccepted = false) {
  const query = new URLSearchParams({ intent });
  if (agreementsAccepted) query.set("agreementsAccepted", "true");
  return `${API_BASE}/api/auth/google?${query.toString()}`;
}

export default function AuthGateModal({
  open,
  onClose,
  onSuccess,
  initialView = "signup",
  initialError = null,
  fullPage = false,
}: Props) {
  const [view, setView] = useState<View>(initialView);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(initialError);
  const [confirmEmail, setConfirmEmail] = useState<string>("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [termsModalOpen, setTermsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAgreementAction>("none");

  useEffect(() => {
    if (open) {
      setView(initialView);
      setEmail("");
      setPassword("");
      setError(initialError ?? null);
      setSubmitting(false);
      setAcceptTerms(false);
      setMarketingOptIn(false);
      setTermsModalOpen(false);
      setPendingAction("none");
    }
  }, [open, initialView, initialError]);

  useEffect(() => {
    if (!open || fullPage) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose, fullPage]);

  if (!open) return null;

  const finishAuth = (user: any, token: string) => {
    saveAuthToStorage(user, token);
    window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    onSuccess?.();
    onClose();
  };

  const performEmailSignUp = async () => {
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signUp({
        email,
        password,
        name: email.split("@")[0],
        fromDemoBonus: true,
        registrationAgreements: {
          acceptTermsAndPrivacy: true,
          confirmAgeAndCapacity: true,
          confirmUploadRights: true,
          acknowledgeAiLimitations: true,
          acknowledgeCreditsPolicy: true,
          acceptArbitrationWaiver: true,
          acknowledgePhotographerDisclaimer: true,
          promotionalCommunicationsOptIn: marketingOptIn,
        } as any,
      });
      if (result?.requiresEmailVerification) {
        setConfirmEmail(email);
        setView("confirm");
      } else if ((result as any)?.token && (result as any)?.user) {
        finishAuth((result as any).user, (result as any).token);
      }
    } catch (err: any) {
      setError(err?.message || "Sign up failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startGoogleSignUp = () => {
    window.location.href = googleAuthUrl("signup", true);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!acceptTerms) {
      setPendingAction("email-signup");
      setTermsModalOpen(true);
      return;
    }
    void performEmailSignUp();
  };

  const handleGoogleSignUp = () => {
    if (!acceptTerms) {
      setPendingAction("google-signup");
      setTermsModalOpen(true);
      return;
    }
    startGoogleSignUp();
  };

  const handleConfirmTerms = () => {
    if (!acceptTerms) return;
    const action = pendingAction;
    setTermsModalOpen(false);
    setPendingAction("none");
    if (action === "email-signup") {
      void performEmailSignUp();
    } else if (action === "google-signup") {
      startGoogleSignUp();
    }
  };

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    try {
      const result = await signIn({ email, password });
      if (result?.token && result?.user) {
        finishAuth(result.user, result.token);
      } else {
        setError("Invalid response from server");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div
      className={
        fullPage
          ? "min-h-screen bg-cream-50 flex items-center justify-center px-4 py-10"
          : "fixed inset-0 bg-brand-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      }
      role="dialog"
      aria-modal={!fullPage}
      onClick={fullPage ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-xl"
      >
        {!fullPage && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {view === "signup" && (
          <>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-500 mx-auto flex items-center justify-center mb-4">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-900 mb-2">
                Create your account
              </h3>
              <p className="text-sm text-cream-800/60 mb-4">
                Sign up to claim your free credits &amp; download master-grade HD exports
                immediately.
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-brand-500 font-medium mb-6">
                <span className="inline-flex items-center gap-1">
                  <Shield className="w-3 h-3" /> No credit card
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bolt className="w-3 h-3" /> Instant 10 credits
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              className="w-full border border-cream-200 hover:bg-cream-50 rounded-lg py-2.5 text-sm font-semibold text-brand-900 flex items-center justify-center gap-2 transition-colors mb-4"
            >
              <GoogleGlyph /> Continue with Google Account
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-cream-200" />
              <span className="text-[10px] font-semibold text-cream-800/40 uppercase tracking-wider">
                Or sign up with email
              </span>
              <div className="flex-1 h-px bg-cream-200" />
            </div>

            <form onSubmit={handleSignUp}>
              <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
                Professional email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@brokerage.com"
                className="w-full border border-cream-200 rounded-lg px-4 py-2.5 text-sm bg-cream-50 mb-3"
              />
              <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full border border-cream-200 rounded-lg px-4 py-2.5 text-sm bg-cream-50 mb-3"
              />

              <div className="flex items-center justify-between mb-4 text-[11px]">
                {acceptTerms ? (
                  <span className="inline-flex items-center gap-1 text-accent-600 font-semibold">
                    <Shield className="w-3 h-3" /> Terms accepted
                  </span>
                ) : (
                  <span className="text-cream-800/50">
                    Required before continuing.
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setPendingAction("none");
                    setTermsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-accent-600 hover:text-accent-700 font-semibold hover:underline"
                >
                  <FileText className="w-3 h-3" /> View terms &amp; agreements
                </button>
              </div>

              {error && (
                <div className="mb-3 -mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 space-y-1.5">
                  <p>{error}</p>
                  {isAccountExistsError(error) && (
                    <button
                      type="button"
                      onClick={() => {
                        setView("login");
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-brand-500 hover:underline"
                    >
                      Log in instead →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? "Creating…" : (
                  <>
                    Unlock 10 Free Staging Credits <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-cream-800/50 mt-4">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("login");
                  setError(null);
                }}
                className="text-brand-500 font-semibold hover:underline"
              >
                Log in
              </button>
            </p>
          </>
        )}

        {view === "login" && (
          <>
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-brand-500 mx-auto flex items-center justify-center mb-4">
                <LogIn className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-brand-900 mb-2">
                Log in to your workspace
              </h3>
              <p className="text-sm text-cream-800/60 mb-6">
                Welcome back — pick up right where you left off.
              </p>
            </div>

            <a
              href={googleAuthUrl("signin")}
              className="w-full border border-cream-200 hover:bg-cream-50 rounded-lg py-2.5 text-sm font-semibold text-brand-900 flex items-center justify-center gap-2 transition-colors mb-4"
            >
              <GoogleGlyph /> Continue with Google Account
            </a>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-cream-200" />
              <span className="text-[10px] font-semibold text-cream-800/40 uppercase tracking-wider">
                Or log in with email
              </span>
              <div className="flex-1 h-px bg-cream-200" />
            </div>

            <form onSubmit={handleLogIn}>
              <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@brokerage.com"
                className="w-full border border-cream-200 rounded-lg px-4 py-2.5 text-sm bg-cream-50 mb-3"
              />
              <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full border border-cream-200 rounded-lg px-4 py-2.5 text-sm bg-cream-50 mb-4"
              />

              {error && (
                <div className="mb-3 -mt-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 space-y-1.5">
                  <p>{error}</p>
                  {isAccountNotFoundError(error) && (
                    <button
                      type="button"
                      onClick={() => {
                        setView("signup");
                        setError(null);
                      }}
                      className="inline-flex items-center gap-1 font-semibold text-brand-500 hover:underline"
                    >
                      Create an account →
                    </button>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold py-2.5 rounded-lg transition-colors"
              >
                {submitting ? "Signing in…" : "Log In"}
              </button>
            </form>

            <p className="text-center text-xs text-cream-800/50 mt-4">
              New here?{" "}
              <button
                type="button"
                onClick={() => {
                  setView("signup");
                  setError(null);
                }}
                className="text-brand-500 font-semibold hover:underline"
              >
                Create an account
              </button>
            </p>
          </>
        )}

        {view === "confirm" && (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-brand-100 mx-auto flex items-center justify-center mb-4">
              <Lock className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="font-display text-xl font-bold text-brand-900 mb-2">
              Confirm your email
            </h3>
            <p className="text-sm text-cream-800/60 mb-1">We sent a confirmation link to</p>
            <p className="text-sm font-semibold text-brand-900 mb-4">{confirmEmail}</p>
            <p className="text-xs text-cream-800/50 mb-6">
              Click the link in that email to activate your account and unlock your free credits.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold py-2.5 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {termsModalOpen && view === "signup" && (
        <div
          className="fixed inset-0 bg-brand-900/60 backdrop-blur-sm z-[60] flex items-center justify-center px-4 py-6 overflow-y-auto"
          onClick={() => setTermsModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-xl"
          >
            <button
              type="button"
              onClick={() => setTermsModalOpen(false)}
              className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="font-display text-lg font-bold text-brand-900 mb-1">
              At Account Registration
            </h3>
            <p className="text-xs text-cream-800/60 mb-5">
              Please review and accept the required agreements to create your account.
            </p>

            <label className="flex items-start gap-2.5 text-[12px] text-cream-800/80 leading-snug mb-4">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-500 focus:ring-brand-500 shrink-0"
              />
              <span>
                By continuing, I confirm I am 18+, have the right to upload content, and agree
                to the{" "}
                <a href="/terms" target="_blank" className="text-accent-600 hover:underline font-semibold">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="/privacy" target="_blank" className="text-accent-600 hover:underline font-semibold">
                  Privacy Policy
                </a>
                . AI-generated results are for visualization purposes only.{" "}
                <span className="text-red-500">*</span>
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-[12px] text-cream-800/80 leading-snug mb-6">
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={(e) => setMarketingOptIn(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-cream-300 text-brand-500 focus:ring-brand-500 shrink-0"
              />
              <span>
                Send me staging tips, product updates, and inspiration.{" "}
                <span className="inline-block ml-1 px-2 py-0.5 rounded-full bg-cream-100 text-cream-800/60 text-[10px] font-semibold">
                  Optional
                </span>
              </span>
            </label>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setTermsModalOpen(false)}
                className="border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmTerms}
                disabled={!acceptTerms}
                className="bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Confirm and continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (fullPage || typeof document === "undefined") return content;
  return createPortal(content, document.body);
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.7 1.22 9.19 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}
