"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ChevronDown,
  Clock,
  FolderOpen,
  HouseIcon,
  Users,
  WandSparkles,
} from "lucide-react";
import { consumePendingUploadFiles } from "@/lib/pendingUpload";
import { useStudio } from "@/components/studio/useStudio";
import UploadCard from "@/components/studio/UploadCard";
import CreditsProjectCard from "@/components/studio/CreditsProjectCard";
import AreaStyleCard from "@/components/studio/AreaStyleCard";
import GenerateSection from "@/components/studio/GenerateSection";
import ResultsCard from "@/components/studio/ResultsCard";
import PreviewCard from "@/components/studio/PreviewCard";
import CustomizeModal from "@/components/studio/CustomizeModal";
import StudioToast from "@/components/studio/StudioToast";
import MyProjectsView from "@/components/studio/MyProjectsView";
import RecentUploadsView from "@/components/studio/RecentUploadsView";
import TeamView from "@/components/studio/TeamView";

type StudioView = "new" | "projects" | "uploads" | "team";

const SIDEBAR_ITEMS: {
  key: StudioView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { key: "new", label: "New Staging", icon: WandSparkles },
  { key: "projects", label: "My Projects", icon: FolderOpen },
  { key: "uploads", label: "Recent Uploads", icon: Clock },
  { key: "team", label: "Team", icon: Users },
];

