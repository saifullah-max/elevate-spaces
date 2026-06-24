"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackPageView } from "@/lib/analytics";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

export function PageviewTracker() {
  const pathname = usePathname();
  const lastReportedRef = useRef<string>("");

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith("/admin")) return;
    if (lastReportedRef.current === pathname) return;
    lastReportedRef.current = pathname;

    // Forward route changes to Meta Pixel + GA4. The base scripts fire an
    // initial PageView on first load; this catches client-side navigations.
    trackPageView(pathname);

    if (!API_BASE_URL) return;

    const payload = JSON.stringify({
      path: pathname,
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      language: typeof navigator !== "undefined" ? navigator.language || null : null,
    });

    try {
      const url = `${API_BASE_URL}/analytics/pageview`;
      if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
        const blob = new Blob([payload], { type: "application/json" });
        navigator.sendBeacon(url, blob);
      } else {
        void fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        });
      }
    } catch {
      // never block UI on telemetry
    }
  }, [pathname]);

  return null;
}
