"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Coins, Info, MoreVertical, Pencil, Plus, Trash2, UserPlus, Users } from "lucide-react";
import { getTeams, leaveTeam } from "@/services/teams.service";
import { showError, showSuccess } from "@/components/toastUtils";
import { normalizeTeamRole } from "./teamRoles";
import type { Team, TeamInvite } from "@/types/teams.types";
import { getAuthFromStorage } from "@/lib/auth.storage";
import EditTeamNameModal from "./EditTeamNameModal";
import DeleteTeamModal from "./DeleteTeamModal";
import InviteTeamMemberModal from "./InviteTeamMemberModal";
import AllocateCreditsModal from "./AllocateCreditsModal";
import ViewTeamMembersModal from "./ViewTeamMembersModal";
import AddTeamModal from "./AddTeamModal";

type SubTab = "myTeams" | "partOf" | "invitations";

const SUBTABS: { key: SubTab; label: string }[] = [
  { key: "myTeams", label: "My Teams" },
  { key: "partOf", label: "Teams I'm Part Of" },
  { key: "invitations", label: "Pending Invitations" },
];

export default function TeamView() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [tab, setTab] = useState<SubTab>("myTeams");
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [editTarget, setEditTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Team | null>(null);
  const [allocateTarget, setAllocateTarget] = useState<Team | null>(null);
  const [viewTarget, setViewTarget] = useState<Team | null>(null);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const currentUserId = useMemo(() => getAuthFromStorage()?.user?.id || null, []);

  const refetch = async () => {
    try {
      const res = await getTeams();
      setTeams(res.teams || []);
    } catch {}
  };

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
        const res = await getTeams();
        setTeams(res.teams || []);
      } catch {
        setTeams([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const teamActions = {
    onInvite: (t: Team) => setInviteTarget(t),
    onAllocate: (t: Team) => setAllocateTarget(t),
    onViewAll: (t: Team) => setViewTarget(t),
    onEditName: (t: Team) => setEditTarget({ id: t.id, name: t.name }),
    onDelete: (t: Team) => setDeleteTarget({ id: t.id, name: t.name }),
  };

  const myTeams = useMemo(
    () => teams.filter((t) => t.owner_id === currentUserId),
    [teams, currentUserId]
  );
  const teamsImPartOf = useMemo(
    () => teams.filter((t) => t.owner_id !== currentUserId),
    [teams, currentUserId]
  );
  const invitations = useMemo(() => {
    const rows: (TeamInvite & { teamName: string })[] = [];
    teams.forEach((t) =>
      (t.teamInvites || []).forEach((inv) => {
        if (inv.status !== "ACCEPTED") rows.push({ ...inv, teamName: t.name });
      })
    );
    return rows;
  }, [teams]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-display font-bold text-xl text-brand-900">Team</h2>
        <button
          type="button"
          onClick={() => setAddTeamOpen(true)}
          className="bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors inline-flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add a team
        </button>
      </div>

      <div className="flex bg-white border border-cream-200 rounded-lg p-1 w-fit">
        {SUBTABS.map((s) => {
          const active = s.key === tab;
          return (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={
                "px-3 py-1.5 rounded text-xs font-semibold transition-all " +
                (active
                  ? "bg-brand-500 text-white"
                  : "text-cream-800/60 hover:text-brand-900")
              }
            >
              {s.label}
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
            to see your teams.
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white border border-cream-200 rounded-2xl h-40 animate-pulse" />
      ) : tab === "myTeams" ? (
        <MyTeamsPanel teams={myTeams} actions={teamActions} />
      ) : tab === "partOf" ? (
        <PartOfPanel teams={teamsImPartOf} currentUserId={currentUserId} onLeft={refetch} />
      ) : (
        <InvitationsPanel invitations={invitations} />
      )}

      <EditTeamNameModal
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        teamId={editTarget?.id ?? null}
        currentName={editTarget?.name ?? ""}
        onUpdated={(newName) => {
          if (editTarget) {
            setTeams((prev) =>
              prev.map((t) => (t.id === editTarget.id ? { ...t, name: newName } : t))
            );
          }
        }}
      />

      <DeleteTeamModal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        teamId={deleteTarget?.id ?? null}
        teamName={deleteTarget?.name ?? ""}
        onDeleted={() => void refetch()}
      />

      <InviteTeamMemberModal
        open={inviteTarget !== null}
        onClose={() => setInviteTarget(null)}
        team={inviteTarget}
        onInvited={() => void refetch()}
      />

      <AllocateCreditsModal
        open={allocateTarget !== null}
        onClose={() => setAllocateTarget(null)}
        team={allocateTarget}
        onAllocated={() => void refetch()}
      />

      <ViewTeamMembersModal
        open={viewTarget !== null}
        onClose={() => setViewTarget(null)}
        team={viewTarget}
      />

      <AddTeamModal
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        onCreated={() => void refetch()}
      />
    </div>
  );
}

interface TeamActions {
  onInvite: (t: Team) => void;
  onAllocate: (t: Team) => void;
  onViewAll: (t: Team) => void;
  onEditName: (t: Team) => void;
  onDelete: (t: Team) => void;
}

function TeamActionMenu({ team, actions }: { team: Team; actions: TeamActions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open]);

  const item = (
    icon: React.ReactNode,
    label: string,
    handler: () => void,
    danger = false
  ) => (
    <button
      type="button"
      onClick={() => {
        setOpen(false);
        handler();
      }}
      className={
        "w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors " +
        (danger ? "text-red-500 hover:bg-red-50" : "text-brand-900 hover:bg-cream-50")
      }
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        aria-label="Team actions"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="w-7 h-7 inline-flex items-center justify-center rounded-full text-cream-800/50 hover:bg-cream-100 hover:text-brand-900 transition-colors"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-cream-200 rounded-xl shadow-lg py-1.5 z-40 text-left">
          {item(<UserPlus className="w-3.5 h-3.5 text-cream-800/50" />, "Invite", () => actions.onInvite(team))}
          {item(<Coins className="w-3.5 h-3.5 text-cream-800/50" />, "Allocate Credits", () => actions.onAllocate(team))}
          {item(<Users className="w-3.5 h-3.5 text-cream-800/50" />, "View All", () => actions.onViewAll(team))}
          {item(<Pencil className="w-3.5 h-3.5 text-cream-800/50" />, "Edit Name", () => actions.onEditName(team))}
          <div className="border-t border-cream-200 my-1" />
          {item(<Trash2 className="w-3.5 h-3.5" />, "Delete Team", () => actions.onDelete(team), true)}
        </div>
      )}
    </div>
  );
}

function MyTeamsPanel({ teams, actions }: { teams: Team[]; actions: TeamActions }) {
  if (teams.length === 0) {
    return (
      <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center text-sm text-cream-800/60">
        You haven't created any teams yet.
      </div>
    );
  }
  return (
    <>
      {/* Desktop table */}
      <div className="hidden lg:block bg-white border border-cream-200 rounded-2xl overflow-x-visible">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="text-cream-800/50 border-b border-cream-200">
              <th className="text-left font-semibold px-5 py-3">Team Name</th>
              <th className="text-left font-semibold px-5 py-3">Description</th>
              <th className="text-left font-semibold px-5 py-3">Members</th>
              <th className="text-left font-semibold px-5 py-3">Invitations</th>
              <th className="text-left font-semibold px-5 py-3">Created</th>
              <th className="text-left font-semibold px-5 py-3">Credits Available</th>
              <th className="text-right font-semibold px-5 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {teams.map((t) => (
              <tr key={t.id} className="text-brand-900">
                <td className="px-5 py-3 font-semibold">{t.name}</td>
                <td className="px-5 py-3 text-cream-800/60 max-w-xs truncate">
                  {t.description || "—"}
                </td>
                <td className="px-5 py-3">{(t.members || []).length}</td>
                <td className="px-5 py-3">
                  {(t.teamInvites || []).filter((i) => i.status !== "ACCEPTED").length}
                </td>
                <td className="px-5 py-3 text-cream-800/60">
                  {new Date(t.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3 font-semibold text-brand-500">{t.wallet ?? 0}</td>
                <td className="px-5 py-3 text-right">
                  <TeamActionMenu team={t} actions={actions} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {teams.map((t) => (
          <div key={t.id} className="bg-white border border-cream-200 rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-brand-900 truncate">{t.name}</p>
                <span className="text-xs font-semibold text-brand-500">{t.wallet ?? 0} credits</span>
              </div>
              <TeamActionMenu team={t} actions={actions} />
            </div>
            {t.description && (
              <p className="text-xs text-cream-800/60">{t.description}</p>
            )}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-cream-800/50">
              <span>Members: {(t.members || []).length}</span>
              <span>Invitations: {(t.teamInvites || []).filter((i) => i.status !== "ACCEPTED").length}</span>
              <span>Created: {new Date(t.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function PartOfPanel({
  teams,
  currentUserId,
  onLeft,
}: {
  teams: Team[];
  currentUserId: string | null;
  onLeft: () => void;
}) {
  const [leavingId, setLeavingId] = useState<string | null>(null);

  const handleLeave = async (t: Team) => {
    if (leavingId) return;
    const confirmed = window.confirm(`Leave "${t.name}"?`);
    if (!confirmed) return;
    try {
      setLeavingId(t.id);
      const res = await leaveTeam(t.id);
      if (res.requiresCreditsTransfer) {
        showError(
          `You still have ${res.availableCredits ?? 0} team credits. Transfer them from the team page before leaving.`
        );
        return;
      }
      showSuccess(`Left "${t.name}"`);
      onLeft();
    } catch (err: any) {
      showError(err?.message || "Failed to leave the team");
    } finally {
      setLeavingId(null);
    }
  };

  if (teams.length === 0) {
    return (
      <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center text-sm text-cream-800/60">
        You're not a member of any other team yet.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {teams.map((t) => {
        const myMembership = (t.members || []).find((m) => m.user_id === currentUserId);
        const memberCount = (t.members || []).length;
        return (
          <div
            key={t.id}
            className="bg-white border border-cream-200 rounded-2xl p-5 flex items-center justify-between flex-wrap gap-3"
          >
            <div className="min-w-0">
              <p className="font-semibold text-sm text-brand-900 truncate">{t.name}</p>
              <p className="text-xs text-cream-800/50 mt-0.5">
                Owned by {t.owner?.name || t.owner?.email || "—"} · {memberCount} member
                {memberCount === 1 ? "" : "s"}
                {myMembership?.role && ` · You: ${normalizeTeamRole(myMembership.role)}`}
              </p>
              <p className="text-[11px] text-brand-500 font-semibold mt-1">
                {myMembership?.allocated ?? 0} credits allocated to you
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleLeave(t)}
              disabled={leavingId === t.id}
              className="text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-60 disabled:cursor-not-allowed shrink-0"
            >
              {leavingId === t.id ? "Leaving…" : "Leave team"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function InvitationsPanel({
  invitations,
}: {
  invitations: (TeamInvite & { teamName: string })[];
}) {
  if (invitations.length === 0) {
    return (
      <div className="bg-white border border-cream-200 rounded-2xl p-8 text-center text-sm text-cream-800/60">
        No pending invitations.
      </div>
    );
  }
  return (
    <>
      <div className="hidden lg:block bg-white border border-cream-200 rounded-2xl overflow-x-auto">
        <table className="w-full text-xs whitespace-nowrap">
          <thead>
            <tr className="text-cream-800/50 border-b border-cream-200">
              <th className="text-left font-semibold px-5 py-3">Team</th>
              <th className="text-left font-semibold px-5 py-3">Email</th>
              <th className="text-left font-semibold px-5 py-3">Role</th>
              <th className="text-left font-semibold px-5 py-3">Sent</th>
              <th className="text-left font-semibold px-5 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-200">
            {invitations.map((inv) => (
              <tr key={inv.id} className="text-brand-900">
                <td className="px-5 py-3 font-semibold">{inv.teamName}</td>
                <td className="px-5 py-3 text-cream-800/60">{inv.email}</td>
                <td className="px-5 py-3">{normalizeTeamRole(inv.role, "—")}</td>
                <td className="px-5 py-3 text-cream-800/60">
                  {new Date(inv.invited_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-3">
                  <span className="bg-brand-100 text-brand-500 text-[10px] font-bold px-2 py-1 rounded-md">
                    {inv.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="lg:hidden space-y-3">
        {invitations.map((inv) => (
          <div key={inv.id} className="bg-white border border-cream-200 rounded-2xl p-5 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="font-semibold text-brand-900 truncate">{inv.teamName}</p>
              <span className="bg-brand-100 text-brand-500 text-[10px] font-bold px-2 py-1 rounded-md">
                {inv.status}
              </span>
            </div>
            <p className="text-xs text-cream-800/60 truncate">{inv.email}</p>
            <p className="text-[11px] text-cream-800/50">
              {inv.role ? normalizeTeamRole(inv.role) + " · " : ""}Sent{" "}
              {new Date(inv.invited_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}
