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
        const role = (params.role || "USER") as "USER" | "PHOTOGRAPHER" | "ADMIN";
        const user = {
          id: params.userId,
          email: params.email,
          name: params.name || "",
          role,
          avatarUrl: params.avatarUrl || null,
          created_at: params.created_at || new Date().toISOString(),
        };

        // Save to Redux store
        dispatch(setAuth({ user, token: params.token as string }));

        // Save persistently in localStorage
        saveAuthToStorage(user, params.token as string);

        // If the OAuth flow originated from a team-invite link, send the user
        // back to accept-invite so their freshly-created (or linked) account
        // gets added to the team automatically.
        if (params.inviteToken) {
          router.replace(`/accept-invite?token=${encodeURIComponent(params.inviteToken)}`);
        } else {
          router.replace("/");
        }
      } catch (err) {
        router.replace("/sign-in?error=oauth_failed");
      }
    } else if (params.error) {
      // Handle error case
      router.replace(`/sign-in?error=${encodeURIComponent(params.error)}`);
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
