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
    transferPrompt?: {
        teamName: string;
        personalCreditsBalance: number;
    } | null;
    onTransferPromptClick?: () => void;
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
    transferPrompt,
    onTransferPromptClick,
    currentUserId,
}: AllocateCreditsDialogProps) {
    if (!team) return null;

    // Calculate current user's role
    const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
    const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const currentRoleName = team.owner_id === currentUserId ? "TEAM_OWNER" : currentMembership?.role?.name;
    
    // Get current user's available credits for MEMBER
    const allocatorMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const availableCredits = allocatorMembership 
        ? Math.max(Number(allocatorMembership.allocated) - Number(allocatorMembership.used), 0)
        : 0;
    
    // Allocate credits should target actual active team members, not invites
    const activeMembers = (team.members || []).filter((member) => member.deleted_at === null);
    const filterableMembers = currentRoleName === "TEAM_MEMBER"
        ? activeMembers.filter((member) => {
            const roleName = String(member.role?.name || "").toUpperCase();
            return roleName === "TEAM_PHOTOGRAPHER" || roleName === "PHOTOGRAPHER";
        })
        : activeMembers;

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
                    {currentRoleName === "MEMBER" && (
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
                            {filterableMembers.map((member) => {
                                const memberLabel = member.user?.name || member.user?.email || "Unknown member";

                                return (
                                    <option key={member.id} value={member.user_id}>
                                        {memberLabel}
                                    </option>
                                );
                            })}
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

                    {transferPrompt ? (
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <p className="text-sm text-amber-900">
                                You may have {transferPrompt.personalCreditsBalance} unused personal credits in your account.
                                Transfer them to {transferPrompt.teamName} before allocating credits to a member.
                            </p>
                            <button
                                type="button"
                                className="mt-3 text-sm font-medium text-amber-800 underline underline-offset-4"
                                onClick={onTransferPromptClick}
                            >
                                Yes, proceed to transfer
                            </button>
                        </div>
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
