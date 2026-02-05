'use client'
import { useState, useEffect } from "react";
import { createTeam, getTeams, inviteTeamMember } from "@/services/teams.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { Users, LogIn, UserPlus, Plus, Mail, Calendar, Check, Clock, X } from "lucide-react";
import Link from "next/link";
import { Get_Teams_Response, Team } from "@/types/teams.types";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

    useEffect(() => {
        const authData = getAuthFromStorage();
        setIsAuthenticated(!!authData?.user);
    }, []);

    const getAllTeams = async () => {
        try {
            const res = await getTeams();
            setTeams(res);
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
            getAllTeams(); // Refresh teams list

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
            getAllTeams(); // Refresh teams list
        } catch (err: any) {
            setInviteError(err.message || "Invitation failed");
        } finally {
            setInviteLoading(false);
        }
    };

    const openInviteDialog = (team: Team) => {
        setSelectedTeam(team);
        setTeamId(team.id);
        setInviteDialogOpen(true);
    };

    // Show loading state while checking authentication
    if (isAuthenticated === null) {
        return null;
    }

    // Show login prompt if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="max-w-md w-full mx-4">
                    <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100">
                        <div className="flex justify-center mb-6">
                            <div className="bg-indigo-100 p-4 rounded-full">
                                <Users className="w-12 h-12 text-indigo-600" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-center text-slate-800 mb-3">
                            Teams Feature
                        </h2>

                        <p className="text-center text-slate-600 mb-8">
                            Please <span className="font-semibold text-indigo-600">login</span> or{" "}
                            <span className="font-semibold text-indigo-600">sign up</span> to continue creating teams
                        </p>

                        <div className="flex flex-col gap-3">
                            <Link
                                href="/sign-in"
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                            >
                                <LogIn className="w-5 h-5" />
                                Login
                            </Link>

                            <Link
                                href="/sign-up"
                                className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-indigo-600 font-semibold py-3 px-6 rounded-lg border-2 border-indigo-200 transition-colors duration-200"
                            >
                                <UserPlus className="w-5 h-5" />
                                Sign Up
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-3 rounded-lg">
                            <Users className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">My Teams</h1>
                            <p className="text-slate-600 text-sm">Manage your teams and collaborations</p>
                        </div>
                    </div>

                    {/* Add New Team Dialog */}
                    <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                <Plus className="w-4 h-4 mr-2" />
                                Add New Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle className="text-2xl">Create a New Team</DialogTitle>
                                <DialogDescription>
                                    Set up a new team to collaborate with your members
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                <div>
                                    <Label htmlFor="team-name">
                                        Team Name <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        id="team-name"
                                        type="text"
                                        placeholder="Enter team name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description">
                                        Description <span className="text-slate-400 text-sm">(optional)</span>
                                    </Label>
                                    <textarea
                                        id="description"
                                        placeholder="Describe your team's purpose"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                        rows={3}
                                    />
                                </div>

                                {message && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-green-700 text-sm font-medium">{message}</p>
                                    </div>
                                )}

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-red-700 text-sm font-medium">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Creating...
                                        </>
                                    ) : (
                                        "Create Team"
                                    )}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Teams Table */}
                <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                    {teams && teams.teams.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-semibold">Team Name</TableHead>
                                    <TableHead className="font-semibold">Description</TableHead>
                                    <TableHead className="font-semibold">Owner</TableHead>
                                    <TableHead className="font-semibold">Members</TableHead>
                                    <TableHead className="font-semibold">Invitations</TableHead>
                                    <TableHead className="font-semibold">Created</TableHead>
                                    <TableHead className="font-semibold text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teams.teams.map((team) => (
                                    <TableRow key={team.id} className="hover:bg-slate-50">
                                        <TableCell className="font-medium">{team.name}</TableCell>
                                        <TableCell className="text-slate-600 max-w-xs truncate">
                                            {team.description || "-"}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-sm">
                                                    {team.owner.name?.[0]?.toUpperCase() || "?"}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium">{team.owner.name || "Unknown"}</p>
                                                    <p className="text-xs text-slate-500">{team.owner.email}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                0 members
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                    {team.teamInvites.length} pending
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-600">
                                            {new Date(team.created_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Dialog open={inviteDialogOpen && selectedTeam?.id === team.id} onOpenChange={(open) => {
                                                setInviteDialogOpen(open);
                                                if (!open) setSelectedTeam(null);
                                            }}>
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => openInviteDialog(team)}
                                                        className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        <UserPlus className="w-4 h-4 mr-1" />
                                                        Invite
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-[600px]">
                                                    <DialogHeader>
                                                        <DialogTitle className="text-2xl">Team Details: {selectedTeam?.name}</DialogTitle>
                                                        <DialogDescription>
                                                            Invite members and view team information
                                                        </DialogDescription>
                                                    </DialogHeader>

                                                    <Tabs defaultValue="invite" className="mt-4">
                                                        <TabsList className="grid w-full grid-cols-2">
                                                            <TabsTrigger value="invite">Invite Member</TabsTrigger>
                                                            <TabsTrigger value="invitations">Pending Invitations</TabsTrigger>
                                                        </TabsList>

                                                        <TabsContent value="invite" className="space-y-4 mt-4">
                                                            <form onSubmit={handleInviteSubmit} className="space-y-4">
                                                                <div>
                                                                    <Label htmlFor="invite-email">
                                                                        Email Address <span className="text-red-500">*</span>
                                                                    </Label>
                                                                    <Input
                                                                        id="invite-email"
                                                                        type="email"
                                                                        placeholder="name@example.com"
                                                                        value={inviteEmail}
                                                                        onChange={(e) => setInviteEmail(e.target.value)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label htmlFor="invite-subject">
                                                                        Subject <span className="text-slate-400 text-sm">(optional)</span>
                                                                    </Label>
                                                                    <Input
                                                                        id="invite-subject"
                                                                        type="text"
                                                                        placeholder="Custom invitation subject"
                                                                        value={inviteSubject}
                                                                        onChange={(e) => setInviteSubject(e.target.value)}
                                                                        className="mt-1"
                                                                    />
                                                                </div>

                                                                <div>
                                                                    <Label htmlFor="invite-text">
                                                                        Message <span className="text-slate-400 text-sm">(optional)</span>
                                                                    </Label>
                                                                    <textarea
                                                                        id="invite-text"
                                                                        placeholder="Add a custom invitation message"
                                                                        value={inviteText}
                                                                        onChange={(e) => setInviteText(e.target.value)}
                                                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                                                        rows={3}
                                                                    />
                                                                </div>

                                                                {inviteMessage && (
                                                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                                                        <p className="text-green-700 text-sm font-medium">{inviteMessage}</p>
                                                                    </div>
                                                                )}

                                                                {inviteError && (
                                                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                                        <p className="text-red-700 text-sm font-medium">{inviteError}</p>
                                                                    </div>
                                                                )}

                                                                <Button
                                                                    type="submit"
                                                                    disabled={inviteLoading}
                                                                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                                                                >
                                                                    {inviteLoading ? (
                                                                        <>
                                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                                                            Sending...
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <Mail className="w-4 h-4 mr-2" />
                                                                            Send Invitation
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </form>
                                                        </TabsContent>

                                                        <TabsContent value="invitations" className="mt-4">
                                                            {selectedTeam && selectedTeam.teamInvites.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {selectedTeam.teamInvites.map((invite) => (
                                                                        <div
                                                                            key={invite.id}
                                                                            className="p-4 border border-slate-200 rounded-lg hover:border-indigo-200 transition-colors"
                                                                        >
                                                                            <div className="flex items-start justify-between">
                                                                                <div className="flex-1">
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <Mail className="w-4 h-4 text-slate-400" />
                                                                                        <span className="font-medium text-slate-900">{invite.email}</span>
                                                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                                            invite.status === "ACCEPTED" 
                                                                                                ? "bg-green-100 text-green-800" 
                                                                                                : invite.status === "PENDING" 
                                                                                                ? "bg-amber-100 text-amber-800"
                                                                                                : "bg-red-100 text-red-800"
                                                                                        }`}>
                                                                                            {invite.status === "ACCEPTED" && <Check className="w-3 h-3 mr-1" />}
                                                                                            {invite.status === "PENDING" && <Clock className="w-3 h-3 mr-1" />}
                                                                                            {invite.status === "FAILED" && <X className="w-3 h-3 mr-1" />}
                                                                                            {invite.status}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Calendar className="w-3 h-3" />
                                                                                            Invited: {new Date(invite.invited_at).toLocaleDateString()}
                                                                                        </span>
                                                                                        <span className="flex items-center gap-1">
                                                                                            <Clock className="w-3 h-3" />
                                                                                            Expires: {new Date(invite.expires_at).toLocaleDateString()}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-center py-8 text-slate-500">
                                                                    <Mail className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                                                    <p className="font-medium">No pending invitations</p>
                                                                    <p className="text-sm">Invite members to get started</p>
                                                                </div>
                                                            )}
                                                        </TabsContent>
                                                    </Tabs>
                                                </DialogContent>
                                            </Dialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-16 px-4">
                            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                            <h3 className="text-xl font-semibold text-slate-700 mb-2">No teams yet</h3>
                            <p className="text-slate-500 mb-6">Create your first team to start collaborating</p>
                            <Button
                                onClick={() => setCreateDialogOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-700"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Your First Team
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
