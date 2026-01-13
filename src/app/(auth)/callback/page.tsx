"use client";

import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function OAuthCallbackPage() {
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");
        const error = searchParams.get("error");

        if (token) {
            localStorage.setItem("token", token);
            // redirect to dashboard or homepage
            window.location.href = "/";
        } else {
            console.error("OAuth failed", error);
            // optional: redirect to login page
            window.location.href = "/login?error=" + error;
        }
    }, [searchParams]);

    return <div>Processing authentication...</div>;
}
