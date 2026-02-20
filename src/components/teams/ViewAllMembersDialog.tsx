'use client'
import { Users, Check, Clock, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Team } from "@/types/teams.types";
import { AcceptedMemberCard, PendingInviteCard } from "./MemberCard";

interface ViewAllMembersDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team | null;
    getStatusBadgeColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    currentUserId?: string | null;
    onRemoveMember: (inviteId: string, teamId: string, ownerId: string) => void;
    onCancelInvitation?: (inviteId: string, teamId: string, ownerId: string) => void;
    removingMemberId?: string | null;
    onReinvite?: (inviteId: string, inviteEmail: string, teamId: string) => void;
    reinvitingInviteId?: string | null;
    reinviteMessage?: string | null;
    reinviteError?: string | null;
    cancelMessage?: string | null;
    cancelError?: string | null;
    onUpdateMemberRole?: (teamId: string, memberId: string, roleName: string) => void;
    updatingRoleMemberId?: string | null;
    roleUpdateMessage?: string | null;
    roleUpdateError?: string | null;
}

export function ViewAllMembersDialog({
    open,
    onOpenChange,
    team,
    getStatusBadgeColor,
    getStatusIcon,
    currentUserId,
    onRemoveMember,
    onCancelInvitation,
    removingMemberId,
    onReinvite,
    reinvitingInviteId,
    reinviteMessage,
    reinviteError,
    cancelMessage,
    cancelError,
    onUpdateMemberRole,
    updatingRoleMemberId,
    roleUpdateMessage,
    roleUpdateError,
}: ViewAllMembersDialogProps) {
    if (!team) return null;

    const acceptedMembers = team.teamInvites.filter(inv => inv.status === "ACCEPTED");
    const pendingInvites = team.teamInvites.filter(inv => inv.status === "PENDING");
    const failedInvites = team.teamInvites.filter(inv => inv.status === "FAILED");
    const canReinvite = !!currentUserId && team.owner_id === currentUserId;
    const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
    const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;

    const roleOptions = currentRoleName === "TEAM_OWNER"
        ? [
            { value: "TEAM_ADMIN", label: "Admin" },
            { value: "TEAM_AGENT", label: "Agent" },
            { value: "TEAM_PHOTOGRAPHER", label: "Photographer" },
        ]
        : currentRoleName === "TEAM_ADMIN"
            ? [
                { value: "TEAM_AGENT", label: "Agent" },
                { value: "TEAM_PHOTOGRAPHER", label: "Photographer" },
            ]
            : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-187.5 max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="border-b border-slate-200 pb-4">
                    <DialogTitle className="text-2xl font-bold text-slate-900">Team Members</DialogTitle>
                    <DialogDescription className="text-slate-600">
                        {team?.name} • Manage team members and invitations
                    </DialogDescription>
                </DialogHeader>

                <div className="overflow-y-auto flex-1 pr-4">
                    {reinviteMessage ? (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">{reinviteMessage}</p>
                        </div>
                    ) : null}
                    {reinviteError ? (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{reinviteError}</p>
                        </div>
                    ) : null}
                    {roleUpdateMessage ? (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">{roleUpdateMessage}</p>
                        </div>
                    ) : null}
                    {roleUpdateError ? (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{roleUpdateError}</p>
                        </div>
                    ) : null}
                    {cancelMessage ? (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-green-700 text-sm font-medium">{cancelMessage}</p>
                        </div>
                    ) : null}
                    {cancelError ? (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-red-700 text-sm font-medium">{cancelError}</p>
                        </div>
                    ) : null}
                    {team && team.teamInvites.length > 0 ? (
                        <div className="space-y-6 py-4">
                            {/* Accepted Members */}
                            {acceptedMembers.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                                        <div className="bg-green-100 p-2 rounded-lg">
                                            <Check className="w-5 h-5 text-green-700" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">
                                            Active Members ({acceptedMembers.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {acceptedMembers.map((invite) => (
                                            (() => {
                                                const memberId = invite.accepted_by_user_id || "";
                                                const member = memberId ? membershipByUserId.get(memberId) : undefined;
                                                const roleName = member?.role?.name || "TEAM_AGENT";
                                                const canEditRole = roleOptions.length > 0 && memberId && memberId !== team.owner_id;

                                                return (
                                                    <AcceptedMemberCard
                                                        key={invite.id}
                                                        email={invite.email}
                                                        joinDate={new Date(invite.accepted_at || invite.invited_at).toLocaleDateString()}
                                                        roleName={roleName}
                                                        roleOptions={canEditRole ? roleOptions : undefined}
                                                        updatingRole={updatingRoleMemberId === memberId}
                                                        onRoleChange={(newRole) =>
                                                            onUpdateMemberRole
                                                                ? onUpdateMemberRole(team.id, memberId, newRole)
                                                                : undefined
                                                        }
                                                        canRemove={
                                                            !!currentUserId &&
                                                            (invite.accepted_by_user_id === currentUserId || team.owner_id === currentUserId)
                                                        }
                                                        removing={removingMemberId === invite.id}
                                                        onRemove={() => onRemoveMember(invite.id, team.id, team.owner_id)}
                                                    />
                                                );
                                            })()
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Pending Invitations */}
                            {pendingInvites.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                                        <div className="bg-amber-100 p-2 rounded-lg">
                                            <Clock className="w-5 h-5 text-amber-700" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">
                                            Pending Invitations ({pendingInvites.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {pendingInvites.map((invite) => (
                                            <PendingInviteCard
                                                key={invite.id}
                                                email={invite.email}
                                                expiryDate={new Date(invite.expires_at).toLocaleDateString()}
                                                status="PENDING"
                                                getStatusBadgeColor={getStatusBadgeColor}
                                                getStatusIcon={getStatusIcon}
                                                showReinvite={canReinvite}
                                                reinviting={reinvitingInviteId === invite.id}
                                                onReinvite={
                                                    onReinvite
                                                        ? () => onReinvite(invite.id, invite.email, team.id)
                                                        : undefined
                                                }
                                                showCancel={canReinvite || currentRoleName === "TEAM_ADMIN"}
                                                cancelling={removingMemberId === invite.id}
                                                onCancel={
                                                    onCancelInvitation
                                                        ? () => onCancelInvitation(invite.id, team.id, team.owner_id)
                                                        : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Failed Invitations */}
                            {failedInvites.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-200">
                                        <div className="bg-red-100 p-2 rounded-lg">
                                            <X className="w-5 h-5 text-red-700" />
                                        </div>
                                        <h3 className="font-bold text-slate-900 text-lg">
                                            Failed Invitations ({failedInvites.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-2">
                                        {failedInvites.map((invite) => (
                                            <PendingInviteCard
                                                key={invite.id}
                                                email={invite.email}
                                                expiryDate={new Date(invite.invited_at).toLocaleDateString()}
                                                status="FAILED"
                                                getStatusBadgeColor={getStatusBadgeColor}
                                                getStatusIcon={getStatusIcon}
                                                showReinvite={canReinvite}
                                                reinviting={reinvitingInviteId === invite.id}
                                                onReinvite={
                                                    onReinvite
                                                        ? () => onReinvite(invite.id, invite.email, team.id)
                                                        : undefined
                                                }
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-slate-500">
                            <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                            <p className="font-medium">No members or invitations</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
