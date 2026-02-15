// This client component checks if the user is admin and redirects to /admin/dashboard
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";

export default function AdminAutoRedirect() {
  const router = useRouter();
  useEffect(() => {
    const auth = getAuthFromStorage();
    
    // Only redirect admin on first load after login
    if (auth && auth.user && auth.user.role === "ADMIN") {
      // Check if admin has already been redirected in this session
      const hasBeenRedirected = sessionStorage.getItem("adminInitialRedirect");
      
      if (!hasBeenRedirected) {
        // First time visiting after login - redirect to dashboard
        sessionStorage.setItem("adminInitialRedirect", "true");
        router.replace("/admin/dashboard");
      }
      // If hasBeenRedirected is true, allow admin to stay on home page
    }
  }, [router]);
  
  return null;
}
