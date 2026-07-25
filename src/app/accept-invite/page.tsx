'use client'
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { acceptInvite } from "@/services/teams.service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, CheckCircle, AlertTriangle } from "lucide-react";
import { AgreementChecklistModal } from "@/components/AgreementChecklistModal";
import {
    REGISTRATION_AGREEMENTS,
    initialRegistrationAgreements,
    allRequiredAgreementsAccepted,
} from "@/lib/registrationAgreements";
import { getAuthFromStorage, saveAuthToStorage } from "@/lib/auth.storage";
import { useAppDispatch } from "@/store/hooks";
import { setAuth, type User as AuthUser, type UserRole } from "@/store/slices/authSlice";

const VALID_ROLES: UserRole[] = ["USER", "PHOTOGRAPHER", "ADMIN"];
const normalizeRole = (raw?: string | null): UserRole =>
    (VALID_ROLES.includes((raw || "") as UserRole) ? raw : "USER") as UserRole;

type PendingAgreementAction = "none" | "manual-signup" | "google-signup";

function AcceptInvitePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const token = useMemo(() => searchParams.get("token"), [searchParams]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [requiresSignup, setRequiresSignup] = useState(false);
    const [email, setEmail] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [registrationAgreements, setRegistrationAgreements] = useState<Record<string, boolean>>({
        ...initialRegistrationAgreements,
    });
    const [showAgreementModal, setShowAgreementModal] = useState(false);
    const [agreementError, setAgreementError] = useState<string | null>(null);
    const [pendingAction, setPendingAction] = useState<PendingAgreementAction>("none");

    // After a successful accept, drop the user straight into the app whenever
    // we already have an auth session — either freshly returned by this call
    // (manual signup) or already saved by an earlier OAuth callback (Google
    // signup). They've just signed up, so re-asking them to sign in or
    // re-accept the invite is friction we don't need.
    const finishAcceptedFlow = (response: Awaited<ReturnType<typeof acceptInvite>>) => {
        if (response.token && response.user) {
            const nextUser: AuthUser = {
                id: response.user.id,
                email: response.user.email,
                name: response.user.name || "",
                role: normalizeRole(response.user.role),
                avatarUrl: response.user.avatarUrl ?? null,
                manualAvatarUrl: response.user.manualAvatarUrl ?? null,
            };
            dispatch(setAuth({ user: nextUser, token: response.token }));
            saveAuthToStorage(nextUser, response.token);
            router.replace("/");
            return true;
        }

        // No fresh token returned — but if storage already has one (e.g. the
        // user just came back from the Google OAuth callback), they're signed
        // in already and can go straight home.
        if (getAuthFromStorage()) {
            router.replace("/");
            return true;
        }

        return false;
    };

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
                    if (finishAcceptedFlow(res)) return;
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

    const handleAgreementToggle = (id: string, value: boolean) => {
        setRegistrationAgreements((previous) => ({ ...previous, [id]: value }));
        setAgreementError(null);
    };

    const validateManualForm = (): boolean => {
        if (!name.trim()) {
            setError("Name is required");
            return false;
        }
        if (!password || password.length < 8) {
            setError("Password must be at least 8 characters");
            return false;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return false;
        }
        if (!token) {
            setError("Invite token is missing");
            return false;
        }
        return true;
    };

    const performManualSignup = async () => {
        if (!token) return;
        try {
            setLoading(true);
            setError(null);
            const res = await acceptInvite({
                token,
                name: name.trim(),
                password,
                registrationAgreements: {
                    acceptTermsAndPrivacy: Boolean(registrationAgreements.acceptTermsAndPrivacy),
                    confirmAgeAndCapacity: Boolean(registrationAgreements.confirmAgeAndCapacity),
                    confirmUploadRights: Boolean(registrationAgreements.confirmUploadRights),
                    acknowledgeAiLimitations: Boolean(registrationAgreements.acknowledgeAiLimitations),
                    acknowledgeCreditsPolicy: Boolean(registrationAgreements.acknowledgeCreditsPolicy),
                    acceptArbitrationWaiver: Boolean(registrationAgreements.acceptArbitrationWaiver),
                    acknowledgePhotographerDisclaimer: Boolean(registrationAgreements.acknowledgePhotographerDisclaimer),
                    promotionalCommunicationsOptIn: Boolean(registrationAgreements.promotionalCommunicationsOptIn),
                },
            });
            if (res.accepted) {
                setRequiresSignup(false);
                if (finishAcceptedFlow(res)) return;
                setSuccessMessage(res.message || "Invitation accepted");
            } else {
                setError(res.message || "Unable to accept invitation");
            }
        } catch (err: any) {
            setError(err.message || "Failed to complete signup");
        } finally {
            setLoading(false);
        }
    };

    const startGoogleSignupFlow = () => {
        if (!token) return;
        const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API;
        if (!baseUrl) {
            setError("OAuth configuration is missing. Please use email signup.");
            return;
        }
        const query = new URLSearchParams({
            intent: "signup",
            agreementsAccepted: "true",
            inviteToken: token,
        });
        window.location.href = `${baseUrl}/auth/google?${query.toString()}`;
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!validateManualForm()) return;

        if (!allRequiredAgreementsAccepted(registrationAgreements)) {
            setAgreementError("You must accept all required registration agreements to continue.");
            setPendingAction("manual-signup");
            setShowAgreementModal(true);
            return;
        }
        void performManualSignup();
    };

    const handleGoogleSignup = () => {
        if (!token) return;
        setError(null);

        if (!allRequiredAgreementsAccepted(registrationAgreements)) {
            setAgreementError("You must accept all required registration agreements to continue.");
            setPendingAction("google-signup");
            setShowAgreementModal(true);
            return;
        }
        startGoogleSignupFlow();
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-brand-50 via-white to-cream-50">
                <div className="bg-white rounded-2xl shadow-xl p-8 border border-brand-100 max-w-md w-full text-center">
                    <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
                    <h1 className="text-xl font-semibold text-brand-900">Invalid Invitation</h1>
                    <p className="text-cream-800/70 mt-2">The invitation link is missing a token.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-brand-50 via-white to-cream-50 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-brand-100 max-w-md w-full">
                <div className="flex items-center gap-3 mb-6">
                    <div className="bg-brand-100 p-3 rounded-lg">
                        <Users className="w-6 h-6 text-brand-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-brand-900">Accept Team Invite</h1>
                        <p className="text-cream-800/50 text-sm">Join your team in seconds</p>
                    </div>
                </div>

                {loading && !successMessage && !error && (
                    <div className="text-center text-cream-800/70">Processing invitation...</div>
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
                                className="w-full bg-brand-500 hover:bg-brand-600"
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
                    <>
                        <form onSubmit={handleManualSubmit} className="space-y-4">
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
                                    placeholder="Create a strong password (min. 8 characters)"
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
                                className="w-full bg-brand-500 hover:bg-brand-600"
                            >
                                {loading ? "Creating account..." : "Create Account & Accept Invite"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => {
                                    setAgreementError(null);
                                    setPendingAction("none");
                                    setShowAgreementModal(true);
                                }}
                            >
                                Review registration agreements
                            </Button>
                        </form>

                        <div className="mt-6">
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-cream-200" />
                                </div>
                                <div className="relative flex justify-center text-sm">
                                    <span className="bg-white px-4 text-cream-800/50">Or continue with</span>
                                </div>
                            </div>

                            <Button
                                type="button"
                                variant="outline"
                                className="w-full mt-4 h-11"
                                onClick={handleGoogleSignup}
                                disabled={loading}
                            >
                                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66v-2.77h-3.57c-1.04.67-2.3 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.38-.99-.6-2.04-.6-3.09 0-1.05.22-2.1.6-3.09V5.07H2.18C1.43 6.91 1 8.93 1 11s.43 4.09 1.18 5.91l3.66-2.82z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
                                </svg>
                                Sign up with Google
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <AgreementChecklistModal
                open={showAgreementModal}
                onOpenChange={(open) => {
                    if (!open) setAgreementError(null);
                    setShowAgreementModal(open);
                }}
                title="At Account Registration"
                description="Please review and accept the required agreements to create your account."
                agreements={REGISTRATION_AGREEMENTS}
                values={registrationAgreements}
                onToggle={handleAgreementToggle}
                onConfirm={() => {
                    if (!allRequiredAgreementsAccepted(registrationAgreements)) {
                        setAgreementError("You must accept all required registration agreements to continue.");
                        return;
                    }
                    const next = pendingAction;
                    setAgreementError(null);
                    setPendingAction("none");
                    setShowAgreementModal(false);
                    if (next === "google-signup") {
                        startGoogleSignupFlow();
                    } else if (next === "manual-signup") {
                        void performManualSignup();
                    }
                }}
                confirmLabel="Confirm and continue"
                confirmDisabled={!allRequiredAgreementsAccepted(registrationAgreements)}
                error={agreementError}
            />
        </div>
    );
}

export default function AcceptInviteWrapper() {
    return (
        <Suspense fallback={<div>Processing...</div>}>
            <AcceptInvitePage />
        </Suspense>
    );
}
