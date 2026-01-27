"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAppDispatch } from "@/store/hooks";
import { setAuth } from "@/store/slices/authSlice";
import { saveAuthToStorage } from "@/lib/auth.storage";

function GoogleCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());

    // Check for user info and token from backend redirect
    // Backend sends: token, userId, email, name, provider, isNewUser, avatarUrl (optional)
    if (params.token && params.userId && params.email) {
      try {
        // Use role from backend if present, fallback to 'USER'
        const role = params.role || "USER";
        const user = {
          id: params.userId,
          email: params.email,
          name: params.name || "",
          role: role,
          avatarUrl: params.avatarUrl || null,
        };

        // Save to Redux store
        dispatch(setAuth({ user, token: params.token as string }));

        // Save persistently in localStorage
        saveAuthToStorage(user, params.token as string);

        console.log("Google OAuth success:", user);
        
        // Redirect immediately after saving
        router.replace("/");
      } catch (err) {
        console.error("Failed to parse user from Google callback:", err);
        router.replace("/sign-in?error=oauth_failed");
      }
    } else if (params.error) {
      // Handle error case
      console.error("OAuth error:", params.error);
      router.replace(`/sign-in?error=${params.error}`);
    }
  }, [searchParams, router, dispatch]);

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
