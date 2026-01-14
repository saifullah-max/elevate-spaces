"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GoogleCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Example: store token from backend redirect
    if (params.token) {
      localStorage.setItem("token", params.token);
    }

    // Redirect to main app page
    router.replace("/");
  }, [searchParams, router]);

  return (
    <div className="flex items-center justify-center h-screen text-center">
      <p className="text-gray-700 text-lg">Logging you in…</p>
    </div>
  );
}
