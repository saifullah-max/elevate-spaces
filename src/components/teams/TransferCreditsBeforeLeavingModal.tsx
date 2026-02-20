'use client'
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Loader2 } from "lucide-react";
import { Team } from "@/types/teams.types";

interface TransferCreditsBeforeLeavingModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    team: Team | null;
    availableCredits: number;
    onTransferToWallet: (credits: number) => Promise<void>;
    onTransferToMember: (memberId: string, credits: number) => Promise<void>;
    onLeaveWithoutCredits: () => Promise<void>;
    isProcessing?: boolean;
}

export function TransferCreditsBeforeLeavingModal({
    open,
    onOpenChange,
    team,
    availableCredits,
    onTransferToWallet,
    onTransferToMember,
    onLeaveWithoutCredits,
    isProcessing = false,
}: TransferCreditsBeforeLeavingModalProps) {
    const [transferMode, setTransferMode] = useState<"wallet" | "member">("wallet");
    const [selectedMemberId, setSelectedMemberId] = useState("");
    const [creditsToTransfer, setCreditsToTransfer] = useState(availableCredits.toString());
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    if (!team) return null;

    // Get active members (excluding current user and only agents/photographers)
    const activeMembers = team.teamInvites
        .filter((inv) => inv.status === "ACCEPTED" && inv.accepted_by_user_id)
        .map((inv) => {
            const member = team.members?.find((m) => m.user_id === inv.accepted_by_user_id);
            return { ...inv, member };
        })
        .filter((inv) => inv.member && ["PHOTOGRAPHER", "AGENT"].includes(inv.member.role?.name || ""))
        .map((inv) => ({
            userId: inv.accepted_by_user_id || "",
            email: inv.email,
            roleName: inv.member?.role?.name || "",
        }));

    const handleTransfer = async () => {
        setErrorMsg(null);
        try {
            setIsLoading(true);
            const credits = parseFloat(creditsToTransfer);

            if (isNaN(credits) || credits <= 0 || credits > availableCredits) {
                setErrorMsg(`Please enter a valid amount between 0 and ${availableCredits}`);
                return;
            }

            if (transferMode === "wallet") {
                await onTransferToWallet(credits);
            } else {
                if (!selectedMemberId) {
                    setErrorMsg("Please select a member to transfer to");
                    return;
                }
                await onTransferToMember(selectedMemberId, credits);
            }

            // After successful transfer, allow user to leave
            setTransferMode("wallet");
            setSelectedMemberId("");
            setCreditsToTransfer(availableCredits.toString());
        } catch (error: any) {
            setErrorMsg(error.message || "Failed to transfer credits");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        Credits Before Leaving
                    </DialogTitle>
                    <DialogDescription>
                        You have {availableCredits} available credits in {team.name}. Please transfer them before leaving.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {errorMsg && (
                        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-3 py-2 text-sm mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500" />
                            {errorMsg}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Transfer Option</Label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                                <input
                                    type="radio"
                                    checked={transferMode === "wallet"}
                                    onChange={() => setTransferMode("wallet")}
                                    className="cursor-pointer"
                                />
                                <span className="text-sm">Transfer to team wallet</span>
                            </label>
                            {activeMembers.length > 0 && (
                                <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-slate-50">
                                    <input
                                        type="radio"
                                        checked={transferMode === "member"}
                                        onChange={() => setTransferMode("member")}
                                        className="cursor-pointer"
                                    />
                                    <span className="text-sm">Transfer to team member</span>
                                </label>
                            )}
                        </div>
                    </div>

                    {transferMode === "member" && activeMembers.length > 0 && (
                        <div className="space-y-2">
                            <Label htmlFor="member-select">Select Member</Label>
                            <select
                                id="member-select"
                                value={selectedMemberId}
                                onChange={(e) => setSelectedMemberId(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                            >
                                <option value="">Choose a member...</option>
                                {activeMembers.map((member) => (
                                    <option key={member.userId} value={member.userId}>
                                        {member.email} ({member.roleName})
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="credits-input">Credits to Transfer</Label>
                        <Input
                            id="credits-input"
                            type="number"
                            min="0"
                            max={availableCredits}
                            value={creditsToTransfer}
                            onChange={(e) => setCreditsToTransfer(e.target.value)}
                            className="mt-1"
                        />
                        <p className="text-xs text-slate-500">
                            Available: {availableCredits} credits
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={handleTransfer}
                        disabled={isLoading || isProcessing}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Transferring...
                            </>
                        ) : (
                            "Transfer Credits"
                        )}
                    </Button>
                    <Button
                        onClick={onLeaveWithoutCredits}
                        disabled={isLoading || isProcessing}
                        variant="outline"
                        className="flex-1"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Leaving...
                            </>
                        ) : (
                            "Leave Without"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
