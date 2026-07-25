"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Camera, FolderOpen, Images, Info, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import {
  deleteProject,
  getMyProjects,
  getProjectImages,
  getProjectPhotographers,
} from "@/services/projects.service";
import type { Project, ProjectMember } from "@/types/projects.types";
import { getAuthFromStorage } from "@/lib/auth.storage";
import ProjectViewModal from "./ProjectViewModal";
import RenameProjectModal from "./RenameProjectModal";
import ManagePhotographerModal from "./ManagePhotographerModal";
import NewProjectModal from "./NewProjectModal";

type ProjectFilter = "all" | "personal" | "team";

const FILTERS: { key: ProjectFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "personal", label: "Personal" },
  { key: "team", label: "Team" },
];

function findPhotographerMember(members: ProjectMember[] | undefined): ProjectMember | null {
  if (!members?.length) return null;
  return (
    members.find((m) => {
      const anyM = m as unknown as { role: unknown };
      const role = anyM.role;
      const roleName =
        typeof role === "string"
          ? role
          : (role as { name?: string } | null | undefined)?.name;
      return roleName === "PHOTOGRAPHER" || roleName === "TEAM_PHOTOGRAPHER";
    }) ?? null
  );
}

function photographerDisplayName(member: ProjectMember | null): string | null {
  if (!member) return null;
  return member.user?.name || member.user?.email || null;
}

/**
 * Normalize whatever GET /projects/:id/photographers returns into a ProjectMember-shaped
 * object we can render. Backend shape varies - the response may be a bare array, wrapped
 * as { photographers: [...] }, { data: {...} }, or { members: [...] }.
 */
function extractPhotographer(payload: unknown): ProjectMember | null {
  if (!payload) return null;
  const anyP = payload as any;
  const list: any[] = Array.isArray(anyP)
    ? anyP
    : anyP.photographers ||
      anyP.data?.photographers ||
      anyP.data ||
      anyP.members ||
      [];
  if (!Array.isArray(list) || list.length === 0) return null;
  const raw = list[0];
  // If the item already looks like a ProjectMember with `user`, keep it. Otherwise
  // treat it as a user record and wrap.
  if (raw?.user) return raw as ProjectMember;
  return {
    id: raw?.id || raw?.member_id || "",
    project_id: raw?.project_id || "",
    user_id: raw?.user_id || raw?.id || "",
    role: "PHOTOGRAPHER",
    assigned_at: raw?.assigned_at || raw?.created_at || "",
    user: {
      id: raw?.id || raw?.user_id || "",
      name: raw?.name || raw?.user?.name,
      email: raw?.email || raw?.user?.email || "",
    } as ProjectMember["user"],
  };
}

