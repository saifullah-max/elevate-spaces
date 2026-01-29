// This client component checks if the user is admin and redirects to /admin/dashboard
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";

export default function AdminAutoRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Prevent redirect if coming from admin or if session flag is set
    const fromAdmin = document.referrer.includes("/admin");
    const skipAdminRedirect = sessionStorage.getItem("skipAdminRedirect");
    const auth = getAuthFromStorage();
    if (auth && auth.user && auth.user.role === "ADMIN" && !fromAdmin && !skipAdminRedirect) {
      router.replace("/admin/dashboard");
    }
    // Always clear the flag after landing on /
    if (skipAdminRedirect) {
      sessionStorage.removeItem("skipAdminRedirect");
    }
  }, [router]);
  return null;
}
