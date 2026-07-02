"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";

type BannerType =
  | "new_visitor"
  | "returning_with_credits"
  | "returning_watermarked"
  | "no_credits"
  | null;

interface BannerState {
  showBanner: boolean;
  bannerType: BannerType;
  isNewVisitor: boolean;
  isReturningGuest: boolean;
  creditsRemaining: number;
  freeCleanUploadsUsed: number;
  hasSignedUp: boolean;
}

const BANNER_DISMISSED_KEY = "elevate_banner_dismissed";
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://elevated-spaces-backend.onrender.com";

export default function BonusBanner() {
  const [bannerState, setBannerState] = useState<BannerState | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already dismissed this session
    const wasDismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Fetch banner state from backend
    const fetchBannerState = async () => {
      try {
        const fingerprint = document.cookie
          .split("; ")
          .find((row) => row.startsWith("device_id="))
          ?.split("=")[1];

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (fingerprint) {
          headers["x-fingerprint"] = fingerprint;
        }

        const auth = localStorage.getItem("elevate_spaces_auth");
        if (auth) {
          try {
            const parsed = JSON.parse(auth);
            if (parsed?.token) {
              headers["Authorization"] = `Bearer ${parsed.token}`;
            }
          } catch {}
        }

        const response = await fetch(`${BACKEND_URL}/api/guest/banner-state`, {
          headers,
          credentials: "include",
        });

        if (!response.ok) return;

        const data = await response.json();
        if (data?.success && data?.data) {
          setBannerState(data.data);
        }
      } catch (error) {
        console.error("[BonusBanner] Failed to fetch banner state:", error);
      }
    };

    fetchBannerState();
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, "true");
  };

  const handleSignUp = () => {
    window.location.href = "/sign-up";
  };

  // Don't render until mounted (avoid SSR mismatch)
  if (!mounted) return null;

  // Don't show if dismissed
  if (dismissed) return null;

  // Don't show if no banner state or banner not needed
  if (!bannerState?.showBanner) return null;

  // Don't show if signed up
  if (bannerState.hasSignedUp) return null;

  const getBannerContent = () => {
    switch (bannerState.bannerType) {
      case "new_visitor":
        return {
          message: "Sign up today and get 5 bonus credits free",
          subMessage: "No credit card required — your first 2 stagings are watermark-free",
          cta: "Sign Up Free",
          color: "bg-indigo-600",
          urgent: false,
        };
      case "returning_with_credits":
        return {
          message: "Welcome back! You still have free credits waiting",
          subMessage: "Sign up now to get 5 bonus credits on top of your remaining credits",
          cta: "Sign Up & Claim Credits",
          color: "bg-teal-600",
          urgent: false,
        };
      case "returning_watermarked":
        return {
          message: "Sign up free to remove watermarks and unlock 5 bonus credits",
          subMessage: "You've seen what we can do — take the next step",
          cta: "Sign Up Free",
          color: "bg-indigo-600",
          urgent: false,
        };
      case "no_credits":
        return {
          message: "You've used all your free credits — sign up today to keep staging",
          subMessage: "Plans start at just $29/month with 60 photos included",
          cta: "See Plans",
          color: "bg-slate-800",
          urgent: true,
        };
      default:
        return null;
    }
  };

  const content = getBannerContent();
  if (!content) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 ${content.color} text-white px-4 py-3 shadow-lg`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Sparkles className="w-5 h-5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{content.message}</p>
            <p className="text-xs text-white/80 hidden sm:block">{content.subMessage}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={content.urgent ? () => window.location.href = "/#pricing" : handleSignUp}
            className="bg-white text-indigo-700 text-xs font-bold px-4 py-2 rounded-lg hover:bg-indigo-50 transition whitespace-nowrap"
          >
            {content.cta}
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white transition"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
