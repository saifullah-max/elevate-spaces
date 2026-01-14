"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Runs on client after mount
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Store token from backend if present
    if (params.token) {
      localStorage.setItem("token", params.token);
    }

    // Redirect to main page
    router.replace("/");
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center h-screen text-center">
      <p className="text-gray-700 text-lg">Logging you in…</p>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<p className="text-center p-6">Loading...</p>}>
      <GoogleCallbackHandler />
    </Suspense>
  );
}
