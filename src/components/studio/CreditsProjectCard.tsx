"use client";

import { Bookmark } from "lucide-react";
import type { StudioController } from "./useStudio";
import InfoTip from "./InfoTip";

interface Props {
  studio: StudioController;
}

export default function CreditsProjectCard({ studio }: Props) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5">
      <p className="text-xs font-bold text-brand-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-500 text-white text-[10px]">
          2
        </span>
        Credits &amp; Project
        <InfoTip>
          {studio.isLoggedIn
            ? `Personal: ${studio.personalBalance} credits · ${studio.teams.length} team wallet${studio.teams.length === 1 ? "" : "s"}. Pick where to spend and which project to save to.`
            : "Team credits come from your shared wallet. Personal credits are yours alone. Projects keep a listing's photos together."}
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
              Personal ({studio.personalBalance})
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
              <option value="">Select a team…</option>
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
                ? `${studio.projects.length} saved project${studio.projects.length === 1 ? "" : "s"}. Add this batch to one — projects never expire.`
                : "Projects keep a listing's photos, styling, and results together — and unlike Recent Uploads, they don't expire after 30 days."}
            </InfoTip>
          </p>

          {studio.isLoggedIn && studio.projects.length > 0 ? (
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
          ) : (
            <>
              <p className="text-xs text-cream-800/50 mb-2">This session only — not saved.</p>
              <button
                type="button"
                onClick={() => (window.location.href = "/projects")}
                className="w-full border border-brand-500 text-brand-500 hover:bg-brand-50 text-xs font-semibold px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Bookmark className="w-3 h-3" /> Save Project
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