export default function StudioPage() {
  const [active, setActive] = useState<StudioView>("new");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [teamCreditsOpen, setTeamCreditsOpen] = useState(true);
  const [initialFiles, setInitialFiles] = useState<File[] | undefined>(undefined);

  useEffect(() => {
    // DEBUG: confirm this effect runs, and what it gets back
    console.log("[StudioPage] mount effect running, consuming pending files...");
    const files = consumePendingUploadFiles();
    console.log("[StudioPage] consumePendingUploadFiles() returned:", files.length, files.map((f) => f.name));
    if (files.length > 0) {
      setInitialFiles(files);
      console.log("[StudioPage] setInitialFiles called with", files.length, "files");
    }
  }, []);

  // DEBUG: confirm what initialFiles looks like on every render
  console.log("[StudioPage] render, initialFiles =", initialFiles?.length ?? "undefined");

  const studio = useStudio(initialFiles);

  // DEBUG: confirm what the hook actually ended up with
  console.log("[StudioPage] studio.files.length =", studio.files.length);

  const activeItem = SIDEBAR_ITEMS.find((i) => i.key === active) ?? SIDEBAR_ITEMS[0];
  const ActiveIcon = activeItem.icon;

  const selectView = (v: StudioView) => {
    setActive(v);
    setMobileNavOpen(false);
  };

  return (
    <div className="bg-cream-50 min-h-screen text-brand-900 antialiased">
      <section className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10">
        <div className="grid lg:grid-cols-[220px_1fr] gap-6">
          {/* Mobile compact nav */}
          <div className="lg:hidden">
            <div className="relative">
              <button
                onClick={() => setMobileNavOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-white border border-cream-200 rounded-xl px-4 py-3 shadow-sm"
              >
                <span className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center shrink-0">
                    <ActiveIcon className="text-white w-3.5 h-3.5" />
                  </span>
                  <span className="font-semibold text-sm text-brand-900">
                    {activeItem.label}
                  </span>
                </span>
                <ChevronDown
                  className={
                    "text-cream-800/40 w-3.5 h-3.5 transition-transform " +
                    (mobileNavOpen ? "rotate-180" : "")
                  }
                />
              </button>
              {mobileNavOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-cream-200 rounded-xl shadow-lg overflow-hidden z-20">
                  {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }, idx) => {
                    const isActive = key === active;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => selectView(key)}
                        className={
                          "w-full flex items-center gap-2.5 px-4 py-3 text-sm text-left " +
                          (idx > 0 ? "border-t border-cream-100 " : "") +
                          (isActive ? "bg-brand-100 text-brand-500 font-semibold" : "text-brand-900")
                        }
                      >
                        <Icon className="w-3.5 h-3.5" /> {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Desktop sidebar */}
          <aside className="hidden lg:block bg-white border border-cream-200 rounded-2xl p-4 h-fit">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
                <HouseIcon className="text-white w-3.5 h-3.5" />
              </div>
              <span className="font-display font-bold text-sm text-brand-900">Elevate</span>
            </div>

            <nav className="space-y-1 text-sm">
              {SIDEBAR_ITEMS.map(({ key, label, icon: Icon }) => {
                const isActive = key === active;
                const cls =
                  "w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors " +
                  (isActive
                    ? "bg-brand-100 text-brand-500 font-semibold"
                    : "text-cream-800/60 hover:bg-cream-50 hover:text-brand-900 font-medium");
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => selectView(key)}
                    className={cls}
                  >
                    <Icon className="w-3.5 h-3.5" /> {label}
                  </button>
                );
              })}
            </nav>

            {studio.isLoggedIn && (
              <div className="mt-4 pt-4 border-t border-cream-200 space-y-3">
                <p className="text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider">
                  Your credits
                </p>

                {/* Personal — always visible */}
                <div className="bg-cream-50 border border-cream-200 rounded-lg px-3 py-2 flex items-center justify-between text-xs">
                  <span className="text-cream-800/70 font-medium">Personal</span>
                  <span className="font-semibold text-brand-900">{studio.personalBalance}</span>
                </div>

                {/* Team — collapsible list so users can see every team's balance at a glance */}
                <div className="bg-cream-50 border border-cream-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTeamCreditsOpen((v) => !v)}
                    className="w-full px-3 py-2 flex items-center justify-between text-xs hover:bg-white transition-colors"
                    aria-expanded={teamCreditsOpen}
                  >
                    <span className="text-cream-800/70 font-medium flex items-center gap-1.5">
                      Team credits
                      {studio.teams.length > 0 && (
                        <span className="text-[10px] text-cream-800/40 font-normal">
                          ({studio.teams.length})
                        </span>
                      )}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="font-semibold text-brand-900">
                        {studio.teams.reduce((sum, t) => sum + (t.wallet ?? 0), 0)}
                      </span>
                      <ChevronDown
                        className={
                          "w-3 h-3 text-cream-800/40 transition-transform " +
                          (teamCreditsOpen ? "rotate-180" : "")
                        }
                      />
                    </span>
                  </button>

                  {teamCreditsOpen && (
                    <div className="border-t border-cream-200 bg-white">
                      {studio.teams.length === 0 ? (
                        <p className="px-3 py-2.5 text-[11px] text-cream-800/40 italic">
                          No teams yet
                        </p>
                      ) : (
                        <ul className="max-h-56 overflow-y-auto divide-y divide-cream-100">
                          {studio.teams.map((t) => {
                            const isSelected =
                              studio.creditSource === "team" && studio.teamId === t.id;
                            return (
                              <li key={t.id}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    studio.setCreditSource("team");
                                    studio.setTeamId(t.id);
                                  }}
                                  className={
                                    "w-full px-3 py-2 flex items-center justify-between gap-2 text-left text-[11px] transition-colors " +
                                    (isSelected
                                      ? "bg-brand-50 text-brand-500 font-semibold"
                                      : "text-cream-800/70 hover:bg-cream-50")
                                  }
                                  title={`Use ${t.name}'s credits`}
                                >
                                  <span className="truncate">{t.name}</span>
                                  <span
                                    className={
                                      "shrink-0 font-semibold " +
                                      (isSelected ? "text-brand-500" : "text-brand-900")
                                    }
                                  >
                                    {t.wallet ?? 0}
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Main */}
          <div className="space-y-5">
            {active === "new" && (
              <>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h1 className="font-display font-bold text-2xl text-brand-900">New staging</h1>
                  <button
                    type="button"
                    onClick={() => selectView("projects")}
                    className="text-xs font-semibold text-brand-500 hover:text-brand-700 flex items-center gap-1.5"
                  >
                    <FolderOpen className="w-3.5 h-3.5" fill="#4747C4"/> View your projects
                  </button>
                </div>
                <UploadCard studio={studio} />
                <CreditsProjectCard studio={studio} />
                <AreaStyleCard studio={studio} />
                <GenerateSection studio={studio} />
                <ResultsCard studio={studio} />
                <PreviewCard studio={studio} />
              </>
            )}

            {active === "projects" && <MyProjectsView />}
            {active === "uploads" && (
              <RecentUploadsView onGoToProjects={() => selectView("projects")} />
            )}
            {active === "team" && <TeamView />}
          </div>
        </div>
      </section>

      <CustomizeModal studio={studio} />
      <StudioToast />
    </div>
  );
}
