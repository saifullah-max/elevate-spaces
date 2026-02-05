'use client'

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptInvite } from "@/services/teams.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CheckCircle, AlertTriangle } from "lucide-react";
import { connection } from "next/server";

export default async function AcceptInvitePage() {
    await connection();
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = useMemo(() => searchParams.get("token"), [searchParams]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [requiresSignup, setRequiresSignup] = useState(false);
    const [email, setEmail] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        const verifyInvite = async () => {
            if (!token) return;
            setLoading(true);
            setError(null);
            setSuccessMessage(null);
            try {
                const res = await acceptInvite({ token });
                if (res.requiresSignup) {
                    setRequiresSignup(true);
                    setEmail(res.email || null);
                } else if (res.accepted) {
                    setSuccessMessage(res.message || "Invitation accepted");
                } else {
                    setSuccessMessage(res.message || "Invitation processed");
                }
            } catch (err: any) {
                setError(err.message || "Failed to process invitation");
            } finally {
                setLoading(false);
            }
        };

        verifyInvite();
    }, [token]);

    const handleCompleteSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!name.trim()) {
            setError("Name is required");
            return;
        }

        if (!password || password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (!token) {
            setError("Invite token is missing");
            return;
        }

        try {
            setLoading(true);
            const res = await acceptInvite({ token, name: name.trim(), password });
            if (res.accepted) {
                setSuccessMessage(res.message || "Invitation accepted");
                setRequiresSignup(false);
            } else {
                setError(res.message || "Unable to accept invitation");
            }
        } catch (err: any) {
            setError(err.message || "Failed to complete signup");
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100 max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-slate-800">Invalid Invitation</h1>
                    <p className="text-slate-600 mt-2">The invitation link is missing a token.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-indigo-100 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-indigo-100 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Accept Team Invite</h1>
                        <p className="text-slate-500 text-sm">Join your team in seconds</p>
                    </div>
                </div>

                {loading && !successMessage && !error && (
                    <div className="text-center text-slate-600">Processing invitation...</div>
                )}

                {successMessage && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
                        <div className="flex items-center gap-2 text-green-700 font-medium">
                            <CheckCircle className="w-5 h-5" />
                            {successMessage}
                        </div>
                        <div className="mt-4">
                            <Button
                                onClick={() => router.push("/sign-in")}
                                className="w-full bg-indigo-600 hover:bg-indigo-700"
                            >
                                Go to Sign In
                            </Button>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
                        <p className="text-red-700 font-medium">{error}</p>
                    </div>
                )}

                {requiresSignup && !successMessage && (
                    <form onSubmit={handleCompleteSignup} className="space-y-4">
                        <div>
                            <Label>Email</Label>
                            <Input value={email || ""} disabled className="mt-1" />
                        </div>
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="Create a password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirm-password">Confirm Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                placeholder="Confirm password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 hover:bg-indigo-700"
                        >
                            {loading ? "Creating account..." : "Create Account & Accept Invite"}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
