'use client'
import { useState, useEffect } from "react";
import {
    allocateCreditsToMember, createTeam, getTeams,
    getTeamsByUserId, inviteTeamMember, reinviteTeamMember,
    removeTeamMember, updateTeamMemberRole, leaveTeam,
    transferCreditsBeforeLeaving, completeLeaveTeam,
    deleteTeam, cancelInvitation, updateTeamName
} from "@/services/teams.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { Get_Teams_Response, Team } from "@/types/teams.types";
import { LoginPrompt } from "@/components/teams/LoginPrompt";
import { TeamsHeader } from "@/components/teams/TeamsHeader";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { TeamsTable } from "@/components/teams/TeamsTable";
import { MemberTeamsTable } from "@/components/teams/MemberTeamsTable";
import { ViewAllMembersDialog } from "@/components/teams/ViewAllMembersDialog";
import { InviteMemberDialog } from "@/components/teams/InviteMemberDialog";
import { AllocateCreditsDialog } from "@/components/teams/AllocateCreditsDialog";
import { TransferCreditsDialog } from "@/components/teams/TransferCreditsDialog";
import { TransferCreditsBeforeLeavingModal } from "@/components/teams/TransferCreditsBeforeLeavingModal";
import { getStatusBadgeColor, getStatusIcon } from "@/components/teams/utils";
import { DeleteTeamModal } from "@/components/teams/DeleteTeamModal";
import { LeaveTeamModal } from "@/components/teams/LeaveTeamModal";
import { EditTeamNameDialog } from "@/components/teams/EditTeamNameDialog";


