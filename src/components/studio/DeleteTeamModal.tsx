"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, X } from "lucide-react";
import { deleteTeam } from "@/services/teams.service";
import { showError, showSuccess } from "@/components/toastUtils";

interface Props {
  open: boolean;
  onClose: () => void;
  teamId: string | null;
  teamName: string;
  onDeleted: () => void;
}

export default function DeleteTeamModal({
  open,
  onClose,
  teamId,
  teamName,
  onDeleted,
}: Props) {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open || !teamId || typeof document === "undefined") return null;

  const handleDelete = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await deleteTeam(teamId);
      showSuccess(`Deleted "${teamName}"`);
      onDeleted();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to delete team");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-brand-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-sm w-full relative shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-500 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">Delete team</h3>
        </div>
        <p className="text-sm text-cream-800/70 mb-5">
          Are you sure you want to delete <span className="font-semibold text-brand-900">{teamName}</span>?
          This removes all members and any remaining team credits. This can't be undone.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold py-2.5 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Deleting…" : "Delete team"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
