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
}: AllocateCreditsDialogProps) {
    if (!team) return null;

    const acceptedMembers = team.teamInvites.filter((invite) => invite.status === "ACCEPTED");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                <DialogHeader>
                    <DialogTitle className="text-2xl">Allocate Credits</DialogTitle>
                    <DialogDescription>
                        {team.name} • Allocate credits to a member
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="member">Member</Label>
                        <select
                            id="member"
                            className="w-full h-10 rounded-md border border-slate-200 bg-white px-3 text-sm"
                            value={selectedMemberId}
                            onChange={(e) => onMemberChange(e.target.value)}
                        >
                            <option value="">Select a member</option>
                            {acceptedMembers.map((invite) => (
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
