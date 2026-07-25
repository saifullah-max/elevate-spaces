"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OAUTH_ERROR_MAP, openAuthModal } from "@/lib/authModal";

function SignUpRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const errKey = params.get("error");
    const message = errKey ? OAUTH_ERROR_MAP[errKey] || "Sign up failed. Please try again." : null;
    openAuthModal("signup", message);
    const rawNext = params.get("next");
    const safeNext =
      rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";
    router.replace(safeNext);
  }, [router, params]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50">
      <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
    </div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      }
    >
      <SignUpRedirect />
    </Suspense>
  );
}
