"use client";

import { useState } from "react";
import { Bookmark, Sparkles, X } from "lucide-react";
import type { StudioController } from "./useStudio";
import InfoTip from "./InfoTip";
import AuthGateModal from "@/components/AuthGateModal";
import { createProject } from "@/services/projects.service";
import { userHasActivePersonalSubscription } from "@/helpers/subscription.helpers";
import { showStudioToast } from "./StudioToast";

interface Props {
  studio: StudioController;
}

export default function CreditsProjectCard({ studio }: Props) {
  const [authOpen, setAuthOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const hasActiveSubscription = userHasActivePersonalSubscription(studio.paymentSummary);
  const personalProjectsCount = studio.projects.length; // projects the studio loaded (personal + team)
  const canCreateFree = personalProjectsCount < 1;

  const openCreateModal = () => {
    setName("");
    setAddress("");
    setCreateError(null);
    setCreateOpen(true);
  };

  const handleSaveClick = () => {
    if (!studio.isLoggedIn) {
      setAuthOpen(true);
      return;
    }
    if (!hasActiveSubscription && !canCreateFree) {
      setUpgradeOpen(true);
      return;
    }
    openCreateModal();
  };

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setCreateError("Project name is required");
      return;
    }
    setSaving(true);
    setCreateError(null);
    try {
      const res = await createProject({
        name: trimmed,
        address: address.trim() || undefined,
      });
      const created = res?.project;
      if (created?.id) {
        studio.addProject({ id: String(created.id), name: String(created.name || trimmed) });
        setCreateOpen(false);
        showStudioToast(`Project “${created.name || trimmed}” saved`);
      } else {
        setCreateOpen(false);
      }
    } catch (err: any) {
      setCreateError(err?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };
  const displayedPersonalCredits = studio.isLoggedIn
    ? studio.personalBalance
    : studio.guestDemoCreditsRemaining;

  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px]">
          2
        </span>
        Credits &amp; Project
        <InfoTip>
          {studio.isLoggedIn
            ? `Personal: ${studio.personalBalance} credits - ${studio.teams.length} team wallet${studio.teams.length === 1 ? "" : "s"}. Pick where to spend and which project to save to.`
            : "These are your free demo credits for this device. Team credits come from your shared wallet once you sign up. Projects keep a listing's photos together."}
        </InfoTip>
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-cream-800/50 font-medium mb-1.5">Use credits from</p>
          <div className="flex bg-cream-50 border border-cream-200 rounded-lg p-1">
            <button
              type="button"
              onClick={() => studio.setCreditSource("personal")}
              className={
                "flex-1 text-center text-xs py-1.5 rounded transition-all " +
                (studio.creditSource === "personal"
                  ? "bg-brand-500 text-white font-semibold"
                  : "text-cream-800/50 font-medium")
              }
            >
              {studio.isLoggedIn ? "Personal" : "Demo credits"} ({studio.guestCreditsLoaded || studio.isLoggedIn ? displayedPersonalCredits : "..."})
            </button>
            <button
              type="button"
              onClick={() => studio.setCreditSource("team")}
              disabled={studio.teams.length === 0}
              className={
                "flex-1 text-center text-xs py-1.5 rounded transition-all disabled:opacity-50 disabled:cursor-not-allowed " +
                (studio.creditSource === "team"
                  ? "bg-brand-500 text-white font-semibold"
                  : "text-cream-800/50 font-medium")
              }
            >
              Team{studio.creditSource === "team" ? ` (${studio.teamCredits})` : ""}
            </button>
          </div>
          {studio.creditSource === "team" && studio.teams.length > 0 && (
            <select
              value={studio.teamId ?? ""}
              onChange={(e) => studio.setTeamId(e.target.value || null)}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs text-cream-800/80 bg-cream-50 mt-2"
            >
              <option value="">Select a team...</option>
              {studio.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.wallet ?? 0} credits)
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <p className="text-xs text-cream-800/50 font-medium mb-1.5 flex items-center gap-1">
            Project
            <InfoTip>
              {studio.isLoggedIn
                ? `${studio.projects.length} saved project${studio.projects.length === 1 ? "" : "s"}. Add this batch to one - projects never expire.`
                : "Projects keep a listing's photos, styling, and results together - and unlike Recent Uploads, they don't expire after 30 days."}
            </InfoTip>
          </p>

          {studio.isLoggedIn && studio.projects.length > 0 ? (
            <div className="space-y-2">
              <select
                value={studio.projectId ?? ""}
                onChange={(e) => studio.setProjectId(e.target.value || null)}
                className="w-full border border-cream-200 rounded-lg px-3 py-2 text-xs text-cream-800/80 bg-cream-50"
              >
                <option value="">No project</option>
                {studio.projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleSaveClick}
                className="w-full border border-brand-500 text-brand-500 hover:bg-brand-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-3 h-3" /> New project
              </button>
            </div>
          ) : (
            <>
              <p className="text-xs text-cream-800/50 mb-2">This session only - not saved.</p>
              <button
                type="button"
                onClick={handleSaveClick}
                className="w-full border border-brand-500 text-brand-500 hover:bg-brand-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-3 h-3" /> Save Project
              </button>
            </>
          )}
        </div>
      </div>

      <AuthGateModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSuccess={() => {
          setAuthOpen(false);
          // Fresh account → first project is free. Open create modal directly.
          openCreateModal();
        }}
      />

      {createOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-brand-900/50 backdrop-blur-sm"
          onClick={() => !saving && setCreateOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={submitCreate}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 max-w-sm w-full relative shadow-xl"
          >
            <button
              type="button"
              onClick={() => !saving && setCreateOpen(false)}
              className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 mb-1">
              <Bookmark className="w-4 h-4 text-brand-500" />
              <h3 className="font-display text-lg font-bold text-brand-900">Save as project</h3>
            </div>
            <p className="text-xs text-cream-800/60 mb-4">
              {hasActiveSubscription
                ? "Give this listing a name so you can find it later."
                : "Your first project is free — subscribe to save more."}
            </p>

            <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
              Project name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="123 Main St"
              className="w-full border border-cream-200 rounded-lg px-4 py-2.5 text-sm bg-cream-50 mb-3"
              autoFocus
            />

            <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
              Address <span className="text-cream-800/30 normal-case">(optional)</span>
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city"
              className="w-full border border-cream-200 rounded-lg px-4 py-2.5 text-sm bg-cream-50 mb-4"
            />

            {createError && (
              <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {createError}
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                disabled={saving}
                className="flex-1 border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-brand-500 hover:bg-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors"
              >
                {saving ? "Saving…" : "Save Project"}
              </button>
            </div>
          </form>
        </div>
      )}

      {upgradeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 overflow-y-auto bg-brand-900/50 backdrop-blur-sm"
          onClick={() => setUpgradeOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-8 max-w-sm w-full relative shadow-xl text-center"
          >
            <button
              onClick={() => setUpgradeOpen(false)}
              className="absolute top-4 right-4 text-cream-800/40 hover:text-brand-900"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-14 h-14 rounded-full bg-brand-100 mx-auto flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-brand-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-brand-900 mb-2">
              Upgrade to save more projects
            </h3>
            <p className="text-sm text-cream-800/60 mb-6">
              You've used your free saved project. Subscribe to Pro, Team, or Enterprise to save
              unlimited projects and unlock advanced features.
            </p>
            <div className="flex flex-col gap-2">
              <a
                href="/pricing"
                className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors inline-flex items-center justify-center"
              >
                See plans
              </a>
              <button
                type="button"
                onClick={() => setUpgradeOpen(false)}
                className="text-xs text-cream-800/60 hover:text-brand-900"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
