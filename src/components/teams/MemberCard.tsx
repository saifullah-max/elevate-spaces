'use client'
import { Check, Clock, X, Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface MemberCardProps {
    email: string;
    joinDate: string;
    status?: never;
    roleName?: string;
    roleOptions?: Array<{ value: string; label: string }>;
    onRoleChange?: (roleName: string) => void;
    updatingRole?: boolean;
    onRemove?: () => void;
    canRemove?: boolean;
    removing?: boolean;
}

export function AcceptedMemberCard({
    email,
    joinDate,
    roleName,
    roleOptions,
    onRoleChange,
    updatingRole,
    onRemove,
    canRemove,
    removing,
}: MemberCardProps) {
    const [ConfirmDelete, setConfirmDelete] = useState(false)
    const [isEditingRole, setIsEditingRole] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string>(roleName ?? "");

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
                        {roleName ? (
                            <p className="text-xs text-slate-500 mt-1">Role: {roleName.replace("TEAM_", "").toLowerCase()}</p>
                        ) : null}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {roleOptions && roleOptions.length > 0 && (
                        <div className="flex items-center gap-2 mr-3">
                            <select
                                value={selectedRole}
                                onChange={(e) => setSelectedRole(e.target.value)}
                                disabled={!isEditingRole || updatingRole}
                                className={`px-2 py-1 border rounded-md text-xs bg-white transition 
            ${isEditingRole
                                        ? "border-indigo-500"
                                        : "border-slate-200 opacity-70 cursor-not-allowed"
                                    }`}
                            >
                                {roleOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {!isEditingRole ? (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setIsEditingRole(true)}
                                >
                                    Update Role
                                </Button>
                            ) : (
                                <>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            onRoleChange?.(selectedRole);
                                            setIsEditingRole(false);
                                        }}
                                        disabled={updatingRole}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        {updatingRole ? "Saving..." : "Save"}
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setSelectedRole(roleName ?? "");
                                            setIsEditingRole(false);
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {canRemove ? (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => setConfirmDelete(true)}
                        disabled={removing}
                        aria-busy={removing}
                    >
                        <Ban className="w-4 h-4" />
                    </Button>
                ) : null}
            </div>
            {ConfirmDelete && (
                <div className="fixed inset-0 z-100 flex items-center justify-center">

                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setConfirmDelete(false)}
                    />

                    {/* Modal */}
                    <div
                        className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl p-6"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Close */}
                        <button
                            onClick={() => setConfirmDelete(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <h2 className="text-lg font-semibold text-slate-900 mb-2">
                            Remove Member
                        </h2>

                        <p className="text-sm text-slate-600 mb-6">
                            Are you sure you want to remove{" "}
                            <span className="font-medium">{email}</span>?
                            This action cannot be undone.
                        </p>

                        <div className="flex justify-end gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setConfirmDelete(false)}
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={() => {
                                    onRemove?.();
                                    setConfirmDelete(false);
                                }}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Remove
                            </Button>
                        </div>
                    </div>
                </div>
            )}
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
