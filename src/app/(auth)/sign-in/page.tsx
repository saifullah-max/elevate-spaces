"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { OAUTH_ERROR_MAP, openAuthModal } from "@/lib/authModal";

function SignInRedirect() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const errKey = params.get("error");
    const message = errKey ? OAUTH_ERROR_MAP[errKey] || "Authentication failed. Please try again." : null;
    openAuthModal("login", message);
    // Honor ?next= so the user lands back where they came from once the auth
    // modal completes. Only same-origin, root-relative paths are allowed.
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

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-cream-50">
          <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
        </div>
      }
    >
      <SignInRedirect />
    </Suspense>
  );
}
