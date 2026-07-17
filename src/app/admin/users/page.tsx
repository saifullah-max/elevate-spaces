'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasRole } from "@/lib/role.helpers";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { getAdminUsers, type AdminUserRow } from "@/services/admin.service";
import { showError, showSuccess } from "@/components/toastUtils";
import { Search, RefreshCw, CheckCircle2, Clock3, Users, ShieldAlert, RotateCcw } from "lucide-react";
import { listPendingDeletions, revertAccountDeletion, type PendingDeletionUser } from "@/services/accountDeletion.service";

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [query, setQuery] = useState("");
  const [pendingDeletions, setPendingDeletions] = useState<PendingDeletionUser[]>([]);
  const [reverting, setReverting] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || !hasRole(auth.user.role, "ADMIN")) {
      router.replace("/");
      return;
    }

    setChecked(true);
  }, [router]);

  const loadPendingDeletions = async () => {
    try {
      const rows = await listPendingDeletions();
      setPendingDeletions(rows);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load pending deletions");
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [rows] = await Promise.all([getAdminUsers(), loadPendingDeletions()]);
      setUsers(rows);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRevert = async (userId: string) => {
    setReverting(userId);
    try {
      await revertAccountDeletion(userId);
      showSuccess("Account restored.");
      await loadPendingDeletions();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to revert deletion");
    } finally {
      setReverting(null);
    }
  };

  useEffect(() => {
    if (checked) {
      void loadUsers();
    }
  }, [checked]);

  const filteredUsers = useMemo(() => {
    const term = query.trim().toLowerCase();
    const sorted = [...users].sort((left, right) => {
      const leftConsent = left.aiConsentRecentAcceptedAt ? 1 : 0;
      const rightConsent = right.aiConsentRecentAcceptedAt ? 1 : 0;

      if (leftConsent !== rightConsent) {
        return rightConsent - leftConsent;
      }

      const leftTime = left.aiConsentRecentAcceptedAt ? new Date(left.aiConsentRecentAcceptedAt).getTime() : 0;
      const rightTime = right.aiConsentRecentAcceptedAt ? new Date(right.aiConsentRecentAcceptedAt).getTime() : 0;
      return rightTime - leftTime;
    });

    if (!term) {
      return sorted;
    }

    return sorted.filter((user) => {
      const roleText = user.roles.join(" ").toLowerCase();
      return [user.name, user.email, roleText].some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [users, query]);

  const consentedUsers = useMemo(() => users.filter((user) => user.aiConsentAccepted).length, [users]);
  const recentConsents = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return users.filter((user) => {
      if (!user.aiConsentRecentAcceptedAt) return false;
      return new Date(user.aiConsentRecentAcceptedAt).getTime() >= cutoff;
    }).length;
  }, [users]);

  if (!checked) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-900">Users</h1>
            <p className="mt-1 text-cream-800/70">
              View all registered users and their AI generation consent status.
            </p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <StatCard label="Total users" value={users.length} icon={<Users className="h-5 w-5 text-brand-500" />} />
          <StatCard label="AI consent accepted" value={consentedUsers} icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} />
          <StatCard label="Recent consents (7 days)" value={recentConsents} icon={<Clock3 className="h-5 w-5 text-amber-600" />} />
        </div>

        <div className="mt-6 flex items-center gap-3 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
          <Search className="h-4 w-4 text-cream-800/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, or role"
            className="w-full bg-transparent text-sm outline-none placeholder:text-cream-800/40"
          />
        </div>
      </div>

      {pendingDeletions.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-rose-200 bg-rose-50 shadow-sm">
          <div className="flex items-center justify-between border-b border-rose-200 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-rose-900">
              <ShieldAlert className="h-5 w-5" /> Pending account deletions ({pendingDeletions.length})
            </h2>
            <p className="text-xs text-rose-900/70">Users below are inactive. Restore before the purge date to keep their data.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-rose-200 text-left">
              <thead className="bg-rose-100/50">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-rose-900">User</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-rose-900">Requested at</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-rose-900">Purge at</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-rose-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-200 bg-white">
                {pendingDeletions.map((row) => (
                  <tr key={row.id}>
                    <td className="px-6 py-3">
                      <p className="text-sm font-semibold text-brand-900">{row.name || "—"}</p>
                      <p className="text-xs text-cream-800/50">{row.email}</p>
                    </td>
                    <td className="px-6 py-3 text-sm text-cream-800/80">{formatDate(row.deletion_requested_at)}</td>
                    <td className="px-6 py-3 text-sm text-cream-800/80">{formatDate(row.deletion_purge_at)}</td>
                    <td className="px-6 py-3">
                      <button
                        type="button"
                        onClick={() => handleRevert(row.id)}
                        disabled={reverting === row.id}
                        className="inline-flex items-center gap-2 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                      >
                        <RotateCcw className="h-4 w-4" />
                        {reverting === row.id ? "Restoring..." : "Restore access"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="border-b border-cream-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-brand-900">All users</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-cream-200 text-left">
            <thead className="bg-cream-50">
              <tr>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">User</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Signed up via</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Bonus claimed</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Role</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Summary</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">AI consent</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">First accepted</th>
                <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-cream-800/50">Recent accepted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 bg-white">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-cream-800/50">
                    No users found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-cream-50/70">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cream-100 text-sm font-semibold text-cream-800/80">
                          {user.name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-brand-900">{user.name || "Unnamed user"}</p>
                          <p className="text-sm text-cream-800/50">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-cream-800/80">
                      {(() => {
                        const provider = String(user.authProvider || 'LOCAL').toUpperCase();
                        const label = provider === 'LOCAL' ? 'Email (manual)' : provider.charAt(0) + provider.slice(1).toLowerCase();
                        const cls = provider === 'LOCAL'
                          ? 'bg-cream-100 text-cream-800/80'
                          : provider === 'GOOGLE'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-purple-50 text-purple-700';
                        return (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${cls}`}>
                            {label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 text-sm text-cream-800/80">
                      {user.demoBonusClaimed ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700" title={user.demoBonusClaimedAt ? formatDate(user.demoBonusClaimedAt) : undefined}>
                          +5 claimed
                        </span>
                      ) : (
                        <span className="text-xs text-cream-800/40">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-cream-800/80">
                      {user.roles.length ? user.roles.join(", ") : "USER"}
                    </td>
                    <td className="px-6 py-4 text-sm text-cream-800/80">
                      <div className="space-y-1">
                        <p>Teams owned: {user.summary.ownedTeams}</p>
                        <p>Projects: {user.summary.createdProjects}</p>
                        <p>Memberships: {user.summary.teamMemberships}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {user.aiConsentAccepted ? (
                        <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                          Accepted
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-cream-100 px-2.5 py-1 text-xs font-semibold text-cream-800/70">
                          Not accepted
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-cream-800/70">{formatDate(user.aiConsentFirstAcceptedAt)}</td>
                    <td className="px-6 py-4 text-sm text-cream-800/70">{formatDate(user.aiConsentRecentAcceptedAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-cream-200 bg-cream-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-cream-800/50">{label}</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">{value}</p>
        </div>
        <div className="rounded-full bg-white p-2 shadow-sm ring-1 ring-cream-200">
          {icon}
        </div>
      </div>
    </div>
  );
}