"use client";
import React, { useEffect, useState } from "react";
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
import { getUserCredits } from "@/services/payment.service";

const Footer = dynamic(() => import("@/components/footer"), { ssr: false });
const RESOURCE_BANNER_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showResourcesBanner, setShowResourcesBanner] = useState(false);
  const [hasFreeDemoCredits, setHasFreeDemoCredits] = useState(false);
  const [heroCreditCount, setHeroCreditCount] = useState<number | null>(null);
  const [heroCreditIsPaid, setHeroCreditIsPaid] = useState(false);

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

  // Separate, self-contained check: decides which hero copy/CTA to show, and
  // which credit count (free demo vs. paid balance) to display underneath it.
  useEffect(() => {
    if (typeof window === "undefined") return;
    (async () => {
      try {
        const status = await getGuestStatus();
        const remaining = status?.data?.remainingDemoCredits ?? 0;
        const limitReached = status?.data?.limitReached ?? true;
        const hasPurchased = status?.data?.hasPurchasedCredits ?? false;
        const freeCreditsLeft = remaining > 0 && !limitReached;

        setHasFreeDemoCredits(freeCreditsLeft);

        if (freeCreditsLeft) {
          setHeroCreditIsPaid(false);
          setHeroCreditCount(remaining);
        } else if (hasPurchased) {
          const credits = await getUserCredits();
          setHeroCreditIsPaid(true);
          setHeroCreditCount(credits.currentBalance);
        } else {
          setHeroCreditCount(null);
        }
      } catch {
        setHasFreeDemoCredits(false);
        setHeroCreditCount(null);
      }
    })();
  }, []);

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
      <div className="bg-slate-100 min-h-screen">

        {/* Hero CTA - visible above the fold on both mobile and desktop */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6 text-center">
          {hasFreeDemoCredits ? (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                Turn empty rooms into staged homes
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6">
                Upload a photo and see it staged in seconds.
              </p>
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Try for free now
              </button>
              {heroCreditCount !== null && (
                <p className="mt-3 text-sm text-slate-500">
                  {heroCreditCount} free demo credit{heroCreditCount === 1 ? "" : "s"} remaining
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
                See your space staged in seconds
              </h1>
              <p className="text-base sm:text-lg text-slate-600 mb-6">
                Upload a photo and get a fully staged preview.
              </p>
              <button
                onClick={scrollToDemo}
                className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-6 py-3 text-base font-semibold text-white hover:bg-indigo-700 transition-colors"
              >
                Upload a Photo
              </button>
              {heroCreditIsPaid && heroCreditCount !== null && (
                <p className="mt-3 text-sm text-slate-500">
                  {heroCreditCount} credit{heroCreditCount === 1 ? "" : "s"} remaining
                </p>
              )}
            </>
          )}
        </section>

        {/* Our Expertise Section - Matches the design perfectly */}
        <Services />
        {showResourcesBanner && (
          <div className="relative z-10 mx-auto mb-8 max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-indigo-200 px-5 py-4 sm:px-6 sm:py-5 shadow-md">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-indigo-900 sm:text-base">
                  New to platform? Resources are in process
                </p>
                <Link
                  href="/resources"
                  className="inline-flex w-fit items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  Open resources
                </Link>
              </div>
            </div>
          </div>
        )}
        <div id="try-now-demo">
          <Demo />
        </div>
        {isLoggedIn ? <RecentUploads /> : null}

        <Pricing />

        <Footer />
      </div>
    </>
  );
}
