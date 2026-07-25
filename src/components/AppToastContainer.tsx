"use client";

import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { ToastContainer } from "react-toastify";
import type { TypeOptions } from "react-toastify";

function ToastIcon({ type }: { type?: TypeOptions }) {
  if (type === "error") return <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />;
  if (type === "info") return <Info className="w-4 h-4 text-brand-500 shrink-0" />;
  return <CheckCircle2 className="w-4 h-4 text-accent-400 shrink-0" />;
}

export function AppToastContainer() {
  return (
    <ToastContainer
      position="top-center"
      autoClose={4000}
      hideProgressBar
      newestOnTop
      icon={({ type }) => <ToastIcon type={type} />}
      toastClassName={() =>
        "bg-brand-900 text-white text-sm font-medium rounded-xl shadow-lg " +
        "px-4 py-3 flex items-center gap-2 min-h-0 mb-2 border border-white/5"
      }
      closeButton={({ closeToast }) => (
        <button
          type="button"
          onClick={closeToast}
          aria-label="Close"
          className="ml-2 text-white/50 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    />
  );
}
