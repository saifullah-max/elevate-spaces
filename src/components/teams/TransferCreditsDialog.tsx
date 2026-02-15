'use client'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Team } from "@/types/teams.types";

interface TransferCreditsDialogProps {
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

export function TransferCreditsDialog({
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
}: TransferCreditsDialogProps) {
    if (!team) return null;

    const acceptedMembers = team.teamInvites.filter((invite) => invite.status === "ACCEPTED");
    
    // Calculate current user's available credits
    const membershipByUserId = new Map(team.members?.map((member) => [member.user_id, member]));
    const currentMembership = currentUserId ? membershipByUserId.get(currentUserId) : undefined;
    const availableCredits = currentMembership 
        ? Math.max(Number(currentMembership.allocated) - Number(currentMembership.used), 0)
        : 0;
    
    // Filter to show only photographers (excluding self)
    const transferableMembers = acceptedMembers.filter((invite) => {
        const memberId = invite.accepted_by_user_id || "";
        const member = memberId ? membershipByUserId.get(memberId) : undefined;
        const roleName = member?.role?.name || "TEAM_MEMBER";
        return roleName === "TEAM_PHOTOGRAPHER" && memberId !== currentUserId;
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-130">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Transfer Credits</DialogTitle>
                    <DialogDescription>
                        {team.name} • Transfer your credits to a photographer
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900">
                            <span className="font-semibold">Available Credits:</span> {availableCredits}
                        </p>
                    </div>
                    
                    <div className="space-y-2">
                        <Label htmlFor="transfer-member">Photographer</Label>
                        <select
                            id="transfer-member"
                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={selectedMemberId}
                            onChange={(e) => onMemberChange(e.target.value)}
                        >
                            <option value="">Select a photographer</option>
                            {transferableMembers.map((invite) => (
                                <option key={invite.id} value={invite.accepted_by_user_id || ""}>
                                    {invite.email}
                                </option>
                            ))}
                        </select>
                        {transferableMembers.length === 0 && (
                            <p className="text-xs text-slate-500">No photographers available in this team</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="transfer-credits">Credits</Label>
                        <Input
                            id="transfer-credits"
                            type="number"
                            min="1"
                            max={availableCredits}
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
                        <Button 
                            type="submit" 
                            className="bg-indigo-600 hover:bg-indigo-700" 
                            disabled={loading || availableCredits === 0 || transferableMembers.length === 0}
                        >
                            {loading ? "Transferring..." : "Transfer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
