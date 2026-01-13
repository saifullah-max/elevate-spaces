"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    const userId = searchParams.get("userId");
    const email = searchParams.get("email");
    const name = searchParams.get("name");
    const avatarUrl = searchParams.get("avatarUrl");

    if (!token) {
      setError("Authentication failed. No token received.");
      return;
    }

    try {
      // Store auth data
      localStorage.setItem("token", token);
      
      if (userId || email || name) {
        const user = {
          id: userId,
          email: email ? decodeURIComponent(email) : null,
          name: name ? decodeURIComponent(name.replace(/\+/g, " ")) : null,
          avatarUrl: avatarUrl ? decodeURIComponent(avatarUrl) : null,
        };
        localStorage.setItem("user", JSON.stringify(user));
      }

      // Redirect to home page
      router.replace("/home");
    } catch (err) {
      console.error("Auth callback error:", err);
      setError("Failed to complete authentication. Please try again.");
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4 text-red-500">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Authentication Error
          </h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <button
            onClick={() => router.push("/sign-in")}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <div className="text-center p-8">
        <Loader2 className="w-12 h-12 mx-auto text-indigo-600 animate-spin mb-4" />
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          Completing Sign In...
        </h1>
        <p className="text-slate-600">Please wait while we authenticate you.</p>
      </div>
    </div>
  );
}
