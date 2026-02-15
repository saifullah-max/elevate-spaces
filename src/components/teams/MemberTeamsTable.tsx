'use client'
import { Users, MoreVertical, UserPlus, Send } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Get_Teams_Response, Team } from "@/types/teams.types";

interface MemberTeamsTableProps {
    teams: Get_Teams_Response | null;
    currentUserId?: string | null;
    onInviteClick?: (team: Team) => void;
    onTransferClick?: (team: Team) => void;
}

export function MemberTeamsTable({ teams, currentUserId, onInviteClick, onTransferClick }: MemberTeamsTableProps) {
    if (!teams || teams.teams.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="text-center py-12 px-4">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    <h3 className="text-lg font-semibold text-slate-700 mb-1">No team memberships yet</h3>
                    <p className="text-slate-500">You will see teams here once you accept an invite.</p>
                </div>
            </div>
        );
    }

    const canInviteInTeam = (team: Team) => {
        const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
        const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
        const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;
        
        // Can invite if OWNER, ADMIN, or AGENT
        return ["TEAM_OWNER", "TEAM_ADMIN", "TEAM_AGENT"].includes(currentRoleName || "");
    };

    const isTeamAgentInTeam = (team: Team) => {
        const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
        const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
        const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;
        
        // Only AGENT can transfer (not OWNER or ADMIN)
        return currentRoleName === "TEAM_AGENT";
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-left">Team Name</TableHead>
                        <TableHead className="font-semibold text-left">Description</TableHead>
                        <TableHead className="font-semibold text-left">Owner</TableHead>
                        <TableHead className="font-semibold text-left">Members</TableHead>
                        <TableHead className="font-semibold text-left">Joined</TableHead>
                        <TableHead className="font-semibold text-left">Actions</TableHead>
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
                                    {team.teamInvites.filter(inv => inv.status === "ACCEPTED").length} members
                                </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                                {new Date(team.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-left">
                                {(canInviteInTeam(team) || isTeamAgentInTeam(team)) && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {canInviteInTeam(team) && (
                                                <DropdownMenuItem onClick={() => onInviteClick && onInviteClick(team)}>
                                                    <UserPlus className="w-4 h-4 mr-2" />
                                                    Invite
                                                </DropdownMenuItem>
                                            )}
                                            {isTeamAgentInTeam(team) && (
                                                <DropdownMenuItem onClick={() => onTransferClick && onTransferClick(team)}>
                                                    <Send className="w-4 h-4 mr-2" />
                                                    Transfer Credits
                                                </DropdownMenuItem>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
