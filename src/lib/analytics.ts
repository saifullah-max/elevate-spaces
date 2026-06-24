// Centralized client-side analytics for Meta Pixel + Google Analytics 4.
// Set NEXT_PUBLIC_META_PIXEL_ID and NEXT_PUBLIC_GA_ID in .env.local to enable.
// All helpers are no-ops if the matching ID is missing, so they're safe to
// call unconditionally from any client component.

export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "";
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID || "";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const isBrowser = () => typeof window !== "undefined";

function fbq(...args: unknown[]) {
  if (!isBrowser() || !META_PIXEL_ID) return;
  if (typeof window.fbq === "function") {
    try { window.fbq(...args); } catch { /* swallow */ }
  }
}

function gtag(...args: unknown[]) {
  if (!isBrowser() || !GA_MEASUREMENT_ID) return;
  if (typeof window.gtag === "function") {
    try { window.gtag(...args); } catch { /* swallow */ }
  }
}

export function trackPageView(path: string) {
  fbq("track", "PageView");
  gtag("event", "page_view", { page_path: path });
}

export function trackSignUp(method: "email" | "google" = "email") {
  fbq("track", "CompleteRegistration", { method });
  gtag("event", "sign_up", { method });
}

export function trackStartTrial(planName?: string) {
  fbq("track", "StartTrial", planName ? { content_name: planName } : undefined);
  gtag("event", "begin_trial", planName ? { plan: planName } : {});
}

export type PurchaseInfo = {
  value: number;
  currency: string;
  transactionId?: string;
  productName?: string;
};

export function trackPurchase({ value, currency, transactionId, productName }: PurchaseInfo) {
  fbq("track", "Purchase", { value, currency, content_name: productName });
  gtag("event", "purchase", {
    transaction_id: transactionId,
    value,
    currency,
    items: productName ? [{ item_name: productName }] : undefined,
  });
}
