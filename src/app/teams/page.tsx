'use client'
import { useState, useEffect } from "react";
import { allocateCreditsToMember, createTeam, getTeams, inviteTeamMember, removeTeamMember } from "@/services/teams.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { Get_Teams_Response, Team } from "@/types/teams.types";
import { LoginPrompt } from "@/components/teams/LoginPrompt";
import { TeamsHeader } from "@/components/teams/TeamsHeader";
import { CreateTeamDialog } from "@/components/teams/CreateTeamDialog";
import { TeamsTable } from "@/components/teams/TeamsTable";
import { ViewAllMembersDialog } from "@/components/teams/ViewAllMembersDialog";
import { InviteMemberDialog } from "@/components/teams/InviteMemberDialog";
import { AllocateCreditsDialog } from "@/components/teams/AllocateCreditsDialog";
import { getStatusBadgeColor, getStatusIcon } from "@/components/teams/utils";

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
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteMessage, setInviteMessage] = useState<string | null>(null);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [teams, setTeams] = useState<Get_Teams_Response | null>(null);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [viewAllMembersOpen, setViewAllMembersOpen] = useState(false);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
    const [allocateDialogOpen, setAllocateDialogOpen] = useState(false);
    const [allocateMemberId, setAllocateMemberId] = useState("");
    const [allocateCredits, setAllocateCredits] = useState("");
    const [allocateLoading, setAllocateLoading] = useState(false);
    const [allocateError, setAllocateError] = useState<string | null>(null);
    const [allocateMessage, setAllocateMessage] = useState<string | null>(null);

    useEffect(() => {
        const authData = getAuthFromStorage();
        setIsAuthenticated(!!authData?.user);
        setCurrentUserId(authData?.user?.id || null);
    }, []);

    const getAllTeams = async () => {
        try {
            const res = await getTeams();
            setTeams(res);
            if (selectedTeam) {
                const refreshed = res.teams.find((team) => team.id === selectedTeam.id) || null;
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
            });

            setInviteMessage(res.message || "Invitation sent successfully 🎉");
            setInviteEmail("");
            setInviteSubject("");
            setInviteText("");
            setInviteDialogOpen(false);
            getAllTeams();
        } catch (err: any) {
            setInviteError(err.message || "Invitation failed");
        } finally {
            setInviteLoading(false);
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

    // Show loading state while checking authentication
    if (isAuthenticated === null) {
        return null;
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return <LoginPrompt />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
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
                />

                <ViewAllMembersDialog
                    open={viewAllMembersOpen}
                    onOpenChange={setViewAllMembersOpen}
                    team={selectedTeam}
                    getStatusBadgeColor={getStatusBadgeColor}
                    getStatusIcon={getStatusIcon}
                    currentUserId={currentUserId}
                    onRemoveMember={handleRemoveMember}
                    removingMemberId={removingMemberId}
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
                    loading={inviteLoading}
                    successMessage={inviteMessage}
                    error={inviteError}
                    onSubmit={handleInviteSubmit}
                    getStatusBadgeColor={getStatusBadgeColor}
                    getStatusIcon={getStatusIcon}
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
                />
            </div>
        </div>
    );
}


