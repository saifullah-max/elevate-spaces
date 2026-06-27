'use client';

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifyEmailToken } from "@/services/auth.service";

type Status = "pending" | "success" | "already" | "expired" | "error";

function VerifyEmailInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<Status>("pending");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This confirmation link is missing its token. Please use the link from the email exactly as we sent it.");
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await verifyEmailToken(token);
      if (cancelled) return;
      if (result.success && result.alreadyVerified) {
        setStatus("already");
      } else if (result.success) {
        setStatus("success");
        setTimeout(() => {
          router.push("/thank-you");
        }, 2000);
      } else if (result.code === "VERIFICATION_TOKEN_EXPIRED") {
        setStatus("expired");
      } else {
        setStatus("error");
      }
      setMessage(result.message || "");
    })();
    return () => { cancelled = true; };
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
        {status === "pending" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-600" />
            <h1 className="text-xl font-semibold">Confirming your account…</h1>
            <p className="text-sm text-slate-600">This will only take a moment.</p>
          </>
        )}
        {(status === "success" || status === "already") && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <h1 className="text-xl font-semibold">
              {status === "already" ? "Already confirmed" : "Email confirmed!"}
            </h1>
            <p className="text-sm text-slate-600">
              {status === "already"
                ? "Your account is already active — go ahead and sign in."
                : "Your account is active. Taking you to get started…"}
            </p>
            {status === "success" && (
              <Link href="/thank-you" className="inline-block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Get Started
                </Button>
              </Link>
            )}
            {status === "already" && (
              <Link href="/sign-in" className="inline-block">
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                  Sign in
                </Button>
              </Link>
            )}
          </>
        )}
        {status === "expired" && (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
            <h1 className="text-xl font-semibold">This link has expired</h1>
            <p className="text-sm text-slate-600">{message || "Request a fresh confirmation link from the sign-in page."}</p>
            <Link href="/sign-in" className="inline-block">
              <Button variant="outline" className="w-full">Go to sign in</Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold">We couldn&apos;t confirm this account</h1>
            <p className="text-sm text-slate-600">{message || "The link is invalid or has already been used."}</p>
            <Link href="/sign-in" className="inline-block">
              <Button variant="outline" className="w-full">Go to sign in</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-indigo-50 via-white to-purple-50">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-600" />
            <h1 className="text-xl font-semibold">Loading…</h1>
          </div>
        </div>
      }
    >
      <VerifyEmailInner />
    </Suspense>
  );
}
