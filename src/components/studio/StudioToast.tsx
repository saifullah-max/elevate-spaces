"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";

const EVENT_NAME = "studio-toast";

export function showStudioToast(message: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: message }));
}

export default function StudioToast() {
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    let clearTimer: ReturnType<typeof setTimeout> | null = null;

    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (!detail) return;
      setMessage(detail);
      setVisible(true);
      if (hideTimer) clearTimeout(hideTimer);
      if (clearTimer) clearTimeout(clearTimer);
      hideTimer = setTimeout(() => setVisible(false), 2500);
      clearTimer = setTimeout(() => setMessage(null), 2900);
    };

    window.addEventListener(EVENT_NAME, onToast);
    return () => {
      window.removeEventListener(EVENT_NAME, onToast);
      if (hideTimer) clearTimeout(hideTimer);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, []);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={
        "fixed bottom-6 right-6 bg-brand-900 text-white text-sm px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 transition-all duration-300 " +
        (visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none")
      }
    >
      <CheckCircle2 className="w-4 h-4 text-accent-400 shrink-0" />
      <span>{message}</span>
    </div>
  );
}
