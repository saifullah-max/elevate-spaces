'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { hasRole } from '@/lib/role.helpers';
import { getAuthFromStorage } from '@/lib/auth.storage';
import {
  createEnterprisePaymentLink,
  getAdminUsers,
  getOwnedTeamsByEmail,
  type AdminTeamOwnerCandidate,
  type AdminOwnedTeam,
  type AdminUserRow,
} from '@/services/admin.service';
import { showError, showSuccess } from '@/components/toastUtils';
import { Link2, RefreshCw, Search } from 'lucide-react';

export default function AdminEnterprisePlansPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [creatingLink, setCreatingLink] = useState(false);

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [email, setEmail] = useState('');
  const [selectedEmail, setSelectedEmail] = useState('');
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [ownerCandidates, setOwnerCandidates] = useState<AdminTeamOwnerCandidate[]>([]);
  const [teams, setTeams] = useState<AdminOwnedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState('');

  const [normalSeats, setNormalSeats] = useState(10);
  const [photographerSeats, setPhotographerSeats] = useState(5);
  const [credits, setCredits] = useState(1000);
  const [amountUsd, setAmountUsd] = useState(499);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [autoRenew, setAutoRenew] = useState(true);

  const [paymentLink, setPaymentLink] = useState('');

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || !hasRole(auth.user.role, 'ADMIN')) {
      router.replace('/');
      return;
    }
    setChecked(true);
  }, [router]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const rows = await getAdminUsers();
      setUsers(rows);
    } catch (error: any) {
      showError(error?.message || 'Failed to load user emails');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    if (checked) {
      void loadUsers();
    }
  }, [checked]);

  const userEmailOptions = useMemo(() => {
    return users
      .map((user) => user.email)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));
  }, [users]);

  const selectedTeam = useMemo(() => {
    return teams.find((team) => team.id === selectedTeamId) || null;
  }, [teams, selectedTeamId]);

  useEffect(() => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setSelectedEmail('');
      setTeams([]);
      setSelectedTeamId('');
      setOwnerName(null);
      setOwnerCandidates([]);
      setLoadingTeams(false);
      setPaymentLink('');
      return;
    }

    if (normalizedEmail !== selectedEmail) {
      setSelectedEmail('');
      setTeams([]);
      setSelectedTeamId('');
      setOwnerName(null);
      setOwnerCandidates([]);
      setPaymentLink('');
      return;
    }

    let cancelled = false;
    const loadTeams = async () => {
      setLoadingTeams(true);
      setPaymentLink('');
      try {
        const response = await getOwnedTeamsByEmail(normalizedEmail);
        if (cancelled) return;
        setOwnerName(response.owner?.name || null);
        setOwnerCandidates(response.ownerCandidates || []);
        setTeams(response.teams || []);
        setSelectedTeamId((currentTeamId) => {
          if (response.teams?.some((team) => team.id === currentTeamId)) {
            return currentTeamId;
          }
          return response.teams?.[0]?.id || '';
        });
      } catch (error: any) {
        if (cancelled) return;
        setTeams([]);
        setSelectedTeamId('');
        setOwnerName(null);
        setOwnerCandidates([]);
        showError(error?.message || 'Failed to load owned teams');
      } finally {
        if (!cancelled) {
          setLoadingTeams(false);
        }
      }
    };

    void loadTeams();

    return () => {
      cancelled = true;
    };
  }, [email, selectedEmail]);

  const matchingEmails = useMemo(() => {
    const term = email.trim().toLowerCase();
    if (!term) {
      return [];
    }

    return userEmailOptions.filter((userEmail) => userEmail.toLowerCase().includes(term)).slice(0, 10);
  }, [email, userEmailOptions]);

  const handleEmailSelect = (selectedValue: string) => {
    setEmail(selectedValue);
    setSelectedEmail(selectedValue.trim().toLowerCase());
    setLoadingTeams(false);
  };

  const handleCreateLink = async () => {
    if (!email.trim()) {
      showError('Owner email is required');
      return;
    }
    if (!selectedEmail || selectedEmail !== email.trim().toLowerCase()) {
      showError('Please select a valid email from the suggestions');
      return;
    }
    if (!selectedTeamId) {
      showError('Please select a team');
      return;
    }
    if (normalSeats < 0 || photographerSeats < 0 || credits < 0 || amountUsd < 0) {
      showError('Seats, credits and amount must be non-negative');
      return;
    }

    setCreatingLink(true);
    try {
      const response = await createEnterprisePaymentLink({
        ownerEmail: email.trim().toLowerCase(),
        teamId: selectedTeamId,
        normalSeats,
        photographerSeats,
        credits,
        amountUsd,
        billingCycle,
        autoRenew,
      });
      setPaymentLink(response.url);
      showSuccess('Enterprise payment link created successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to create payment link');
    } finally {
      setCreatingLink(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-brand-900">Enterprise Plan Creator</h1>
            <p className="mt-1 text-cream-800/70">
              Create a custom enterprise subscription link for a team owner. Once paid, activation happens automatically.
            </p>
          </div>
          <button
            type="button"
            onClick={loadUsers}
            disabled={loadingUsers}
            className="inline-flex items-center justify-center gap-2 rounded-md bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            Refresh emails
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-xl border border-cream-200 bg-cream-50 px-4 py-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Owner email</label>
            <div className="mt-2 flex items-center gap-2">
              <Search className="h-4 w-4 text-cream-800/40" />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Search and select user email"
                className="w-full bg-transparent text-sm outline-none placeholder:text-cream-800/40"
                autoComplete="off"
              />
            </div>
            {!!matchingEmails.length && !selectedEmail && (
              <div className="mt-3 space-y-2 rounded-lg border border-cream-200 bg-white p-2 shadow-sm">
                {matchingEmails.map((match) => (
                  <button
                    key={match}
                    type="button"
                    onClick={() => handleEmailSelect(match)}
                    className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-cream-800/80 hover:bg-cream-50"
                  >
                    <span>{match}</span>
                    <span className="text-xs text-cream-800/40">Select</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedEmail ? (
            <div className="rounded-xl border border-cream-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Selected email</p>
                  <p className="mt-1 text-sm font-medium text-brand-900">{selectedEmail}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEmail('');
                    setTeams([]);
                    setSelectedTeamId('');
                    setOwnerName(null);
                    setOwnerCandidates([]);
                    setPaymentLink('');
                  }}
                  className="rounded-md bg-cream-100 px-3 py-1.5 text-xs font-semibold text-cream-800/80 hover:bg-cream-200"
                >
                  Clear
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-brand-900">Plan Configuration</h2>
        <p className="mt-1 text-sm text-cream-800/70">
          {ownerName ? `Selected owner: ${ownerName}` : 'Select an email suggestion to load teams.'}
        </p>
        {!!ownerCandidates.length && (
          <p className="mt-1 text-xs text-cream-800/50">
            Matches found: {ownerCandidates.length}. Using {ownerCandidates[0]?.email || 'best match'}.
          </p>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-cream-800/80">Team</span>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="">Select a team</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-cream-800/80">Billing cycle</span>
            <select
              value={billingCycle}
              onChange={(e) => setBillingCycle(e.target.value as 'monthly' | 'annual')}
              className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              <option value="monthly">Monthly</option>
              <option value="annual">Annual</option>
            </select>
          
          {billingCycle === 'monthly' && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-cream-800/80">Auto-renew</span>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="autoRenew"
                    checked={autoRenew === true}
                    onChange={() => setAutoRenew(true)}
                  />
                  <span>On</span>
                </label>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="autoRenew"
                    checked={autoRenew === false}
                    onChange={() => setAutoRenew(false)}
                  />
                  <span>Off</span>
                </label>
              </div>
            </div>
          )}
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-cream-800/80">Normal seats</span>
            <input
              type="number"
              min={0}
              value={normalSeats}
              onChange={(e) => setNormalSeats(Number(e.target.value || 0))}
              className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-cream-800/80">Photographer-only seats</span>
            <input
              type="number"
              min={0}
              value={photographerSeats}
              onChange={(e) => setPhotographerSeats(Number(e.target.value || 0))}
              className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-cream-800/80">Credits per cycle</span>
            <input
              type="number"
              min={0}
              value={credits}
              onChange={(e) => setCredits(Number(e.target.value || 0))}
              className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-cream-800/80">Amount payable (USD)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amountUsd}
              onChange={(e) => setAmountUsd(Number(e.target.value || 0))}
              className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </label>
        </div>

        {selectedTeam && (
          <p className="mt-4 rounded-lg bg-cream-50 px-3 py-2 text-sm text-cream-800/70">
            Team wallet balance: <span className="font-semibold text-brand-900">{selectedTeam.wallet}</span>
          </p>
        )}

        <div className="mt-5">
          <button
            type="button"
            onClick={handleCreateLink}
            disabled={creatingLink || !selectedTeamId}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            <Link2 className="h-4 w-4" />
            {creatingLink ? 'Creating link...' : 'Create Stripe payment link'}
          </button>
        </div>

        {paymentLink && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Payment link generated</p>
            <input
              value={paymentLink}
              readOnly
              className="mt-2 w-full rounded-md border border-emerald-200 bg-white px-3 py-2 text-sm text-cream-800/80"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(paymentLink);
                  showSuccess('Payment link copied');
                }}
                className="rounded-md bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-600"
              >
                Copy link
              </button>
              <a
                href={paymentLink}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-cream-800/80 ring-1 ring-cream-200 hover:bg-cream-50"
              >
                Open link
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
