"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import type { Team } from "@/types/teams.types";
import { normalizeTeamRole } from "./teamRoles";

interface Props {
  open: boolean;
  onClose: () => void;
  team: Team | null;
}

export default function ViewTeamMembersModal({ open, onClose, team }: Props) {
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

  const members = team.members || [];
  const pendingInvites = (team.teamInvites || []).filter((i) => i.status !== "ACCEPTED");
  const ownerName = team.owner?.name || team.owner?.email || "Owner";

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-brand-900/50 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full shadow-xl max-h-[85vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200 shrink-0">
          <h3 className="font-display text-lg font-bold text-brand-900 truncate">
            {team.name} — Members
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-cream-800/40 hover:text-brand-900 shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-cream-800/50 border-b border-cream-200">
                  <th className="text-left font-semibold pb-2 pr-3">Name</th>
                  <th className="text-left font-semibold pb-2 pr-3">Role</th>
                  <th className="text-left font-semibold pb-2">Allocated credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {/* Owner always shown first */}
                <tr>
                  <td className="py-3 pr-3 font-semibold text-brand-900">{ownerName}</td>
                  <td className="py-3 pr-3 text-cream-800/70">Owner</td>
                  <td className="py-3 font-semibold text-brand-500">{team.wallet ?? 0}</td>
                </tr>
                {members
                  .filter((m) => m.user_id !== team.owner_id)
                  .map((m) => {
                    const name = m.user?.name || m.user?.email || m.user_id;
                    return (
                      <tr key={m.id}>
                        <td className="py-3 pr-3 font-semibold text-brand-900">{name}</td>
                        <td className="py-3 pr-3 text-cream-800/70">
                          {normalizeTeamRole(m.role)}
                        </td>
                        <td className="py-3 font-semibold text-brand-500">
                          {m.allocated ?? 0}
                        </td>
                      </tr>
                    );
                  })}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-cream-800/50">
                      No other members yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {pendingInvites.length > 0 && (
            <section>
              <p className="text-[10px] font-semibold text-cream-800/50 uppercase tracking-wider mb-2">
                Pending invitations
              </p>
              <ul className="divide-y divide-cream-100 border border-cream-200 rounded-xl overflow-hidden">
                {pendingInvites.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-brand-900 truncate">{inv.email}</p>
                      <p className="text-[11px] text-cream-800/50">
                        {normalizeTeamRole(inv.role)} · Sent{" "}
                        {new Date(inv.invited_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-100 text-brand-500 px-2 py-0.5 rounded-md shrink-0">
                      {inv.status}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <div className="px-6 py-4 border-t border-cream-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="border border-cream-200 hover:bg-cream-50 text-brand-900 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
