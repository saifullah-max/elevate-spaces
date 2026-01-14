"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Store token from backend if present
    if (params.token) {
      localStorage.setItem("token", params.token);
      console.log("params:", params);
    }

    // Redirect to main page after 5 seconds
    const timeout = setTimeout(() => {
      router.replace("/");
    }, 5000);

    return () => clearTimeout(timeout); // cleanup
  }, [searchParams, router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center gap-3">
      <p className="text-gray-700 text-lg">Logging you in…</p>
      <p className="text-sm text-gray-500">Redirecting in 5 seconds...</p>
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
