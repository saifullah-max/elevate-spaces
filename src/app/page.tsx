"use client";
import { Sparkles } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import "./globals.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import Demo from "@/components/demo";
import RecentUploads from "@/components/recent-uploads";
import Services from "@/components/services";
import Pricing from "@/components/pricing";
import AdminAutoRedirect from "./admin-redirect";
import { ResourcesOnboardingPopup } from "@/components/ResourcesOnboardingPopup";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { getGuestStatus } from "@/services/guest.service";

const Footer = dynamic(() => import("@/components/footer"), { ssr: false });
const RESOURCE_BANNER_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showResourcesBanner, setShowResourcesBanner] = useState(false);
  const [hasFreeDemoCredits, setHasFreeDemoCredits] = useState(false);
  const [heroCreditCount, setHeroCreditCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = getAuthFromStorage();
    const loggedIn = Boolean(auth?.token);
    setIsLoggedIn(loggedIn);

    const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3003";

    if (!loggedIn) {
      (async () => {
        try {
          const data = await getGuestStatus();
          const createdAt = data?.data?.lastResetAt || null;
          if (createdAt) {
            const ts = new Date(createdAt).getTime();
            const showBanner = Date.now() - ts <= RESOURCE_BANNER_WINDOW_MS;
            setShowResourcesBanner(Boolean(showBanner));
          } else {
            setShowResourcesBanner(true);
          }
        } catch {
          setShowResourcesBanner(true);
        }
      })();
      return;
    }

    const stored = getAuthFromStorage();
    const userCreatedAtStr = (stored?.user as any)?.created_at || null;
    if (userCreatedAtStr) {
      const ts = new Date(userCreatedAtStr).getTime();
      setShowResourcesBanner(Date.now() - ts <= RESOURCE_BANNER_WINDOW_MS);
      return;
    }

    const signupAtRaw = localStorage.getItem("elevate_spaces_signup_at");
    const signupAt = signupAtRaw ? Number(signupAtRaw) : stored?.timestamp ?? null;
    const showBanner = Boolean(signupAt && Number.isFinite(signupAt) && Date.now() - signupAt <= RESOURCE_BANNER_WINDOW_MS);
    setShowResourcesBanner(showBanner);
  }, []);

  const handleDemoCreditsUpdate = useCallback(
    (info: {
      demoCreditsRemaining: number;
      personalBalance: number;
      hasPurchasedCredits: boolean;
      isDemo: boolean;
      demoSessionReady: boolean;
    }) => {
      if (!info.demoSessionReady) return;

      if (info.isDemo && info.demoCreditsRemaining > 0) {
        setHasFreeDemoCredits(true);
        setHeroCreditCount(info.demoCreditsRemaining);
      } else {
        setHasFreeDemoCredits(false);
        setHeroCreditCount(null);
      }
    },
    []
  );

  const handleMove = (clientX: number) => {
    const rect = document
      .getElementById("slider-container")
      ?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percentage);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag as any);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleDrag as any);
      window.addEventListener("touchend", handleEnd);
      return () => {
        window.removeEventListener("mousemove", handleDrag as any);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleDrag as any);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging]);

  const scrollToDemo = () => {
    document.getElementById("try-now-demo")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <AdminAutoRedirect />
      <ResourcesOnboardingPopup />
      <div className="bg-cream-50 min-h-screen">

        {/* Hero CTA - visible above the fold on both mobile and desktop */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 text-center">
          {hasFreeDemoCredits ? (
            <>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-900 mb-3">
                Turn empty rooms into staged homes
              </h1>
              <p className="text-base sm:text-lg text-cream-800/70 mb-6">
                Upload a photo and see it staged in seconds.
              </p>
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-6 py-3 text-base font-semibold text-white hover:bg-accent-600 transition-colors"
              >
                Try for free now
              </button>
              <p className="mt-3 text-sm text-cream-800/50">
                No credit card required · Results in under 60 seconds
              </p>
              {heroCreditCount !== null && (
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-500">
                    <Sparkles className="h-4 w-4" />
                    {heroCreditCount} free demo credit{heroCreditCount === 1 ? "" : "s"} remaining
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-900 mb-3">
                See your space staged in seconds
              </h1>
              <p className="text-base sm:text-lg text-cream-800/70 mb-6">
                Upload a photo and get a fully staged preview.
              </p>
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center rounded-lg bg-accent-500 px-6 py-3 text-base font-semibold text-white hover:bg-accent-600 transition-colors"
              >
                Upload a Photo
              </button>
              <p className="mt-3 text-sm text-cream-800/50">
                Results in under 60 seconds
              </p>
            </>
          )}
        </section>

        {/* Trust strip - cited industry stats, not platform-specific usage data */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
          <div className="border-t border-b border-cream-200 py-5 flex flex-wrap items-start justify-center gap-9">
            <div className="text-center max-w-[190px]">
              <div className="font-display text-2xl font-bold text-brand-500">49%</div>
              <div className="mt-1 text-xs text-cream-800/60 leading-snug">of agents report staged homes sell faster</div>
            </div>
            <div className="text-center max-w-[190px]">
              <div className="font-display text-2xl font-bold text-brand-500">29%</div>
              <div className="mt-1 text-xs text-cream-800/60 leading-snug">saw a 1–10% higher offer from staging</div>
            </div>
            <div className="text-center max-w-[190px]">
              <div className="font-display text-2xl font-bold text-brand-500">83%</div>
              <div className="mt-1 text-xs text-cream-800/60 leading-snug">of buyers' agents say staging helps buyers picture living there</div>
            </div>
          </div>
          <p className="text-center text-[11px] text-cream-800/40 italic mt-3 max-w-lg mx-auto">
            Source:{" "}
            <a href="https://www.nar.realtor/research-and-statistics/research-reports/profile-of-home-staging" target="_blank" rel="noopener noreferrer" className="underline hover:text-cream-800/60">
              National Association of Realtors, 2025 Profile of Home Staging
            </a>
            {" "}— reflects staging generally, not Elevate Spaces AI results specifically.
          </p>
        </section>

        {/* Our Expertise Section - Matches the design perfectly */}
        <Services />
        {showResourcesBanner && (
          <div className="relative z-10 mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 sm:px-6 sm:py-5 shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-brand-900 sm:text-base">
                  New to platform? Resources are in process
                </p>
                <Link
                  href="/resources"
                  className="inline-flex w-fit items-center rounded-lg bg-accent-500 px-4 py-2 text-sm font-semibold text-white hover:bg-accent-600"
                >
                  Open resources
                </Link>
              </div>
            </div>
          </div>
        )}
        <div id="try-now-demo">
          <Demo onCreditsUpdate={handleDemoCreditsUpdate} />
        </div>
        {isLoggedIn ? <RecentUploads /> : null}

        <Pricing />

        <Footer />
      </div>
    </>
  );
}
