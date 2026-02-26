'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Team } from "@/types/teams.types";
import { Users, Mail, Clock, AlertCircle, CheckCircle } from "lucide-react";

interface TeamMembersCreditsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team | null;
}

export function TeamMembersCreditsModal({
  open,
  onOpenChange,
  team,
}: TeamMembersCreditsModalProps) {
  if (!team) return null;

  const activeMembers = team.members.filter(mem => mem.deleted_at === null);
  const acceptedInvites = team.teamInvites?.filter(inv => inv.status === "ACCEPTED") || [];
  const pendingInvites = team.teamInvites?.filter(inv => inv.status === "PENDING") || [];
  const failedInvites = team.teamInvites?.filter(inv => inv.status === "FAILED") || [];

  const totalAllocated = activeMembers.reduce((sum, m) => sum + m.allocated, 0);
  const totalUsed = activeMembers.reduce((sum, m) => sum + m.used, 0);
  const totalAvailable = activeMembers.reduce((sum, m) => sum + Math.max(0, m.allocated - m.used), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="border-b border-slate-200 pb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-slate-900">{team.name}</DialogTitle>
              <DialogDescription className="text-slate-600">
                Team members, invitations & credit allocation
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-y-auto flex-1 px-6 py-4">
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-linear-to-br from-indigo-50 to-indigo-100 rounded-lg p-4 border border-indigo-200">
                <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wide">Members</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{activeMembers.length}</p>
              </div>
              <div className="bg-linear-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide">Total Allocated</p>
                <p className="text-2xl font-bold text-blue-900 mt-1">{totalAllocated}</p>
              </div>
              <div className="bg-linear-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                <p className="text-xs text-orange-600 font-semibold uppercase tracking-wide">Total Used</p>
                <p className="text-2xl font-bold text-orange-900 mt-1">{totalUsed}</p>
              </div>
              <div className="bg-linear-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                <p className="text-xs text-green-600 font-semibold uppercase tracking-wide">Available</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{totalAvailable}</p>
              </div>
            </div>

            {/* Active Members Section */}
            {activeMembers.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-200">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-700" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Active Members ({activeMembers.length})</h3>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 hover:bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">Member</TableHead>
                        <TableHead className="font-semibold text-slate-700">Role</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Allocated</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Used</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Available</TableHead>
                        <TableHead className="font-semibold text-slate-700 text-right">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeMembers.map((member) => {
                        const available = Math.max(0, member.allocated - member.used);
                        const isOwner = team.owner_id === member.user_id;
                        return (
                          <TableRow key={member.id} className="hover:bg-slate-50 border-b border-slate-100">
                            <TableCell className="py-4">
                              <div>
                                <p className="font-medium text-sm text-slate-900">
                                  {member.user.name || "Unknown"}
                                  {isOwner && <span className="ml-2 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">OWNER</span>}
                                </p>
                                <p className="text-xs text-slate-500">{member.user.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="py-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {member.role.name.replace("TEAM_", "")}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-right font-medium text-slate-900">{member.allocated}</TableCell>
                            <TableCell className="py-4 text-right">
                              <span className="font-medium text-orange-600">{member.used}</span>
                            </TableCell>
                            <TableCell className="py-4 text-right">
                              <span className={`font-semibold ${available > 0 ? "text-green-600" : "text-slate-400"}`}>
                                {available}
                              </span>
                            </TableCell>
                            <TableCell className="py-4 text-right text-xs text-slate-500">
                              {new Date(member.joined_at).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* Pending Invitations */}
            {pendingInvites.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-200">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-700" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Pending Invitations ({pendingInvites.length})</h3>
                </div>
                <div className="space-y-2">
                  {pendingInvites.map((invite) => (
                    <div key={invite.id} className="p-3 border border-amber-200 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-amber-600" />
                            <span className="font-medium text-slate-900">{invite.email}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                            <span>Expires: <span className="font-semibold">{new Date(invite.expires_at).toLocaleDateString()}</span></span>
                          </div>
                        </div>
                        <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-200 text-amber-800">
                          PENDING
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Failed Invitations */}
            {failedInvites.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b-2 border-slate-200">
                  <div className="bg-red-100 p-2 rounded-lg">
                    <AlertCircle className="w-5 h-5 text-red-700" />
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Failed Invitations ({failedInvites.length})</h3>
                </div>
                <div className="space-y-2">
                  {failedInvites.map((invite) => (
                    <div key={invite.id} className="p-3 border border-red-200 rounded-lg bg-red-50 hover:bg-red-100 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-red-600" />
                            <span className="font-medium text-slate-900">{invite.email}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-600">
                            <span>Sent: <span className="font-semibold">{new Date(invite.invited_at).toLocaleDateString()}</span></span>
                          </div>
                        </div>
                        <div className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-200 text-red-800">
                          FAILED
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {activeMembers.length === 0 && pendingInvites.length === 0 && failedInvites.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p className="font-medium">No members or invitations</p>
                <p className="text-sm">Invite team members to get started</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
