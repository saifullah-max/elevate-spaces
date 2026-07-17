"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { signUp } from "@/services/auth.service";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/slices/authSlice";
import { saveAuthToStorage } from "@/lib/auth.storage";
import { AgreementChecklistModal, AgreementItem } from "@/components/AgreementChecklistModal";

function PhotographerSignUpForm() {
  type PendingAgreementAction = "none" | "google-signup" | "manual-signup";

  const REGISTRATION_AGREEMENTS: AgreementItem[] = [
    {
      id: "acceptTermsAndPrivacy",
      required: true,
      label: (
        <>
          I agree to the <Link href="/terms-of-use" className="text-brand-500 hover:underline">Terms of Service</Link> and <Link href="/privacy-policy" className="text-brand-500 hover:underline">Privacy Policy</Link> and acknowledge that they constitute a legally binding agreement.
        </>
      ),
    },
    {
      id: "confirmAgeAndCapacity",
      required: true,
      label: "I confirm that I am at least eighteen (18) years old and legally capable of entering into a binding contract.",
    },
    {
      id: "confirmUploadRights",
      required: true,
      label: "I confirm that I have all necessary legal rights to upload any content submitted to the platform.",
    },
    {
      id: "acknowledgeAiLimitations",
      required: true,
      label: "I understand that AI-generated results may contain inaccuracies and are provided solely for marketing visualization purposes.",
    },
    {
      id: "acknowledgeCreditsPolicy",
      required: true,
      label: "I understand that subscription credits reset monthly, do not roll over, and expire if unused.",
    },
    {
      id: "acceptArbitrationWaiver",
      required: true,
      label: "I agree that any disputes will be resolved exclusively through binding arbitration on an individual basis and waive any right to participate in class actions or jury trials.",
    },
    {
      id: "acknowledgePhotographerDisclaimer",
      required: true,
      label: "I acknowledge that photographers are independent contractors and Elevate Spaces is not responsible for their services.",
    },
    {
      id: "promotionalCommunicationsOptIn",
      required: false,
      label: "I agree to receive promotional communications.",
    },
  ];

  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [photographerForm, setPhotographerForm] = useState({
    bio: "",
    availability: "",
    photographerType: "",
    yearsExperience: "",
    serviceArea: "",
    portfolioUrl: "",
    instagramUrl: "",
    websiteUrl: "",
    gearDescription: "",
    businessName: "",
    shortPitch: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fromDemoBonus, setFromDemoBonus] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationAgreementError, setRegistrationAgreementError] = useState<string | null>(null);
  const [pendingAgreementAction, setPendingAgreementAction] = useState<PendingAgreementAction>("none");
  const [registrationAgreements, setRegistrationAgreements] = useState<Record<string, boolean>>({
    acceptTermsAndPrivacy: false,
    confirmAgeAndCapacity: false,
    confirmUploadRights: false,
    acknowledgeAiLimitations: false,
    acknowledgeCreditsPolicy: false,
    acceptArbitrationWaiver: false,
    acknowledgePhotographerDisclaimer: false,
    promotionalCommunicationsOptIn: false,
  });

  useEffect(() => {
    const bonusParam = searchParams.get("bonus");
    const today = new Date().toDateString();
    const bonusOfferDate = localStorage.getItem("demo_bonus_offer_date");

    if (bonusParam === "true" || bonusOfferDate === today) {
      setFromDemoBonus(true);
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handlePhotographerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setPhotographerForm((previous) => ({
      ...previous,
      [e.target.name]: e.target.value,
    }));
    setError(null);
  };

  const hasAcceptedAllRequiredRegistrationAgreements = () => {
    return REGISTRATION_AGREEMENTS
      .filter((agreement) => agreement.required)
      .every((agreement) => Boolean(registrationAgreements[agreement.id]));
  };

  const handleRegistrationAgreementToggle = (id: string, value: boolean) => {
    setRegistrationAgreements((previous) => ({
      ...previous,
      [id]: value,
    }));
    setRegistrationAgreementError(null);
    setError(null);
  };

  const handleRegistrationModalOpenChange = (open: boolean) => {
    setShowRegistrationModal(open);
    if (!open) {
      setPendingAgreementAction("none");
      setRegistrationAgreementError(null);
    }
  };

  const startGoogleSignupFlow = () => {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_API;
    if (!baseUrl) {
      setError("OAuth configuration is missing. Please try email signup.");
      return;
    }

    const query = new URLSearchParams({
      intent: "signup",
      agreementsAccepted: "true",
    });
    if (fromDemoBonus) {
      query.set("fromDemoBonus", "true");
    }
    window.location.href = `${baseUrl}/auth/google?${query.toString()}`;
  };

  const performManualSignUp = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await signUp({
        name: form.name,
        email: form.email,
        password: form.password,
        fromDemoBonus,
        requestedRole: "PHOTOGRAPHER",
        photographerProfile: {
          bio: photographerForm.bio,
          availability: photographerForm.availability,
          photographerType: photographerForm.photographerType,
          yearsExperience: photographerForm.yearsExperience,
          serviceArea: photographerForm.serviceArea,
          portfolioUrl: photographerForm.portfolioUrl,
          instagramUrl: photographerForm.instagramUrl,
          websiteUrl: photographerForm.websiteUrl,
          gearDescription: photographerForm.gearDescription,
          businessName: photographerForm.businessName,
          shortPitch: photographerForm.shortPitch,
        },
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

      if (response.success && response.user && response.token) {
        dispatch(setAuth({ user: response.user, token: response.token }));
        saveAuthToStorage(response.user, response.token);
        localStorage.setItem("elevate_spaces_show_resources_onboarding", "true");

        setSuccess(true);
        setForm({ name: "", email: "", password: "" });

        if (fromDemoBonus) {
          localStorage.removeItem("demo_bonus_offer_date");
        }

        setTimeout(() => {
          router.push("/");
        }, 1500);
      }
    } catch (err: unknown) {
      const errorMessage =
        typeof err === "object" && err !== null && "message" in err
          ? (err as { message: string }).message
          : "Sign up failed. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = () => {
    if (!hasAcceptedAllRequiredRegistrationAgreements()) {
      setRegistrationAgreementError("You must accept all required registration agreements to continue.");
      setError("You must accept all required registration agreements to continue.");
      setPendingAgreementAction("google-signup");
      setShowRegistrationModal(true);
      return;
    }

    setPendingAgreementAction("none");
    startGoogleSignupFlow();
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!hasAcceptedAllRequiredRegistrationAgreements()) {
      setRegistrationAgreementError("You must accept all required registration agreements to continue.");
      setError("You must accept all required registration agreements to continue.");
      setPendingAgreementAction("manual-signup");
      setShowRegistrationModal(true);
      return;
    }

    await performManualSignUp();
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-linear-to-br from-cream-50 to-white">
      <div className="w-full max-w-3xl p-8 space-y-8 rounded-2xl bg-white shadow-lg border border-cream-200">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-brand-500 p-3 rounded-xl shadow-sm">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-900">Create your photographer account</h1>
          <p className="text-cream-800/70 mt-2">Join the marketplace and submit your photographer profile in one step</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {fromDemoBonus && !success && (
            <div className="p-3 bg-linear-to-r from-brand-50 to-cream-100 border border-brand-100 rounded-lg">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-500" />
                <p className="text-sm font-semibold text-brand-900">Bonus Offer: You'll receive 5 free credits instantly!</p>
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {fromDemoBonus ? (
                <>
                  <p className="font-semibold flex items-center gap-1">
                    <Sparkles className="w-4 h-4" />
                    Account created! 5 bonus credits added to your account!
                  </p>
                  <p className="text-xs mt-1">Redirecting...</p>
                </>
              ) : (
                "Account created successfully! Redirecting..."
              )}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cream-800/80 mb-1">Name</label>
              <Input name="name" placeholder="Enter your full name" value={form.name} onChange={handleChange} required className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-cream-800/80 mb-1">Email</label>
              <Input name="email" type="email" placeholder="you@example.com" value={form.email} onChange={handleChange} required className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-medium text-cream-800/80 mb-1">Password</label>
              <div className="relative">
                <Input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  className="h-11 pr-10 border-cream-200 focus:border-brand-500 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-800/50 hover:text-cream-800/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/60 p-4">
            <div>
              <h3 className="text-sm font-semibold text-brand-900">Photographer onboarding details</h3>
              <p className="text-xs text-brand-900 mt-1">These details help the admin review your application faster.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input name="businessName" value={photographerForm.businessName} onChange={handlePhotographerChange} placeholder="Business name" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="photographerType" value={photographerForm.photographerType} onChange={handlePhotographerChange} placeholder="Photographer type (real estate, interiors, drone)" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="yearsExperience" value={photographerForm.yearsExperience} onChange={handlePhotographerChange} placeholder="Years of experience" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="serviceArea" value={photographerForm.serviceArea} onChange={handlePhotographerChange} placeholder="Primary service area" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="portfolioUrl" value={photographerForm.portfolioUrl} onChange={handlePhotographerChange} placeholder="Portfolio URL" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="instagramUrl" value={photographerForm.instagramUrl} onChange={handlePhotographerChange} placeholder="Instagram URL" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="websiteUrl" value={photographerForm.websiteUrl} onChange={handlePhotographerChange} placeholder="Website URL" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
              <Input name="availability" value={photographerForm.availability} onChange={handlePhotographerChange} placeholder="Availability placeholder" className="h-11 border-cream-200 focus:border-brand-500 focus:ring-brand-500" />
            </div>

            <textarea name="bio" value={photographerForm.bio} onChange={handlePhotographerChange} className="min-h-28 w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="Short professional bio" />
            <textarea name="shortPitch" value={photographerForm.shortPitch} onChange={handlePhotographerChange} className="min-h-24 w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="Why should clients hire you?" />
            <textarea name="gearDescription" value={photographerForm.gearDescription} onChange={handlePhotographerChange} className="min-h-24 w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500" placeholder="Camera / gear / equipment details" />
          </div>

          <Button type="submit" className="w-full h-11 font-semibold bg-brand-500 hover:bg-brand-600 text-white shadow-md hover:shadow-lg transition-all duration-200" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Apply as Photographer"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-cream-200 hover:bg-cream-50 text-cream-800/80"
            onClick={() => {
              setRegistrationAgreementError(null);
              setPendingAgreementAction("none");
              setShowRegistrationModal(true);
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

          <div className="mt-6 grid grid-cols-1 gap-3">
            <Button variant="outline" className="h-11 border-cream-200 hover:bg-cream-50 text-cream-800/80 hover:border-cream-200" type="button" onClick={handleGoogleSignUp}>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66v-2.77h-3.57c-1.04.67-2.3 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.38-.99-.6-2.04-.6-3.09 0-1.05.22-2.1.6-3.09V5.07H2.18C1.43 6.91 1 8.93 1 11s.43 4.09 1.18 5.91l3.66-2.82z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
            </Button>
            {/* <Button variant="outline" className="h-11 border-cream-200 hover:bg-cream-50 text-cream-800/80 hover:border-cream-200">
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="#000000">
                <path d="M11.182.008C11.148-.03 9.923.023 8.857 1.18c-1.066 1.156-.902 2.482-.878 2.516s1.52.087 2.475-1.258.762-2.391.728-2.43m3.314 11.733c-.048-.096-2.325-1.234-2.113-3.422s1.675-2.789 1.698-2.854-.597-.79-1.254-1.157a3.7 3.7 0 0 0-1.563-.434c-.108-.003-.483-.095-1.254.116-.508.139-1.653.589-1.968.607-.316.018-1.256-.522-2.267-.665-.647-.125-1.333.131-1.824.328-.49.196-1.422.754-2.074 2.237-.652 1.482-.311 3.83-.067 4.56s.625 1.924 1.273 2.796c.576.984 1.34 1.667 1.659 1.734.319.067 1.162-.173 1.954-.483.792-.31 1.356-.515 1.693-.515.337 0 .911.205 1.703.515.792.31 1.636.45 1.955.483.318-.067 1.077-.75 1.653-1.734.576-.984 1.022-1.845 1.022-2.796 0-1.518-.623-3.053-1.698-3.422-.374-.126-.92-.215-1.51-.215-.59 0-1.236.089-1.51.215z" />
              </svg>
            </Button>
            <Button variant="outline" className="h-11 border-cream-200 hover:bg-cream-50 text-cream-800/80 hover:border-cream-200">
              <svg className="w-5 h-5" viewBox="0 0 16 16" fill="#1877F2">
                <path d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951" />
              </svg>
            </Button> */}
          </div>
        </div>

        <AgreementChecklistModal
          open={showRegistrationModal}
          onOpenChange={handleRegistrationModalOpenChange}
          title="At Account Registration"
          description="Please review and accept the required agreements to create your account."
          agreements={REGISTRATION_AGREEMENTS}
          values={registrationAgreements}
          onToggle={handleRegistrationAgreementToggle}
          onConfirm={() => {
            if (!hasAcceptedAllRequiredRegistrationAgreements()) {
              setRegistrationAgreementError("You must accept all required registration agreements to continue.");
              return;
            }

            const actionToContinue = pendingAgreementAction;
            setRegistrationAgreementError(null);
            setPendingAgreementAction("none");
            setShowRegistrationModal(false);

            if (actionToContinue === "google-signup") {
              startGoogleSignupFlow();
              return;
            }

            if (actionToContinue === "manual-signup") {
              void performManualSignUp();
            }
          }}
          confirmLabel="Confirm and continue"
          confirmDisabled={!hasAcceptedAllRequiredRegistrationAgreements()}
          error={registrationAgreementError}
        />

        <div className="text-center pt-4">
          <p className="text-cream-800/70 text-sm">
            Already have an account?{" "}
            <Link href="/sign-in" className="font-semibold text-brand-500 hover:text-brand-600 hover:underline transition-colors">
              Sign in
            </Link>
          </p>
          <p className="mt-2 text-xs text-cream-800/50">
            Want a normal user account?{" "}
            <Link href="/sign-up" className="font-semibold text-brand-500 hover:text-brand-600 hover:underline transition-colors">
              Sign up as user
            </Link>
          </p>
          <p className="text-xs text-cream-800/50 mt-3">By signing up, you agree to our Terms and Privacy Policy</p>
        </div>
      </div>
    </div>
  );
}

export default function PhotographerSignUpPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>}>
      <PhotographerSignUpForm />
    </Suspense>
  );
}
