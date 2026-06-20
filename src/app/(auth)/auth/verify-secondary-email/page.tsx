'use client';

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { verifySecondaryEmailToken } from "@/services/auth.service";

type Status = "pending" | "success" | "expired" | "taken" | "error";

function VerifySecondaryEmailInner() {
  const searchParams = useSearchParams();
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
      const result = await verifySecondaryEmailToken(token);
      if (cancelled) return;
      if (result.success) {
        setStatus("success");
      } else if (result.code === "VERIFICATION_TOKEN_EXPIRED") {
        setStatus("expired");
      } else if (result.code === "SECONDARY_EMAIL_TAKEN") {
        setStatus("taken");
      } else {
        setStatus("error");
      }
      setMessage(result.message || "");
    })();
    return () => { cancelled = true; };
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-linear-to-br from-indigo-50 via-white to-purple-50">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-4">
        {status === "pending" && (
          <>
            <Loader2 className="w-10 h-10 mx-auto animate-spin text-indigo-600" />
            <h1 className="text-xl font-semibold">Confirming your secondary email…</h1>
            <p className="text-sm text-slate-600">This will only take a moment.</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <h1 className="text-xl font-semibold">Secondary email confirmed</h1>
            <p className="text-sm text-slate-600">
              {message || "You can now sign in with either email on this account."}
            </p>
            <Link href="/settings" className="inline-block">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">Back to settings</Button>
            </Link>
          </>
        )}
        {status === "expired" && (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-amber-500" />
            <h1 className="text-xl font-semibold">This link has expired</h1>
            <p className="text-sm text-slate-600">{message || "Open Settings and resend the confirmation link."}</p>
            <Link href="/settings" className="inline-block">
              <Button variant="outline" className="w-full">Go to settings</Button>
            </Link>
          </>
        )}
        {status === "taken" && (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold">Email no longer available</h1>
            <p className="text-sm text-slate-600">{message || "Another account has claimed this email. Choose a different address in Settings."}</p>
            <Link href="/settings" className="inline-block">
              <Button variant="outline" className="w-full">Go to settings</Button>
            </Link>
          </>
        )}
        {status === "error" && (
          <>
            <AlertTriangle className="w-12 h-12 mx-auto text-red-500" />
            <h1 className="text-xl font-semibold">We couldn&apos;t confirm this email</h1>
            <p className="text-sm text-slate-600">{message || "The link is invalid or has already been used."}</p>
            <Link href="/settings" className="inline-block">
              <Button variant="outline" className="w-full">Go to settings</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerifySecondaryEmailPage() {
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
      <VerifySecondaryEmailInner />
    </Suspense>
  );
}
