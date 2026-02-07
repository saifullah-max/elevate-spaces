'use client'
import { Users, Plus, MoreVertical, UserPlus, Coins } from "lucide-react";
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

interface TeamsTableProps {
    teams: Get_Teams_Response | null;
    onEmptyStateClick: () => void;
    onInviteClick: (team: Team) => void;
    onViewAllClick: (team: Team) => void;
    onAllocateCreditsClick: (team: Team) => void;
}

export function TeamsTable({
    teams,
    onEmptyStateClick,
    onInviteClick,
    onViewAllClick,
    onAllocateCreditsClick,
}: TeamsTableProps) {
    if (!teams || teams.teams.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
                <div className="text-center py-16 px-4">
                    <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">No teams yet</h3>
                    <p className="text-slate-500 mb-6">Create your first team to start collaborating</p>
                    <Button
                        onClick={onEmptyStateClick}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Your First Team
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-left">Team Name</TableHead>
                        <TableHead className="font-semibold text-left">Description</TableHead>
                        <TableHead className="font-semibold text-left">Owner</TableHead>
                        <TableHead className="font-semibold text-left">Members</TableHead>
                        <TableHead className="font-semibold text-left">Invitations</TableHead>
                        <TableHead className="font-semibold text-left">Created</TableHead>
                        <TableHead className="font-semibold text-left">Credits Available</TableHead>
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
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                        {team.teamInvites.filter(inv => inv.status === "PENDING").length} pending
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                                {new Date(team.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="text-sm text-slate-600">
                                {team.wallet}
                            </TableCell>
                            <TableCell className="text-left">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="start">
                                        <DropdownMenuItem onClick={() => onInviteClick(team)}>
                                            <UserPlus className="w-4 h-4 mr-2" />
                                            Invite
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onAllocateCreditsClick(team)}>
                                            <Coins className="w-4 h-4 mr-2" />
                                            Allocate Credits
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onViewAllClick(team)}>
                                            <Users className="w-4 h-4 mr-2" />
                                            View All
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
