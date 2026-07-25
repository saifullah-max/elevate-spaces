"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Trash2, X } from "lucide-react";
import {
  addProjectPhotographer,
  removeProjectPhotographer,
} from "@/services/projects.service";
import { showError, showSuccess } from "@/components/toastUtils";
import type { ProjectMember } from "@/types/projects.types";

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string | null;
  currentPhotographer: ProjectMember | null;
  onUpdated: () => void;
}

export default function ManagePhotographerModal({
  open,
  onClose,
  projectId,
  currentPhotographer,
  onUpdated,
}: Props) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (open) setEmail("");
  }, [open]);

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

  if (!open || !projectId || typeof document === "undefined") return null;

  const photographerName =
    currentPhotographer?.user?.name || currentPhotographer?.user?.email || null;
  const photographerEmail = currentPhotographer?.user?.email || null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || submitting) return;
    try {
      setSubmitting(true);
      await addProjectPhotographer({ projectId, photographerEmail: trimmed });
      showSuccess(
        `Invitation sent to ${trimmed} — they can now upload media for this project.`
      );
      onUpdated();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to add photographer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (!currentPhotographer || removing) return;
    const photographerId = currentPhotographer.user?.id || currentPhotographer.user_id;
    if (!photographerId) {
      showError("Cannot remove: photographer id missing.");
      return;
    }
    try {
      setRemoving(true);
      await removeProjectPhotographer(projectId, photographerId);
      showSuccess("Photographer removed");
      onUpdated();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to remove photographer");
    } finally {
      setRemoving(false);
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
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-500 flex items-center justify-center">
            <Camera className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">
            Manage photographer
          </h3>
        </div>

        {currentPhotographer ? (
          <>
            <p className="text-xs font-semibold text-cream-800/70 uppercase tracking-wider mb-1.5">
              Current photographer
            </p>
            <div className="flex items-center justify-between gap-2 bg-cream-50 border border-cream-200 rounded-lg px-3 py-2.5 mb-5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-brand-900 truncate">
                  {photographerName || "Photographer"}
                </p>
                {photographerEmail && photographerEmail !== photographerName && (
                  <p className="text-[11px] text-cream-800/60 truncate">{photographerEmail}</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleRemove}
                disabled={removing}
                className="text-red-500 hover:text-red-700 disabled:opacity-60 shrink-0 p-1.5 rounded hover:bg-red-50 transition-colors"
                aria-label="Unassign photographer"
                title="Unassign photographer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] text-cream-800/50 leading-relaxed mb-5">
              This photographer has access to upload media for this project. Remove them first
              if you want to assign someone else.
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleAdd}>
            <p className="text-xs font-semibold text-cream-800/70 uppercase tracking-wider mb-1.5">
              Current photographer
            </p>
            <p className="text-sm text-cream-800/60 mb-4">No photographer assigned yet.</p>

            <label className="block text-xs font-semibold text-cream-800/70 uppercase tracking-wider mb-1.5">
              Add photographer by email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="photographer@email.com"
              className="w-full border border-cream-200 rounded-lg px-3 py-2.5 text-sm bg-cream-50 mb-2"
            />
            <p className="text-[11px] text-cream-800/50 leading-relaxed mb-5">
              If the person already has an account they'll be added immediately and notified by
              email. Otherwise an invitation email will be sent. Inviting a photographer only
              gives them access to upload media for this project.
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
                type="submit"
                disabled={submitting || !email.trim()}
                className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? "Sending…" : "Send invite"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
