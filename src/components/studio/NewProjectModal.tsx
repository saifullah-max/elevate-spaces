"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { FolderPlus, User, Users, X } from "lucide-react";
import { createProject } from "@/services/projects.service";
import { getTeams } from "@/services/teams.service";
import type { Team } from "@/types/teams.types";
import { showError, showSuccess } from "@/components/toastUtils";
import { getAuthFromStorage } from "@/lib/auth.storage";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type Kind = "personal" | "team";
type Step = "chooser" | "form";

export default function NewProjectModal({ open, onClose, onCreated }: Props) {
  const [step, setStep] = useState<Step>("chooser");
  const [kind, setKind] = useState<Kind>("personal");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [photographerEmail, setPhotographerEmail] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = useMemo(() => getAuthFromStorage()?.user?.id ?? null, []);

  const ownedOrJoinedTeams = useMemo(() => {
    if (!currentUserId) return [];
    return teams.filter(
      (t) =>
        t.owner_id === currentUserId ||
        (t.members || []).some((m) => m.user_id === currentUserId)
    );
  }, [teams, currentUserId]);

  useEffect(() => {
    if (open) {
      setStep("chooser");
      setKind("personal");
      setName("");
      setAddress("");
      setPhotographerEmail("");
      setTeamId("");
      setSubmitting(false);
    }
  }, [open]);

  // Fetch teams once the user picks the team option.
  useEffect(() => {
    if (!open || step !== "form" || kind !== "team") return;
    let cancelled = false;
    setTeamsLoading(true);
    (async () => {
      try {
        const res = await getTeams();
        if (cancelled) return;
        setTeams(res.teams || []);
      } catch {
        if (!cancelled) setTeams([]);
      } finally {
        if (!cancelled) setTeamsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, step, kind]);

  useEffect(() => {
    if (!teamId && ownedOrJoinedTeams.length > 0) {
      setTeamId(ownedOrJoinedTeams[0].id);
    }
  }, [ownedOrJoinedTeams, teamId]);

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

  const chooseKind = (k: Kind) => {
    setKind(k);
    setStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !name.trim()) return;
    if (kind === "team" && !teamId) {
      showError("Pick a team to create this project under.");
      return;
    }
    try {
      setSubmitting(true);
      await createProject({
        name: name.trim(),
        address: address.trim() || undefined,
        teamId: kind === "team" ? teamId : undefined,
        photographerEmail: photographerEmail.trim() || undefined,
      });
      showSuccess("Project created");
      onCreated();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to create project");
    } finally {
      setSubmitting(false);
    }
  };

  const chooserContent = (
    <>
      <h3 className="font-display text-xl font-bold text-brand-900 mb-1">New Project</h3>
      <p className="text-sm text-cream-800/60 mb-5">Choose who this project is for.</p>
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => chooseKind("personal")}
          className="w-full text-left border-2 border-cream-200 hover:border-brand-500 rounded-2xl p-4 transition-colors flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-brand-900">Personal project</p>
            <p className="text-xs text-cream-800/60 mt-0.5">
              Just for you — no one else can see it.
            </p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => chooseKind("team")}
          className="w-full text-left border-2 border-cream-200 hover:border-brand-500 rounded-2xl p-4 transition-colors flex items-start gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-brand-500" />
          </div>
          <div>
            <p className="font-semibold text-sm text-brand-900">Team project</p>
            <p className="text-xs text-cream-800/60 mt-0.5">
              Visible to the team owner, any team admins, and anyone you invite.
            </p>
          </div>
        </button>
      </div>
    </>
  );

  const formContent = (
    <form onSubmit={handleSubmit}>
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-brand-100 text-brand-500 flex items-center justify-center">
          <FolderPlus className="w-4 h-4" />
        </div>
        <h3 className="font-display text-lg font-bold text-brand-900">
          {kind === "team" ? "New team project" : "New personal project"}
        </h3>
      </div>
      <button
        type="button"
        onClick={() => setStep("chooser")}
        className="text-[11px] text-brand-500 hover:underline mb-4"
      >
        ← Change project type
      </button>

      {kind === "team" && (
        <>
          <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
            Team
          </label>
          {teamsLoading ? (
            <p className="text-xs text-cream-800/60 mb-3">Loading your teams…</p>
          ) : ownedOrJoinedTeams.length === 0 ? (
            <p className="text-xs text-red-600 mb-3">
              You're not on any teams yet. Create a team first.
            </p>
          ) : (
            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
            >
              {ownedOrJoinedTeams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </>
      )}

      <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
        Project name
      </label>
      <input
        type="text"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. 123 Main Street"
        className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
      />

      <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
        Address <span className="normal-case font-normal text-cream-800/40">(optional)</span>
      </label>
      <input
        type="text"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        placeholder="Street, city…"
        className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
      />

      <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
        Invite a photographer{" "}
        <span className="normal-case font-normal text-cream-800/40">(optional)</span>
      </label>
      <input
        type="email"
        value={photographerEmail}
        onChange={(e) => setPhotographerEmail(e.target.value)}
        placeholder="photographer@email.com"
        className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-4"
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
          disabled={
            submitting ||
            !name.trim() ||
            (kind === "team" && (teamsLoading || ownedOrJoinedTeams.length === 0))
          }
          className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? "Creating…" : "Create project"}
        </button>
      </div>
    </form>
  );

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-brand-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
        {step === "chooser" ? chooserContent : formContent}
      </div>
    </div>,
    document.body
  );
}
