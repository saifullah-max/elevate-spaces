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
import { TeamMembersCreditsModal } from "../../components/teams/TeamMembersCreditsModal";
import { InviteMemberDialog } from "@/components/teams/InviteMemberDialog";
import { AllocateCreditsDialog } from "@/components/teams/AllocateCreditsDialog";
import { TransferCreditsDialog } from "@/components/teams/TransferCreditsDialog";
import { TransferCreditsBeforeLeavingModal } from "@/components/teams/TransferCreditsBeforeLeavingModal";
import { getStatusBadgeColor, getStatusIcon } from "@/components/teams/utils";
import { DeleteTeamModal } from "@/components/teams/DeleteTeamModal";
import { LeaveTeamModal } from "@/components/teams/LeaveTeamModal";
import { EditTeamNameDialog } from "@/components/teams/EditTeamNameDialog";
import { transferCreditsToTeam, TransferCreditsToTeamData } from "@/services/teams.service";
import { Button } from "@/components/ui/button";
import { createCheckoutSession } from "@/services/payment.service";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { showError } from "@/components/toastUtils";


export default function Teams() {
    type TeamSeatLimitDetails = {
        planLabel?: string;
        freeIncludedUsers?: number;
        activeMembers?: number;
        pendingInvites?: number;
        purchasedExtraSeats?: number;
        allowedMembers?: number;
        allowPurchaseExtraSeats?: boolean;
        extraSeatProductKey?: string;
        extraSeatPriceUsdMonthly?: number;
    };

    const [transferToTeamDialogOpen, setTransferToTeamDialogOpen] = useState(false);
    const [transferToTeamCredits, setTransferToTeamCredits] = useState("");
    const [transferToTeamLoading, setTransferToTeamLoading] = useState(false);
    const [transferToTeamError, setTransferToTeamError] = useState<string | null>(null);
    const [transferToTeamMessage, setTransferToTeamMessage] = useState<string | null>(null);
    const [transferToTeamSelectedTeamId, setTransferToTeamSelectedTeamId] = useState<string>("");
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
    const [inviteRole, setInviteRole] = useState("MEMBER");
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
    const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null);
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
    const [allocateTransferPrompt, setAllocateTransferPrompt] = useState<{
        teamName: string;
        personalCreditsBalance: number;
        teamId: string;
        teamWalletBalance: number;
    } | null>(null);
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
    const [seatLimitModalOpen, setSeatLimitModalOpen] = useState(false);
    const [seatLimitDetails, setSeatLimitDetails] = useState<TeamSeatLimitDetails | null>(null);
    const [seatAutoRenew, setSeatAutoRenew] = useState(true);
    const [seatAgreementModalOpen, setSeatAgreementModalOpen] = useState(false);
    const [seatAgreementAccepted, setSeatAgreementAccepted] = useState(false);
    const [seatCheckoutLoading, setSeatCheckoutLoading] = useState(false);
    const [seatCheckoutError, setSeatCheckoutError] = useState<string | null>(null);

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
            setInviteRole("MEMBER");
            setInviteDialogOpen(false);
            getAllTeams();
        } catch (err: any) {
            if (err?.code === "TEAM_SEAT_LIMIT_REACHED") {
                setSeatLimitDetails(err?.details || null);
                setSeatLimitModalOpen(true);
            } else if (err?.code === "TEAM_PLAN_REQUIRED") {
                showError(err?.message || "Buy a plan to unlock collaboration and invite team members.");
            }
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
            throw err;
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
            if (err?.code === "TEAM_SEAT_LIMIT_REACHED") {
                setSeatLimitDetails(err?.details || null);
                setSeatLimitModalOpen(true);
            } else if (err?.code === "TEAM_PLAN_REQUIRED") {
                showError(err?.message || "Buy a plan to unlock collaboration and invite team members.");
            }
            setReinviteError(err.message || "Reinvite failed");
        } finally {
            setReinvitingInviteId(null);
        }
    };

    const handleOpenSeatAgreement = () => {
        setSeatCheckoutError(null);
        setSeatLimitModalOpen(false);
        setSeatAgreementAccepted(false);
        setSeatAgreementModalOpen(true);
    };

    // Wrapper function for resending invite from the dialog
    const handleResendInviteFromDialog = async (invite: any): Promise<void> => {
        try {
            setReinviteError(null);
            setReinviteMessage(null);
            setReinvitingInviteId(invite.id);

            const res = await reinviteTeamMember({
                email: invite.email,
                teamId: invite.team_id,
                roleName: invite.role?.name || "MEMBER",
            });

            setReinviteMessage(res.message || "Invitation re-sent successfully");
            await getAllTeams();
        } catch (err: any) {
            if (err?.code === "TEAM_SEAT_LIMIT_REACHED") {
                setSeatLimitDetails(err?.details || null);
                setSeatLimitModalOpen(true);
            } else if (err?.code === "TEAM_PLAN_REQUIRED") {
                window.alert(err?.message || "Buy a plan to unlock collaboration and invite team members.");
            }
            setReinviteError(err.message || "Reinvite failed");
        } finally {
            setReinvitingInviteId(null);
        }
    };

    // Wrapper function for canceling invite from the dialog
    const handleCancelInviteFromDialog = async (invite: any): Promise<void> => {
        try {
            setCancelError(null);
            setCancelMessage(null);
            setCancelingInviteId(invite.id);

            await cancelInvitation({ id: invite.id });

            setCancelMessage("Invitation cancelled successfully");
            await getAllTeams();
        } catch (err: any) {
            const errorMsg = err?.message || "Failed to cancel invitation";
            setCancelError(errorMsg);
        } finally {
            setCancelingInviteId(null);
        }
    };

    const handleCheckoutForExtraSeat = async () => {
        if (!seatLimitDetails?.extraSeatProductKey) {
            setSeatCheckoutError("No extra seat product is available for this plan.");
            return;
        }

        const resolvedTeamId = selectedTeam?.id || teamId.trim();
        if (!resolvedTeamId) {
            setSeatCheckoutError("Team ID is required to continue with seat purchase.");
            return;
        }

        try {
            setSeatCheckoutLoading(true);
            setSeatCheckoutError(null);
            const response = await createCheckoutSession({
                productKey: seatLimitDetails.extraSeatProductKey,
                purchaseFor: "team",
                teamId: resolvedTeamId,
                quantity: 1,
                seatAutoRenew,
            });

            if (!response?.url) {
                throw new Error("Checkout URL was not returned.");
            }

            window.location.href = response.url;
        } catch (err: any) {
            setSeatCheckoutError(err?.message || "Failed to start seat checkout.");
        } finally {
            setSeatCheckoutLoading(false);
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
            setAllocateTransferPrompt(null);
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
            if (err?.code === "TRANSFER_PERSONAL_CREDITS_TO_TEAM" && err?.data) {
                setAllocateTransferPrompt({
                    teamName: err.data.teamName || selectedTeam.name,
                    personalCreditsBalance: Number(err.data.personalCreditsBalance || 0),
                    teamId: err.data.teamId || selectedTeam.id,
                    teamWalletBalance: Number(err.data.teamWalletBalance || 0),
                });
                setAllocateError(err.message || "Transfer your personal credits to the team wallet first");
                return;
            }

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

    const handleTransferToTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        setTransferToTeamError(null);
        setTransferToTeamMessage(null);
        if (!transferToTeamSelectedTeamId) {
            setTransferToTeamError("Please select a team");
            return;
        }
        const creditsValue = Number(transferToTeamCredits);
        if (!Number.isFinite(creditsValue) || creditsValue <= 0) {
            setTransferToTeamError("Credits must be a positive number");
            return;
        }
        try {
            setTransferToTeamLoading(true);
            const res = await transferCreditsToTeam({
                team_id: transferToTeamSelectedTeamId,
                credits: creditsValue,
            });
            setTransferToTeamMessage(res.message || "Credits transferred to team wallet");
            setTransferToTeamCredits("");
            setTransferToTeamDialogOpen(false);
            setTransferToTeamSelectedTeamId("");
            await getAllTeams();
        } catch (err: any) {
            setTransferToTeamError(err.message || "Failed to transfer credits");
        } finally {
            setTransferToTeamLoading(false);
        }
    };

    const openTeamWalletTransferDialog = (teamId: string, creditsBalance: number) => {
        const team = teams?.teams?.find((item) => item.id === teamId) || selectedTeam;
        setTransferToTeamError(null);
        setTransferToTeamMessage(null);
        setTransferToTeamSelectedTeamId(team?.id || teamId);
        setTransferToTeamCredits(String(creditsBalance));
        setTransferToTeamDialogOpen(true);
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

                <>
                    {transferToTeamDialogOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-30">
                            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
                                <h3 className="text-lg font-semibold mb-4">Transfer Credits to Team Wallet</h3>
                                <form onSubmit={handleTransferToTeam}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium mb-1">Select Team</label>
                                        <select
                                            className="w-full border rounded px-3 py-2 mb-2"
                                            value={transferToTeamSelectedTeamId}
                                            onChange={e => setTransferToTeamSelectedTeamId(e.target.value)}
                                            required
                                        >
                                            <option value="">Select a team</option>
                                            {teams?.teams?.filter(t => t.owner_id === currentUserId).map(team => (
                                                <option key={team.id} value={team.id}>{team.name}</option>
                                            ))}
                                        </select>
                                        <label className="block text-sm font-medium mb-1">Credits to Transfer</label>
                                        <input
                                            type="number"
                                            min="1"
                                            className="w-full border rounded px-3 py-2"
                                            value={transferToTeamCredits}
                                            onChange={e => setTransferToTeamCredits(e.target.value)}
                                            required
                                        />
                                    </div>
                                    {transferToTeamError && <div className="text-red-600 mb-2">{transferToTeamError}</div>}
                                    {transferToTeamMessage && <div className="text-green-600 mb-2">{transferToTeamMessage}</div>}
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                                            onClick={() => setTransferToTeamDialogOpen(false)}
                                            disabled={transferToTeamLoading}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                            disabled={transferToTeamLoading}
                                        >
                                            {transferToTeamLoading ? "Transferring..." : "Transfer"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>

                <div className="mb-10">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                        <div className="flex items-start justify-between mb-4">
                            <h2 className="text-2xl font-semibold text-slate-900">My Teams</h2>
                            <div className="flex items-center gap-2">
                                {teams?.teams?.some(t => t.owner_id === currentUserId) && (
                                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setTransferToTeamDialogOpen(true)}>
                                        Transfer Credits to Team Wallet
                                    </Button>
                                )}
                            </div>
                        </div>

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
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
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

                    <TeamMembersCreditsModal
                        open={viewAllMembersOpen}
                        onOpenChange={setViewAllMembersOpen}
                        team={selectedTeam}
                        currentUserId={currentUserId}
                        onRemoveMember={handleRemoveMember}
                        removingMemberId={removingMemberId}
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
                        onResendInvite={handleResendInviteFromDialog}
                        onCancelInvite={handleCancelInviteFromDialog}
                        resendingInviteId={reinvitingInviteId}
                        cancelingInviteId={cancelingInviteId}
                        actionMessage={reinviteMessage || cancelMessage}
                        actionError={reinviteError || cancelError}
                    />

                    <Dialog open={seatLimitModalOpen} onOpenChange={(open) => {
                        setSeatLimitModalOpen(open);
                        if (!open) {
                            setSeatCheckoutError(null);
                        }
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Team member limit reached</DialogTitle>
                                <DialogDescription>
                                    {seatLimitDetails?.planLabel
                                        ? `Your ${seatLimitDetails.planLabel} plan has reached its included member limit.`
                                        : "Your team has reached its member limit."}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-2 text-sm text-slate-700">
                                <p>
                                    Included additional users: {seatLimitDetails?.freeIncludedUsers ?? 0}
                                </p>
                                <p>
                                    Active members: {seatLimitDetails?.activeMembers ?? 0} | Pending invites: {seatLimitDetails?.pendingInvites ?? 0}
                                </p>
                                <p>
                                    Purchased extra seats: {seatLimitDetails?.purchasedExtraSeats ?? 0} | Total allowed members: {seatLimitDetails?.allowedMembers ?? 0}
                                </p>
                                {seatLimitDetails?.allowPurchaseExtraSeats && seatLimitDetails?.extraSeatPriceUsdMonthly ? (
                                    <p className="font-medium text-slate-900">
                                        Extra users cost ${seatLimitDetails.extraSeatPriceUsdMonthly}/month each.
                                    </p>
                                ) : (
                                    <p className="font-medium text-rose-600">
                                        Additional users are not available on this plan.
                                    </p>
                                )}
                            </div>

                            {seatCheckoutError && (
                                <p className="text-sm text-rose-600">{seatCheckoutError}</p>
                            )}

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setSeatLimitModalOpen(false)}
                                    disabled={seatCheckoutLoading}
                                >
                                    Cancel
                                </Button>
                                {seatLimitDetails?.allowPurchaseExtraSeats && (
                                    <Button
                                        onClick={handleOpenSeatAgreement}
                                        disabled={seatCheckoutLoading}
                                    >
                                        Yes, proceed to billing
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={seatAgreementModalOpen} onOpenChange={(open) => {
                        setSeatAgreementModalOpen(open);
                        if (!open) {
                            setSeatAgreementAccepted(false);
                        }
                    }}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Seat billing agreement</DialogTitle>
                                <DialogDescription>
                                    Confirm how paid extra seats should be handled before continuing to Stripe.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-3 text-sm text-slate-700">
                                <p>
                                    By proceeding, each extra user seat is billed at ${seatLimitDetails?.extraSeatPriceUsdMonthly ?? 0}/month.
                                </p>
                                <label className="flex items-center gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={seatAutoRenew}
                                        onChange={(e) => setSeatAutoRenew(e.target.checked)}
                                    />
                                    Enable auto-renewal for paid extra seats (recommended)
                                </label>
                                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-2">
                                    If auto-renewal is disabled, the paid seat stays active for 30 days from last paid date. After that, the member is automatically removed from the team and related team access data is lost.
                                </p>
                                <label className="flex items-start gap-2 text-sm text-slate-700">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={seatAgreementAccepted}
                                        onChange={(e) => setSeatAgreementAccepted(e.target.checked)}
                                    />
                                    <span>
                                        I understand and agree to the seat billing terms.
                                    </span>
                                </label>
                            </div>

                            {seatCheckoutError && (
                                <p className="text-sm text-rose-600">{seatCheckoutError}</p>
                            )}

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSeatAgreementModalOpen(false);
                                        setSeatLimitModalOpen(true);
                                    }}
                                    disabled={seatCheckoutLoading}
                                >
                                    Back
                                </Button>
                                <Button
                                    onClick={handleCheckoutForExtraSeat}
                                    disabled={seatCheckoutLoading || !seatAgreementAccepted || !seatLimitDetails?.allowPurchaseExtraSeats}
                                >
                                    {seatCheckoutLoading ? "Redirecting..." : "I Agree, Continue to Stripe"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

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
                        transferPrompt={allocateTransferPrompt ? {
                            teamName: allocateTransferPrompt.teamName,
                            personalCreditsBalance: allocateTransferPrompt.personalCreditsBalance,
                        } : null}
                        onTransferPromptClick={() => {
                            if (allocateTransferPrompt) {
                                setAllocateDialogOpen(false);
                                openTeamWalletTransferDialog(allocateTransferPrompt.teamId, allocateTransferPrompt.personalCreditsBalance);
                            }
                        }}
                        currentUserId={currentUserId}
                    />

                    {/* real state to photographer credits */}
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
        </div>
    );
}