export default function Teams() {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
    const [teamId, setTeamId] = useState("");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteSubject, setInviteSubject] = useState("");
    const [inviteText, setInviteText] = useState("");
    const [inviteRole, setInviteRole] = useState("TEAM_AGENT");
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [teams, setTeams] = useState<Get_Teams_Response | null>(null);
    const [memberTeams, setMemberTeams] = useState<Get_Teams_Response | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [viewAllMembersOpen, setViewAllMembersOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [reinvitingInviteId, setReinvitingInviteId] = useState<string | null>(null);
    const [reinviteMessage, setReinviteMessage] = useState<string | null>(null);
    const [reinviteError, setReinviteError] = useState<string | null>(null);
    const [cancelMessage, setCancelMessage] = useState<string | null>(null);
    const [cancelError, setCancelError] = useState<string | null>(null);
    const [updatingRoleMemberId, setUpdatingRoleMemberId] = useState<string | null>(null);
    const [roleUpdateMessage, setRoleUpdateMessage] = useState<string | null>(null);
    const [roleUpdateError, setRoleUpdateError] = useState<string | null>(null);
    const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
    const [allocateMemberId, setAllocateMemberId] = useState("");
    const [allocateCredits, setAllocateCredits] = useState("");
    const [allocateLoading, setAllocateLoading] = useState(false);
    const [allocateError, setAllocateError] = useState<string | null>(null);
    const [allocateMessage, setAllocateMessage] = useState<string | null>(null);
    const [transferDialogOpen, setTransferDialogOpen] = useState(false);
    const [transferMemberId, setTransferMemberId] = useState("");
    const [transferCredits, setTransferCredits] = useState("");
    const [transferLoading, setTransferLoading] = useState(false);
    const [transferError, setTransferError] = useState<string | null>(null);
    const [transferMessage, setTransferMessage] = useState<string | null>(null);
    const [leavingTeamId, setLeavingTeamId] = useState<string | null>(null);
    const [transferCreditsModalOpen, setTransferCreditsModalOpen] = useState(false);
    const [transferCreditsTeam, setTransferCreditsTeam] = useState<Team | null>(null);
    const [transferCreditsAmount, setTransferCreditsAmount] = useState(0);
    const [transferCreditsLoading, setTransferCreditsLoading] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteModalTeam, setDeleteModalTeam] = useState<Team | null>(null);
    const [deleteModalLoading, setDeleteModalLoading] = useState(false);
    const [leaveModalOpen, setLeaveModalOpen] = useState(false);
    const [leaveModalTeam, setLeaveModalTeam] = useState<Team | null>(null);
    const [leaveModalLoading, setLeaveModalLoading] = useState(false);
    const [editNameDialogOpen, setEditNameDialogOpen] = useState(false);
    const [editNameTeam, setEditNameTeam] = useState<Team | null>(null);
    const [editNameLoading, setEditNameLoading] = useState(false);
    const [editNameError, setEditNameError] = useState<string | null>(null);
    const [editNameSuccess, setEditNameSuccess] = useState<string | null>(null);

    useEffect(() => {
        const authData = getAuthFromStorage();
        setIsAuthenticated(!!authData?.user);
        setCurrentUserId(authData?.user?.id || null);
    }, []);

    const getAllTeams = async () => {
        try {
            const authData = getAuthFromStorage();
            const userId = authData?.user?.id;
            const [ownedTeams, joinedTeams] = await Promise.all([
                getTeams(),
                userId ? getTeamsByUserId(userId) : Promise.resolve({ success: true, message: "", teams: [] }),
            ]);
            setTeams(ownedTeams);
            setMemberTeams(joinedTeams);
            if (selectedTeam) {
                const refreshed = ownedTeams.teams.find((team) => team.id === selectedTeam.id) || null;
                setSelectedTeam(refreshed);
            }
        } catch (error) {
            console.error("Failed to fetch teams", error);
        }
    }

    useEffect(() => {
        if (isAuthenticated) {
            getAllTeams();
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (!viewAllMembersOpen) {
            setReinviteMessage(null);
            setReinviteError(null);
            setCancelMessage(null);
            setCancelError(null);
            setRoleUpdateMessage(null);
            setRoleUpdateError(null);
        }
    }, [viewAllMembersOpen]);

    // Auto-dismiss messages after 5 seconds
    useEffect(() => {
        if (reinviteMessage || reinviteError) {
            const timer = setTimeout(() => {
                setReinviteMessage(null);
                setReinviteError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [reinviteMessage, reinviteError]);

    useEffect(() => {
        if (cancelMessage || cancelError) {
            const timer = setTimeout(() => {
                setCancelMessage(null);
                setCancelError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [cancelMessage, cancelError]);

    useEffect(() => {
        if (roleUpdateMessage || roleUpdateError) {
            const timer = setTimeout(() => {
                setRoleUpdateMessage(null);
                setRoleUpdateError(null);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [roleUpdateMessage, roleUpdateError]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setMessage(null);

        if (!name.trim()) {
            setError("Team name is required");
            return;
        }

        try {
            setLoading(true);

            const res = await createTeam({
                name,
                description: description || '',
            });

            setMessage("Team created successfully 🎉");
            if (res?.data?.team?.id) {
                setTeamId(res.data.team.id);
            }
            setName("");
            setDescription("");
            setCreateDialogOpen(false);
            getAllTeams();

        } catch (err: any) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const handleInviteSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError(null);
        setInviteMessage(null);

        if (!teamId.trim()) {
            setInviteError("Team ID is required");
            return;
        }

        if (!inviteEmail.trim()) {
            setInviteError("Invitee email is required");
            return;
        }

        try {
            setInviteLoading(true);

            const res = await inviteTeamMember({
                email: inviteEmail.trim(),
                subject: inviteSubject.trim() || undefined,
                text: inviteText.trim() || undefined,
                teamId: teamId.trim(),
                roleName: inviteRole,
            });

            setInviteMessage(res.message || "Invitation sent successfully 🎉");
            setInviteEmail("");
            setInviteSubject("");
            setInviteText("");
            setInviteRole("TEAM_AGENT");
            setInviteDialogOpen(false);
            getAllTeams();
        } catch (err: any) {
            setInviteError(err.message || "Invitation failed");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCancelInvitation = async (inviteId: string, teamId: string, ownerId: string) => {
        try {
            setCancelError(null);
            setCancelMessage(null);
            setRemovingMemberId(inviteId);
            await cancelInvitation({ id: inviteId });
            setCancelMessage("Invitation cancelled successfully");
            await getAllTeams();
        } catch (err: any) {
            const errorMsg = err?.message || "Failed to cancel invitation";
            setCancelError(errorMsg);
            console.error("Failed to cancel invitation", errorMsg);
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleRemoveMember = async (inviteId: string, teamId: string, ownerId: string) => {
        try {
            setRemovingMemberId(inviteId);
            await removeTeamMember({
                id: inviteId,
                team_id: teamId,
                owner_id: ownerId,
            });
            await getAllTeams();
        } catch (err: any) {
            console.error("Failed to remove member", err?.message || err);
        } finally {
            setRemovingMemberId(null);
        }
    };

    const handleReinvite = async (inviteId: string, inviteEmail: string, teamId: string) => {
        try {
            setReinviteError(null);
            setReinviteMessage(null);
            setReinvitingInviteId(inviteId);

            const res = await reinviteTeamMember({
                email: inviteEmail.trim(),
                subject: inviteSubject.trim() || undefined,
                text: inviteText.trim() || undefined,
                teamId: teamId.trim(),
                roleName: inviteRole,
            });

            setReinviteMessage(res.message || "Invitation re-sent successfully");
            await getAllTeams();
        } catch (err: any) {
            setReinviteError(err.message || "Reinvite failed");
        } finally {
            setReinvitingInviteId(null);
        }
    };

    const handleAllocateCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        setAllocateError(null);
        setAllocateMessage(null);

        if (!selectedTeam?.id) {
            setAllocateError("Team is required");
            return;
        }

        if (!allocateMemberId) {
            setAllocateError("Member is required");
            return;
        }

        const creditsValue = Number(allocateCredits);
        if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
            setAllocateError("Credits must be a positive number");
            return;
        }

        try {
            setAllocateLoading(true);
            const res = await allocateCreditsToMember({
                id: allocateMemberId,
                team_id: selectedTeam.id,
                credits: creditsValue,
            });
            setAllocateMessage(res.message || "Credits allocated successfully");
            setAllocateCredits("");
            setAllocateMemberId("");
            await getAllTeams();
        } catch (err: any) {
            setAllocateError(err.message || "Failed to allocate credits");
        } finally {
            setAllocateLoading(false);
        }
    };

    const handleTransferCredits = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransferError(null);
        setTransferMessage(null);

        if (!selectedTeam?.id) {
            setTransferError("Team is required");
            return;
        }

        if (!transferMemberId) {
            setTransferError("Recipient is required");
            return;
        }

        const creditsValue = Number(transferCredits);
        if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
            setTransferError("Credits must be a positive number");
            return;
        }

        try {
            setTransferLoading(true);
            const res = await allocateCreditsToMember({
                id: transferMemberId,
                team_id: selectedTeam.id,
                credits: creditsValue,
            });
            setTransferMessage(res.message || "Credits transferred successfully");
            setTransferCredits("");
            setTransferMemberId("");
            setTransferDialogOpen(false);
            await getAllTeams();
        } catch (err: any) {
            setTransferError(err.message || "Failed to transfer credits");
        } finally {
            setTransferLoading(false);
        }
    };

    const handleUpdateMemberRole = async (teamId: string, memberId: string, roleName: string) => {
        try {
            setRoleUpdateError(null);
            setRoleUpdateMessage(null);
            setUpdatingRoleMemberId(memberId);
            const res = await updateTeamMemberRole({ teamId, memberId, roleName });
            setRoleUpdateMessage(res.message || "Member role updated successfully");
            await getAllTeams();
        } catch (err: any) {
            setRoleUpdateError(err.message || "Failed to update member role");
        } finally {
            setUpdatingRoleMemberId(null);
        }
    };

    const handleLeaveTeam = async (teamId: string) => {
        try {
            setLeavingTeamId(teamId);
            const result = await leaveTeam(teamId);

            if (result.requiresCreditsTransfer && result.availableCredits) {
                // Show modal for credit transfer
                const team = memberTeams?.teams.find((t) => t.id === teamId);
                setTransferCreditsTeam(team || null);
                setTransferCreditsAmount(result.availableCredits);
                setTransferCreditsModalOpen(true);
            } else {
                setMessage("You have successfully left the team");
                await getAllTeams();
            }
        } catch (err: any) {
            setError(err.message || "Failed to leave the team");
        } finally {
            setLeavingTeamId(null);
        }
    };

    const handleTransferCreditsAndLeave = async (memberId?: string, credits?: number) => {
        try {
            if (!transferCreditsTeam) return;

            setTransferCreditsLoading(true);

            if (memberId) {
                // Transfer to member
                await transferCreditsBeforeLeaving({
                    teamId: transferCreditsTeam.id,
                    transferToUserId: memberId,
                    credits: credits || transferCreditsAmount,
                });
            } else {
                // Transfer to wallet
                await transferCreditsBeforeLeaving({
                    teamId: transferCreditsTeam.id,
                    credits: credits || transferCreditsAmount,
                });
            }

            // Complete the leave
            await completeLeaveTeam(transferCreditsTeam.id);
            setMessage("You have successfully left the team");
            setTransferCreditsModalOpen(false);
            await getAllTeams();
        } catch (err: any) {
            setError(err.message || "Failed to transfer credits and leave");
        } finally {
            setTransferCreditsLoading(false);
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        setDeleteModalLoading(true);
        try {
            await deleteTeam(teamId);
            setMessage("Team deleted successfully");
            await getAllTeams();
        } catch (err: any) {
            setError(err.message || "Failed to delete team");
        } finally {
            setDeleteModalLoading(false);
            setDeleteModalOpen(false);
            setDeleteModalTeam(null);
        }
    };

    const handleUpdateTeamName = async (newName: string) => {
        if (!editNameTeam) return;
        
        setEditNameLoading(true);
        setEditNameError(null);
        setEditNameSuccess(null);
        try {
            await updateTeamName(editNameTeam.id, newName);
            setEditNameSuccess("Team name updated successfully");
            await getAllTeams();
            setTimeout(() => {
                setEditNameDialogOpen(false);
                setEditNameError(null);
                setEditNameSuccess(null);
            }, 1500);
        } catch (err: any) {
            setEditNameError(err.message || "Failed to update team name");
        } finally {
            setEditNameLoading(false);
        }
    };

    // Show loading state while checking authentication
    if (isAuthenticated === null) {
        return null;
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return <LoginPrompt />;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-purple-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <TeamsHeader>
                    <CreateTeamDialog
                        open={createDialogOpen}
                        onOpenChange={setCreateDialogOpen}
                        name={name}
                        onNameChange={setName}
                        description={description}
                        onDescriptionChange={setDescription}
                        loading={loading}
                        message={message}
                        error={error}
                        onSubmit={handleSubmit}
                    />
                </TeamsHeader>

                <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-4">My Teams</h2>
                    <TeamsTable
                        teams={teams}
                        onEmptyStateClick={() => setCreateDialogOpen(true)}
                        onInviteClick={(team) => {
                            setSelectedTeam(team);
                            setTeamId(team.id);
                            setInviteDialogOpen(true);
                        }}
                        onAllocateCreditsClick={(team) => {
                            setSelectedTeam(team);
                            setAllocateDialogOpen(true);
                        }}
                        onViewAllClick={(team) => {
                            setSelectedTeam(team);
                            setViewAllMembersOpen(true);
                        }}
                        onDeleteClick={(team) => {
                            if (currentUserId === team.owner_id) {
                                setDeleteModalTeam(team);
                                setDeleteModalOpen(true);
                            } else {
                                setError("Only team owners can delete teams");
                            }
                        }}
                        onEditNameClick={(team) => {
                            setEditNameTeam(team);
                            setEditNameDialogOpen(true);
                        }}
                    />
                </div>

                {/* Edit Team Name Dialog */}
                {editNameTeam && (
                    <EditTeamNameDialog
                        open={editNameDialogOpen}
                        onOpenChange={setEditNameDialogOpen}
                        teamId={editNameTeam.id}
                        currentName={editNameTeam.name}
                        loading={editNameLoading}
                        error={editNameError}
                        successMessage={editNameSuccess}
                        onSubmit={handleUpdateTeamName}
                    />
                )}

                <div className="mb-10">
                    <h2 className="text-2xl font-semibold text-slate-900 mb-4">Teams I'm Part Of</h2>
                    <MemberTeamsTable
                        teams={memberTeams}
                        currentUserId={currentUserId}
                        onInviteClick={(team) => {
                            setSelectedTeam(team);
                            setTeamId(team.id);
                            setInviteDialogOpen(true);
                        }}
                        onTransferClick={(team) => {
                            setSelectedTeam(team);
                            setTransferDialogOpen(true);
                        }}
                        onLeaveClick={(team) => {
                            setLeaveModalTeam(team);
                            setLeaveModalOpen(true);
                        }}
                        onViewAllClick={(team) => {
                            setSelectedTeam(team);
                            setViewAllMembersOpen(true);
                        }}
                        onAllocateCreditsClick={(team) => {
                            setSelectedTeam(team);
                            setAllocateDialogOpen(true);
                        }}
                        onEditNameClick={(team) => {
                            setEditNameTeam(team);
                            setEditNameDialogOpen(true);
                        }}
                        onDeleteClick={(team) => {
                            setDeleteModalTeam(team);
                            setDeleteModalOpen(true);
                        }}
                    />
                    {/* Place modals at the root, after main content */}
                    <DeleteTeamModal
                        open={deleteModalOpen}
                        onOpenChange={(open) => {
                            setDeleteModalOpen(open);
                            if (!open) setDeleteModalTeam(null);
                        }}
                        teamName={deleteModalTeam?.name || ""}
                        isLoading={deleteModalLoading}
                        onDelete={() => {
                            if (deleteModalTeam) handleDeleteTeam(deleteModalTeam.id);
                        }}
                    />

                    <LeaveTeamModal
                        open={leaveModalOpen}
                        onOpenChange={(open) => {
                            setLeaveModalOpen(open);
                            if (!open) setLeaveModalTeam(null);
                        }}
                        teamName={leaveModalTeam?.name || ""}
                        isLoading={leaveModalLoading}
                        onLeave={async () => {
                            if (leaveModalTeam) {
                                setLeaveModalLoading(true);
                                await handleLeaveTeam(leaveModalTeam.id);
                                setLeaveModalLoading(false);
                                setLeaveModalOpen(false);
                                setLeaveModalTeam(null);
                            }
                        }}
                    />
                </div>

                <ViewAllMembersDialog
                    open={viewAllMembersOpen}
                    onOpenChange={setViewAllMembersOpen}
                    team={selectedTeam}
                    getStatusBadgeColor={getStatusBadgeColor}
                    getStatusIcon={getStatusIcon}
                    currentUserId={currentUserId}
                    onRemoveMember={handleRemoveMember}
                    onCancelInvitation={handleCancelInvitation}
                    removingMemberId={removingMemberId}
                    onReinvite={handleReinvite}
                    reinvitingInviteId={reinvitingInviteId}
                    reinviteMessage={reinviteMessage}
                    reinviteError={reinviteError}
                    cancelMessage={cancelMessage}
                    cancelError={cancelError}
                    onUpdateMemberRole={handleUpdateMemberRole}
                    updatingRoleMemberId={updatingRoleMemberId}
                    roleUpdateMessage={roleUpdateMessage}
                    roleUpdateError={roleUpdateError}
                />

                <InviteMemberDialog
                    open={inviteDialogOpen}
                    onOpenChange={setInviteDialogOpen}
                    team={selectedTeam}
                    email={inviteEmail}
                    onEmailChange={setInviteEmail}
                    subject={inviteSubject}
                    onSubjectChange={setInviteSubject}
                    message={inviteText}
                    onMessageChange={setInviteText}
                    roleName={inviteRole}
                    onRoleNameChange={setInviteRole}
                    loading={inviteLoading}
                    successMessage={inviteMessage}
                    error={inviteError}
                    onSubmit={handleInviteSubmit}
                    getStatusBadgeColor={getStatusBadgeColor}
                    getStatusIcon={getStatusIcon}
                    currentUserId={currentUserId}
                />

                <AllocateCreditsDialog
                    open={allocateDialogOpen}
                    onOpenChange={setAllocateDialogOpen}
                    team={selectedTeam}
                    selectedMemberId={allocateMemberId}
                    onMemberChange={setAllocateMemberId}
                    credits={allocateCredits}
                    onCreditsChange={setAllocateCredits}
                    onSubmit={handleAllocateCredits}
                    loading={allocateLoading}
                    error={allocateError}
                    successMessage={allocateMessage}
                    currentUserId={currentUserId}
                />

                <TransferCreditsDialog
                    open={transferDialogOpen}
                    onOpenChange={setTransferDialogOpen}
                    team={selectedTeam}
                    selectedMemberId={transferMemberId}
                    onMemberChange={setTransferMemberId}
                    credits={transferCredits}
                    onCreditsChange={setTransferCredits}
                    onSubmit={handleTransferCredits}
                    loading={transferLoading}
                    error={transferError}
                    successMessage={transferMessage}
                    currentUserId={currentUserId}
                />

                <TransferCreditsBeforeLeavingModal
                    open={transferCreditsModalOpen}
                    team={transferCreditsTeam}
                    availableCredits={transferCreditsAmount}
                    onTransferToWallet={async (credits) => {
                        await handleTransferCreditsAndLeave(undefined, credits);
                    }}
                    onTransferToMember={async (memberId, credits) => {
                        await handleTransferCreditsAndLeave(memberId, credits);
                    }}
                    onLeaveWithoutCredits={async () => {
                        await handleTransferCreditsAndLeave();
                    }}
                    onOpenChange={setTransferCreditsModalOpen}
                // loading={transferCreditsLoading}
                />
            </div>
        </div>
    );
}


