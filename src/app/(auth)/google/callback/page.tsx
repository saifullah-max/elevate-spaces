"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { connection } from "next/server";

export default async function GoogleCallbackPage() {
    const router = useRouter();
    await connection();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Extract query params (code, state, token, whatever you passed)
        const params = Object.fromEntries(searchParams.entries());

        // Here you can store token in localStorage/cookie if needed
        if (params.token) {
            localStorage.setItem("token", params.token);
        }

        // Redirect to the page you actually want users to land
        router.replace("/"); // or "/"
    }, [router, searchParams]);

    return <div className="p-6 text-center">Logging you in…</div>;
}
