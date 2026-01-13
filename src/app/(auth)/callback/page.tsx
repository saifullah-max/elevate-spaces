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
            // optionally redirect to dashboard
            window.location.href = "/";
        } else {
            console.error("OAuth failed", error);
        }
    }, [searchParams]);

    return <div>Processing authentication...</div>;
}
