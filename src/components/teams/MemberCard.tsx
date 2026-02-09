'use client'
import { Check, Clock, X, Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MemberCardProps {
    email: string;
    joinDate: string;
    status?: never;
    onRemove?: () => void;
    canRemove?: boolean;
    removing?: boolean;
}

export function AcceptedMemberCard({ email, joinDate, onRemove, canRemove, removing }: MemberCardProps) {
    return (
        <div className="p-4 border border-green-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-semibold">
                        {email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-slate-900">{email}</p>
                        <p className="text-xs text-green-700 mt-0.5">Joined {joinDate}</p>
                    </div>
                </div>
                {canRemove ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={onRemove}
                        disabled={removing}
                        aria-busy={removing}
                    >
                        <Ban className="w-4 h-4" />
                    </Button>
                ) : null}
            </div>
        </div>
    );
}

interface PendingInviteCardProps {
    email: string;
    expiryDate: string;
    status: "PENDING" | "FAILED";
    getStatusBadgeColor: (status: string) => string;
    getStatusIcon: (status: string) => React.ReactNode;
    showReinvite?: boolean;
    reinviting?: boolean;
    onReinvite?: () => void;
}

export function PendingInviteCard({
    email,
    expiryDate,
    status,
    getStatusBadgeColor,
    getStatusIcon,
    showReinvite,
    reinviting,
    onReinvite,
}: PendingInviteCardProps) {
    const bgColor = status === "PENDING" ? "bg-amber-200 text-amber-700" : "bg-red-200 text-red-700";
    const borderColor = status === "PENDING" ? "border-amber-200" : "border-red-200";

    return (
        <div className={`p-4 border ${borderColor} rounded-lg hover:shadow-md transition-shadow`}>
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-full ${bgColor} flex items-center justify-center font-semibold`}>
                        {email[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                        <p className="font-semibold text-slate-900">{email}</p>
                        <p className={`text-xs mt-0.5 ${status === "PENDING" ? "text-amber-700" : "text-red-700"}`}>
                            {status === "PENDING" ? `Expires ${expiryDate}` : `Sent ${expiryDate}`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(status)}`}>
                        {getStatusIcon(status)}
                        {status}
                    </span>
                    {showReinvite ? (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={onReinvite}
                            disabled={reinviting}
                            aria-busy={reinviting}
                        >
                            {reinviting ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    Reinviting...
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Reinvite
                                </>
                            )}
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}
