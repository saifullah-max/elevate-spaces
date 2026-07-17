"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Users, X } from "lucide-react";
import { createTeam } from "@/services/teams.service";
import { showError, showSuccess } from "@/components/toastUtils";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddTeamModal({ open, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setName("");
      setDescription("");
      setSubmitting(false);
    }
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

  if (!open || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !name.trim()) return;
    try {
      setSubmitting(true);
      await createTeam({ name: name.trim(), description: description.trim() });
      showSuccess(`Team "${name.trim()}" created`);
      onCreated();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to create team");
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
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
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
            <Users className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">Add a team</h3>
        </div>

        <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
          Team name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Elevate Spaces AI"
          className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
        />

        <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
          Description{" "}
          <span className="normal-case font-normal text-cream-800/40">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What's this team for?"
          className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-4 resize-none"
        />

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
            disabled={submitting || !name.trim()}
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Creating…" : "Create team"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
