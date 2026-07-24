"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { UserPlus, X } from "lucide-react";
import { inviteTeamMember } from "@/services/teams.service";
import { showError, showSuccess } from "@/components/toastUtils";
import type { Team } from "@/types/teams.types";

interface Props {
  open: boolean;
  onClose: () => void;
  team: Team | null;
  onInvited: () => void;
}

const ROLES = [
  { value: "MEMBER", label: "Member" },
  { value: "PHOTOGRAPHER", label: "Photographer" },
  { value: "ADMIN", label: "Admin" },
];

export default function InviteTeamMemberModal({ open, onClose, team, onInvited }: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [role, setRole] = useState("MEMBER");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && team) {
      setEmail("");
      setSubject(`You're invited to join ${team.name} on Elevate Spaces AI`);
      setMessage("");
      setRole("MEMBER");
      setSubmitting(false);
    }
  }, [open, team]);

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

  if (!open || !team || typeof document === "undefined") return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      await inviteTeamMember({
        email: email.trim(),
        subject: subject.trim() || undefined,
        text: message.trim() || undefined,
        teamId: team.id,
        roleName: role,
      });
      showSuccess(`Invitation sent to ${email.trim()}`);
      onInvited();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to send invitation");
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
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-500 flex items-center justify-center">
            <UserPlus className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">Invite a team member</h3>
        </div>
        <p className="text-xs text-cream-800/50 mb-4">
          Inviting to <span className="font-semibold text-brand-900">{team.name}</span>
        </p>

        <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@email.com"
          className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
        />

        <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
          Subject <span className="normal-case font-normal text-cream-800/40">(email subject line)</span>
        </label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
        />

        <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
          Message <span className="normal-case font-normal text-cream-800/40">(optional)</span>
        </label>
        <textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Add a personal note…"
          className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3 resize-none"
        />

        <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
          Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-5"
        >
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

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
    </div>,
    document.body
  );
}
