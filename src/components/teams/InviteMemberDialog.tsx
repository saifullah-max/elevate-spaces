'use client'
import { Mail, Calendar, Clock, Check, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Team } from "@/types/teams.types";

interface InviteMemberDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team | null;
    email: string;
    onEmailChange: (value: string) => void;
    subject: string;
    onSubjectChange: (value: string) => void;
    message: string;
    onMessageChange: (value: string) => void;
    roleName: string;
    onRoleNameChange: (value: string) => void;
    loading: boolean;
    successMessage: string | null;
    error: string | null;
    onSubmit: (e: React.FormEvent) => void;
    getStatusBadgeColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    currentUserId?: string | null;
}

export function InviteMemberDialog({
    open,
    onOpenChange,
    team,
    email,
    onEmailChange,
    subject,
    onSubjectChange,
    message,
    onMessageChange,
    roleName,
    onRoleNameChange,
    loading,
    successMessage,
    error,
    onSubmit,
    getStatusBadgeColor,
    getStatusIcon,
    currentUserId,
}: InviteMemberDialogProps) {
    if (!team) return null;

    // Calculate current user's role in the team
    const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
    const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;

    // Determine available roles based on current user's role
    const roleOptions = currentRoleName === "TEAM_OWNER"
        ? [
            { value: "TEAM_AGENT", label: "Real Estate Agent" },
            { value: "TEAM_PHOTOGRAPHER", label: "Photographer" },
            { value: "TEAM_ADMIN", label: "Admin" },
        ]
        : currentRoleName === "TEAM_ADMIN"
            ? [
                { value: "TEAM_AGENT", label: "Real Estate Agent" },
                { value: "TEAM_PHOTOGRAPHER", label: "Photographer" },
            ]
            : currentRoleName === "TEAM_AGENT"
                ? [
                    { value: "TEAM_PHOTOGRAPHER", label: "Photographer" },
                ]
                : [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-150">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Team Details: {team?.name}</DialogTitle>
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
                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="invite-email">
                                    Email Address <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => onEmailChange(e.target.value)}
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
                                    value={subject}
                                    onChange={(e) => onSubjectChange(e.target.value)}
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
                                    value={message}
                                    onChange={(e) => onMessageChange(e.target.value)}
                                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <Label htmlFor="invite-role">
                                    Role <span className="text-slate-400 text-sm">(optional)</span>
                                </Label>
                                {roleOptions.length > 0 ? (
                                    <select
                                        id="invite-role"
                                        value={roleName}
                                        onChange={(e) => onRoleNameChange(e.target.value)}
                                        className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all bg-white"
                                    >
                                        {roleOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500 text-sm">
                                        You don't have permission to invite members
                                    </div>
                                )}
                            </div>

                            {successMessage && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-green-700 text-sm font-medium">{successMessage}</p>
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
                        {team && team.teamInvites.length > 0 ? (
                            <div className="space-y-3">
                                {team.teamInvites.map((invite) => (
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
    );
}
