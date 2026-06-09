'use client'
import { Check, Clock, X } from "lucide-react";

export function getStatusBadgeColor(status: string): string {
    switch (status) {
        case "ACCEPTED":
            return "bg-green-100 text-green-800";
        case "PENDING":
            return "bg-amber-100 text-amber-800";
        case "FAILED":
            return "bg-red-100 text-red-800";
        default:
            return "bg-slate-100 text-slate-800";
    }
}

export function getStatusIcon(status: string): React.ReactNode {
    switch (status) {
        case "ACCEPTED":
            return <Check className="w-3 h-3 mr-1" />;
        case "PENDING":
            return <Clock className="w-3 h-3 mr-1" />;
        case "FAILED":
            return <X className="w-3 h-3 mr-1" />;
        default:
            return null;
    }
}
