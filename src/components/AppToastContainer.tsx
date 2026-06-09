"use client";

import { X } from "lucide-react";
import { ToastContainer } from "react-toastify";

export function AppToastContainer() {
  return (
    <ToastContainer
      closeButton={({ closeToast }) => (
        <button
          onClick={closeToast}
          className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
        >
          <X />
        </button>
      )}
    />
  );
}
