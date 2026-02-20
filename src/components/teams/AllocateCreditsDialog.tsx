'use client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Team } from "@/types/teams.types";

interface AllocateCreditsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team | null;
    selectedMemberId: string;
    onMemberChange: (memberId: string) => void;
    credits: string;
    onCreditsChange: (credits: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    loading: boolean;
    error?: string | null;
    successMessage?: string | null;
    currentUserId?: string | null;
}

export function AllocateCreditsDialog({
    open,
    onOpenChange,
    team,
    selectedMemberId,
    onMemberChange,
    credits,
    onCreditsChange,
    onSubmit,
    loading,
    error,
    successMessage,
    currentUserId,
}: AllocateCreditsDialogProps) {
    if (!team) return null;

    const acceptedMembers = team.teamInvites.filter((invite) => invite.status === "ACCEPTED");
    
    // Calculate current user's role
    const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
    const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;
    
    // Get current user's available credits for TEAM_AGENT
    const allocatorMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const availableCredits = allocatorMembership 
        ? Math.max(Number(allocatorMembership.allocated) - Number(allocatorMembership.used), 0)
        : 0;
    
    // Filter members based on role
    const filterableMembers = currentRoleName === "TEAM_AGENT"
        ? acceptedMembers.filter((invite) => {
            const memberId = invite.accepted_by_user_id || "";
            const member = memberId ? membershipByUserId.get(memberId) : undefined;
            const roleName = member?.role?.name || "TEAM_AGENT";
            return roleName === "TEAM_PHOTOGRAPHER";
        })
        : acceptedMembers;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-130">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Allocate Credits</DialogTitle>
                    <DialogDescription>
                        {team.name} • Allocate credits to a member
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-5">
                    {currentRoleName === "TEAM_AGENT" && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-900">
                                <span className="font-semibold">Available Credits:</span> {availableCredits}
                            </p>
                        </div>
                    )}
                    
                    <div className="space-y-2">
                        <Label htmlFor="member">Member</Label>
                        <select
                            id="member"
                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={selectedMemberId}
                            onChange={(e) => onMemberChange(e.target.value)}
                        >
                            <option value="">Select a member</option>
                            {filterableMembers.map((invite) => (
                                <option key={invite.id} value={invite.accepted_by_user_id || ""}>
                                    {invite.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="credits">Credits</Label>
                        <Input
                            id="credits"
                            type="number"
                            min="1"
                            placeholder="e.g. 100"
                            value={credits}
                            onChange={(e) => onCreditsChange(e.target.value)}
                        />
                    </div>

                    {error ? (
                        <p className="text-sm text-red-600">{error}</p>
                    ) : null}
                    {successMessage ? (
                        <p className="text-sm text-green-700">{successMessage}</p>
                    ) : null}

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                            {loading ? "Allocating..." : "Allocate"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
