"use client";
import React, { useEffect, useState } from "react";
import "./globals.css";
import Link from "next/link";
import dynamic from "next/dynamic";
import Pricing from "@/components/pricing-new";
import AdminAutoRedirect from "./admin-redirect";
import { ResourcesOnboardingPopup } from "@/components/ResourcesOnboardingPopup";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { getGuestStatus } from "@/services/guest.service";
import Hero from "@/components/home/Hero";
import StatsStrip from "@/components/home/StatsStrip";
import Gallery from "@/components/home/Gallery";
import Workflow from "@/components/home/Workflow";

const Footer = dynamic(() => import("@/components/footer"), { ssr: false });
const RESOURCE_BANNER_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export default function Home() {
  const [showResourcesBanner, setShowResourcesBanner] = useState(false);
  const [hasFreeDemoCredits] = useState(false);
  const [heroCreditCount] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = getAuthFromStorage();
    const loggedIn = Boolean(auth?.token);

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
    const showBanner = Boolean(
      signupAt && Number.isFinite(signupAt) && Date.now() - signupAt <= RESOURCE_BANNER_WINDOW_MS
    );
    setShowResourcesBanner(showBanner);
  }, []);

  return (
    <>
      <AdminAutoRedirect />
      <ResourcesOnboardingPopup />
      <div className="bg-cream-50 min-h-screen text-brand-900 antialiased">
        <Hero
          hasFreeDemoCredits={hasFreeDemoCredits}
          heroCreditCount={heroCreditCount}
        />

        <StatsStrip />

        <Gallery />

        <Workflow />

        {showResourcesBanner && (
          <div className="relative z-10 mx-auto my-8 max-w-6xl px-4 md:px-6">
            <div className="rounded-2xl border border-brand-100 bg-brand-50 px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
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

        <Pricing />

        <Footer />
      </div>
    </>
  );
}