export default function MyProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filter, setFilter] = useState<ProjectFilter>("all");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [covers, setCovers] = useState<Record<string, string | null>>({});
  const [photographers, setPhotographers] = useState<Record<string, ProjectMember | null>>({});
  const [openProject, setOpenProject] = useState<{ id: string; name: string } | null>(null);
  const [renameTarget, setRenameTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [photographerTarget, setPhotographerTarget] = useState<{
    id: string;
    current: ProjectMember | null;
  } | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!openMenuId) return;
    const onDocClick = (e: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [openMenuId]);

  const refetchProjects = async () => {
    try {
      const res = await getMyProjects();
      setProjects(res.projects || []);
      // Photographer and cover caches are keyed by project id; wiping them here
      // forces fresh lookups after a refetch (needed after add/remove/rename).
      setPhotographers({});
      setCovers({});
    } catch {}
  };

  const handleDeleteProject = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProject(deleteTarget.id);
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err?.message || "Failed to delete project");
    } finally {
      setDeleting(false);
    }
  };

  // Refetch when the tab regains focus / becomes visible again - so a photographer
  // who was removed sees the project disappear without needing a hard reload.
  useEffect(() => {
    if (!loggedIn) return;
    const onFocus = () => void refetchProjects();
    const onVisibility = () => {
      if (document.visibilityState === "visible") void refetchProjects();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  useEffect(() => {
    const auth = getAuthFromStorage();
    const isLoggedIn = Boolean(auth?.token);
    setLoggedIn(isLoggedIn);
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await getMyProjects();
        setProjects(res.projects || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load projects");
        setProjects([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Lazy-load a single cover thumbnail per project (first staged variant, else original).
  useEffect(() => {
    if (!loggedIn || projects.length === 0) return;
    let cancelled = false;
    (async () => {
      const missing = projects.filter((p) => !(p.id in covers));
      await Promise.all(
        missing.map(async (p) => {
          try {
            const res = await getProjectImages(p.id);
            const groups = res?.data?.imageGroups || [];
            const first = groups[0];
            const url =
              first?.stagedVersions?.[0]?.url || first?.original?.url || null;
            if (!cancelled) setCovers((c) => ({ ...c, [p.id]: url }));
          } catch {
            if (!cancelled) setCovers((c) => ({ ...c, [p.id]: null }));
          }
        })
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, loggedIn]);

  // Lazy-load the assigned photographer per project - the /projects response
  // returns members: [] regardless, so we hit /projects/:id/photographers directly.
  useEffect(() => {
    if (!loggedIn || projects.length === 0) return;
    let cancelled = false;
    (async () => {
      const missing = projects.filter((p) => !(p.id in photographers));
      await Promise.all(
        missing.map(async (p) => {
          try {
            const res = await getProjectPhotographers(p.id);
            const member = extractPhotographer(res);
            if (!cancelled) setPhotographers((c) => ({ ...c, [p.id]: member }));
          } catch {
            if (!cancelled) setPhotographers((c) => ({ ...c, [p.id]: null }));
          }
        })
      );
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, loggedIn]);

  const refetchPhotographer = async (projectId: string) => {
    try {
      const res = await getProjectPhotographers(projectId);
      setPhotographers((c) => ({ ...c, [projectId]: extractPhotographer(res) }));
    } catch {
      setPhotographers((c) => ({ ...c, [projectId]: null }));
    }
  };

  const userId = useMemo(() => getAuthFromStorage()?.user?.id || null, []);

  const isPersonal = (p: Project) =>
    !p.team_id || !p.team || p.team.owner_id === userId;

  const visible = useMemo(() => {
    if (filter === "all") return projects;
    if (filter === "personal") return projects.filter(isPersonal);
    return projects.filter((p) => !isPersonal(p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, filter, userId]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display font-bold text-xl text-brand-900">Your Projects</h2>
          <p className="text-xs text-cream-800/50 mt-1 max-w-md">
            Photos saved to a project don't expire. Personal projects are just for you; team projects
            are visible to the team owner, any team admins, and anyone you invite.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setNewProjectOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-3 h-3" /> New Project
        </button>
      </div>

      <div className="flex bg-white border border-cream-200 rounded-lg p-1 w-fit">
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={
                "px-4 py-1.5 rounded text-xs transition-all " +
                (active
                  ? "bg-brand-500 text-white font-semibold"
                  : "text-cream-800/60 font-medium hover:text-brand-900")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {!loggedIn ? (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5 flex items-start gap-3">
          <Info className="w-4 h-4 text-brand-500 mt-0.5" />
          <p className="text-xs text-brand-900">
            <Link href="/sign-in?next=/studio" className="font-semibold underline">
              Sign in
            </Link>{" "}
            to see your projects.
          </p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-xs text-red-700">
          {error}
        </div>
      ) : loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white border border-cream-200 rounded-2xl h-64 animate-pulse" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center">
          <FolderOpen className="w-6 h-6 text-cream-800/40 mx-auto mb-2" />
          <p className="text-sm font-semibold text-brand-900">No projects yet</p>
          <p className="text-xs text-cream-800/50 mt-1">
            Create a project to keep a listing's photos, styling, and results together.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visible.map((p) => {
            const personal = isPersonal(p);
            const cover = covers[p.id];
            const coverLoading = !(p.id in covers);
            // Prefer the dedicated /photographers endpoint result; fall back to
            // whatever the /projects response happened to include (usually nothing).
            const photographerMember =
              photographers[p.id] ?? findPhotographerMember(p.members);
            const photographerName = photographerDisplayName(photographerMember);
            const menuOpen = openMenuId === p.id;
            const openView = () => setOpenProject({ id: p.id, name: p.name });
            return (
              <div
                key={p.id}
                className="group bg-white border border-cream-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-brand-500/40 transition-all flex flex-col relative"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openView}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openView();
                    }
                  }}
                  className="relative aspect-[4/3] bg-cream-100 cursor-pointer"
                >
                  {coverLoading ? (
                    <div className="absolute inset-0 animate-pulse bg-cream-100" />
                  ) : cover ? (
                    <img
                      src={cover}
                      alt={p.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-cream-800/30">
                      <FolderOpen className="w-8 h-8" />
                    </div>
                  )}
                  <span
                    className={
                      "absolute top-3 left-3 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full " +
                      (personal ? "bg-white/90 text-brand-900" : "bg-brand-500 text-white")
                    }
                  >
                    {personal ? "Personal" : p.team?.name || "Team"}
                  </span>

                  {/* Actions ellipsis - visible on hover / when menu open */}
                  <div
                    ref={menuOpen ? menuRef : undefined}
                    className={
                      "absolute top-2.5 right-2.5 " +
                      (menuOpen
                        ? "opacity-100"
                        : "opacity-0 group-hover:opacity-100 focus-within:opacity-100")
                    }
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      aria-label="Project actions"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId((prev) => (prev === p.id ? null : p.id));
                      }}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-white flex items-center justify-center text-brand-900 shadow-sm"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {menuOpen && (
                      <div className="absolute top-full right-0 mt-2 w-52 bg-white border border-cream-200 rounded-xl shadow-xl overflow-hidden z-30">
                        <MenuItem
                          icon={<Images className="w-3.5 h-3.5 text-cream-800/40" />}
                          label="View Images"
                          onClick={() => {
                            setOpenMenuId(null);
                            openView();
                          }}
                        />
                        <MenuItem
                          icon={<Pencil className="w-3.5 h-3.5 text-cream-800/40" />}
                          label="Rename"
                          onClick={() => {
                            setOpenMenuId(null);
                            setRenameTarget({ id: p.id, name: p.name });
                          }}
                        />
                        <MenuItem
                          icon={<Camera className="w-3.5 h-3.5 text-cream-800/40" />}
                          label="Manage photographer"
                          onClick={() => {
                            setOpenMenuId(null);
                            setPhotographerTarget({
                              id: p.id,
                              current: photographerMember,
                            });
                          }}
                        />
                        <div className="border-t border-cream-200" />
                        <MenuItem
                          icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                          label="Delete project"
                          onClick={() => {
                            setOpenMenuId(null);
                            setDeleteTarget({ id: p.id, name: p.name });
                          }}
                          danger
                        />
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <p className="font-semibold text-sm text-brand-900 truncate">{p.name}</p>
                  <p className="text-xs text-cream-800/50 mt-0.5 truncate">
                    {p.address || "No address yet"} - Created {new Date(p.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-cream-100 gap-2">
                    {photographerName ? (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-accent-600 truncate">
                        <Camera className="w-3 h-3 shrink-0" />
                        <span className="truncate">{photographerName}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium text-cream-800/40">
                        <Camera className="w-3 h-3" /> No photographer
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={openView}
                      className="text-[11px] font-semibold text-brand-500 hover:text-brand-700 shrink-0"
                    >
                      View Images
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ProjectViewModal
        open={openProject !== null}
        onClose={() => setOpenProject(null)}
        projectId={openProject?.id ?? null}
        projectName={openProject?.name ?? ""}
      />

      <RenameProjectModal
        open={renameTarget !== null}
        onClose={() => setRenameTarget(null)}
        projectId={renameTarget?.id ?? null}
        currentName={renameTarget?.name ?? ""}
        onRenamed={(newName) => {
          if (renameTarget) {
            setProjects((prev) =>
              prev.map((p) => (p.id === renameTarget.id ? { ...p, name: newName } : p))
            );
          }
        }}
      />

      <NewProjectModal
        open={newProjectOpen}
        onClose={() => setNewProjectOpen(false)}
        onCreated={() => void refetchProjects()}
      />

      <ManagePhotographerModal
        open={photographerTarget !== null}
        onClose={() => setPhotographerTarget(null)}
        projectId={photographerTarget?.id ?? null}
        currentPhotographer={
          photographerTarget ? photographers[photographerTarget.id] ?? photographerTarget.current : null
        }
        onUpdated={() => {
          if (photographerTarget) void refetchPhotographer(photographerTarget.id);
        }}
      />

      {deleteTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-brand-900/50 backdrop-blur-sm"
          onClick={() => !deleting && setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl"
          >
            <h3 className="font-display text-lg font-bold text-brand-900 mb-2">Delete project?</h3>
            <p className="text-sm text-cream-800/70 mb-6">
              This will permanently delete{" "}
              <span className="font-semibold text-brand-900">"{deleteTarget.name}"</span> and all its
              photos. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProject}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-left " +
        (danger ? "text-red-600 hover:bg-red-50" : "text-cream-800/80 hover:bg-cream-50")
      }
    >
      {icon} {label}
    </button>
  );
}
