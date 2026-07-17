'use client'
import { Users } from "lucide-react";

interface TeamsHeaderProps {
    children: React.ReactNode;
}

export function TeamsHeader({ children }: TeamsHeaderProps) {
    return (
        <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
                <div className="bg-brand-100 p-3 rounded-lg">
                    <Users className="w-8 h-8 text-brand-500" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-brand-900">My Teams</h1>
                    <p className="text-cream-800/70 text-sm">Manage your teams and collaborations</p>
                </div>
            </div>
            {children}
        </div>
    );
}
