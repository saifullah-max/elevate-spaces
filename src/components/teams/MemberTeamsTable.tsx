'use client'
import { Users, MoreVertical, UserPlus, Send, Coins, Pencil, Trash2 } from "lucide-react";
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
import { getAuthFromStorage } from "@/lib/auth.storage";

interface MemberTeamsTableProps {
    teams: Get_Teams_Response | null;
    currentUserId?: string | null;
    onInviteClick?: (team: Team) => void;
    onTransferClick?: (team: Team) => void;
    onLeaveClick?: (team: Team) => void;
    onViewAllClick?: (team: Team) => void;
    onAllocateCreditsClick?: (team: Team) => void;
    onEditNameClick?: (team: Team) => void;
    onDeleteClick?: (team: Team) => void;
}

export function MemberTeamsTable({ teams, currentUserId, onInviteClick, onTransferClick, onLeaveClick, onViewAllClick, onAllocateCreditsClick, onEditNameClick, onDeleteClick }: MemberTeamsTableProps) {
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

    // Only allow these roles
    const ALLOWED_ROLES = ["TEAM_OWNER", "TEAM_ADMIN", "TEAM_AGENT", "TEAM_PHOTOGRAPHER"];
    const authData = getAuthFromStorage();
    const userId = authData?.user?.id;

    const getCurrentRoleName = (team: Team) => {
        const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
        const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
        // Owner always has TEAM_OWNER role
        const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;
        // Only allow allowed roles, otherwise return undefined
        return ALLOWED_ROLES.includes(currentRoleName || "") ? currentRoleName : undefined;
    };

    const canInviteInTeam = (team: Team) => {
        const currentRoleName = getCurrentRoleName(team);
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

    const isOwnerOrAdmin = (team: Team) => {
        const currentRoleName = getCurrentRoleName(team);
        // OWNER or ADMIN have full write permissions
        return ["TEAM_OWNER", "TEAM_ADMIN"].includes(currentRoleName || "");
    };

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-left">Team Name</TableHead>
                        <TableHead className="font-semibold text-left">Description</TableHead>
                        <TableHead className="font-semibold text-left">Owner</TableHead>
                        <TableHead className="font-semibold text-left">Role</TableHead>
                        <TableHead className="font-semibold text-left">Members</TableHead>
                        <TableHead className="font-semibold text-left">Credits Allocated</TableHead>
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
                                <div className="inline-flex items-center text-xs font-medium">
                                    {
                                        (() => {
                                            const member = team.members.find(m => m.user_id === userId);
                                            if (!member) return null;

                                            const roleMap: Record<string, string> = {
                                                TEAM_AGENT: "Agent",
                                                TEAM_PHOTOGRAPHER: "Photographer",
                                                TEAM_ADMIN: 'Admin'
                                            };

                                            return roleMap[member.role.name] || member.role.name.toLowerCase();
                                        })()
                                    }
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {
                                        [
                                            ...team.members.filter(mem => mem.deleted_at != null)
                                        ].length
                                    } members
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                                    {team.members.find(mem => mem.user_id === userId)?.allocated ?? 0}
                                </span>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                                {new Date(team.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-left">
                                {/* {(canInviteInTeam(team) || isTeamAgentInTeam(team)) && (

                                )} */}
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
                                        {isOwnerOrAdmin(team) && onAllocateCreditsClick && (
                                            <DropdownMenuItem onClick={() => onAllocateCreditsClick(team)}>
                                                <Coins className="w-4 h-4 mr-2" />
                                                Allocate Credits
                                            </DropdownMenuItem>
                                        )}
                                        {isOwnerOrAdmin(team) && onViewAllClick && (
                                            <DropdownMenuItem onClick={() => onViewAllClick(team)}>
                                                <Users className="w-4 h-4 mr-2" />
                                                View All
                                            </DropdownMenuItem>
                                        )}
                                        {isOwnerOrAdmin(team) && onEditNameClick && (
                                            <DropdownMenuItem onClick={() => onEditNameClick(team)}>
                                                <Pencil className="w-4 h-4 mr-2" />
                                                Edit Name
                                            </DropdownMenuItem>
                                        )}
                                        {isTeamAgentInTeam(team) && onTransferClick && (
                                            <DropdownMenuItem onClick={() => onTransferClick(team)}>
                                                <Send className="w-4 h-4 mr-2" />
                                                Transfer Credits
                                            </DropdownMenuItem>
                                        )}
                                        {isOwnerOrAdmin(team) && onDeleteClick && (
                                            <>
                                                <div className="flex items-center px-2 py-1.5 text-xs text-slate-500 cursor-default">
                                                    <div className="flex-1 h-px bg-slate-200"></div>
                                                </div>
                                                <DropdownMenuItem
                                                    onClick={() => onDeleteClick(team)}
                                                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete Team
                                                </DropdownMenuItem>
                                            </>
                                        )}
                                        <div className="flex items-center px-2 py-1.5 text-xs text-slate-500 cursor-default">
                                            <div className="flex-1 h-px bg-slate-200"></div>
                                        </div>
                                        <DropdownMenuItem onClick={() => onLeaveClick && onLeaveClick(team)}>
                                            <Send className="w-4 h-4 mr-2" />
                                            Leave Team
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
