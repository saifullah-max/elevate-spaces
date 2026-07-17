"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Coins, X } from "lucide-react";
import {
  allocateCreditsToMember,
  transferCreditsToTeam,
} from "@/services/teams.service";
import { showError, showSuccess } from "@/components/toastUtils";
import type { Team } from "@/types/teams.types";
import { normalizeTeamRole } from "./teamRoles";

interface Props {
  open: boolean;
  onClose: () => void;
  team: Team | null;
  onAllocated: () => void;
}

type Mode = "wallet" | "member";

export default function AllocateCreditsModal({ open, onClose, team, onAllocated }: Props) {
  const [mode, setMode] = useState<Mode>("wallet");
  const [walletAmount, setWalletAmount] = useState<number>(0);
  const [memberId, setMemberId] = useState("");
  const [memberAmount, setMemberAmount] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const eligibleMembers = useMemo(() => {
    if (!team) return [];
    return (team.members || []).filter((m) => {
      const roleName = m.role?.name;
      return roleName !== "PHOTOGRAPHER" && roleName !== "TEAM_PHOTOGRAPHER";
    });
  }, [team]);

  useEffect(() => {
    if (open) {
      setMode("wallet");
      setWalletAmount(0);
      setMemberAmount(0);
      setMemberId(eligibleMembers[0]?.id ?? "");
      setSubmitting(false);
    }
  }, [open, eligibleMembers]);

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

  const teamBalance = team.wallet ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    try {
      setSubmitting(true);
      if (mode === "wallet") {
        if (walletAmount < 1) {
          showError("Enter a positive amount.");
          return;
        }
        await transferCreditsToTeam({ team_id: team.id, credits: walletAmount });
        showSuccess(`Moved ${walletAmount} credits to team wallet`);
      } else {
        if (!memberId) {
          showError("Pick a member.");
          return;
        }
        if (memberAmount < 1) {
          showError("Enter a positive amount.");
          return;
        }
        if (memberAmount > teamBalance) {
          showError(`Team only has ${teamBalance} credits available.`);
          return;
        }
        await allocateCreditsToMember({
          id: memberId,
          team_id: team.id,
          credits: memberAmount,
        });
        showSuccess(`Allocated ${memberAmount} credits`);
      }
      onAllocated();
      onClose();
    } catch (err: any) {
      showError(err?.message || "Failed to allocate credits");
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
            <Coins className="w-4 h-4" />
          </div>
          <h3 className="font-display text-lg font-bold text-brand-900">Allocate credits</h3>
        </div>
        <p className="text-xs text-cream-800/50 mb-4">
          Team wallet: <span className="font-semibold text-brand-500">{teamBalance}</span> credits
        </p>

        {/* Pill toggle — matches Personal/Team, Interior/Exterior, Monthly/Annual pattern */}
        <div className="flex bg-cream-50 border border-cream-200 rounded-lg p-1 mb-4">
          <button
            type="button"
            onClick={() => setMode("wallet")}
            className={
              "flex-1 text-center text-xs py-1.5 rounded transition-all " +
              (mode === "wallet"
                ? "bg-brand-500 text-white font-semibold"
                : "text-cream-800/50 font-medium")
            }
          >
            Add to team wallet
          </button>
          <button
            type="button"
            onClick={() => setMode("member")}
            className={
              "flex-1 text-center text-xs py-1.5 rounded transition-all " +
              (mode === "member"
                ? "bg-brand-500 text-white font-semibold"
                : "text-cream-800/50 font-medium")
            }
          >
            Assign to a member
          </button>
        </div>

        {mode === "wallet" ? (
          <>
            <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
              Credits to move from your personal wallet
            </label>
            <input
              type="number"
              min={1}
              value={walletAmount}
              onChange={(e) => setWalletAmount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-4"
            />
          </>
        ) : eligibleMembers.length === 0 ? (
          <p className="text-sm text-cream-800/70 mb-4">
            No members are eligible for allocations yet. Invite someone as a Member or Admin first.
          </p>
        ) : (
          <>
            <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
              Team member
            </label>
            <select
              value={memberId}
              onChange={(e) => setMemberId(e.target.value)}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-3"
            >
              {eligibleMembers.map((m) => {
                const label = m.user?.name || m.user?.email || m.user_id;
                const balance = m.allocated ?? 0;
                return (
                  <option key={m.id} value={m.id}>
                    {label} — {balance} credits · {normalizeTeamRole(m.role)}
                  </option>
                );
              })}
            </select>

            <label className="block text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-1.5">
              Credits to assign{" "}
              <span className="normal-case font-normal text-cream-800/40">
                (from {teamBalance} in team pool)
              </span>
            </label>
            <input
              type="number"
              min={1}
              max={teamBalance}
              value={memberAmount}
              onChange={(e) => setMemberAmount(Math.max(1, Number(e.target.value) || 1))}
              className="w-full border border-cream-200 rounded-lg px-3 py-2 text-sm bg-cream-50 mb-4"
            />
          </>
        )}

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
              (mode === "member" && (!memberId || eligibleMembers.length === 0))
            }
            className="flex-1 bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "Allocating…" : "Allocate"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
