"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || auth.user.role !== "ADMIN") {
      router.replace("/");
    } else {
      setChecked(true);
    }
  }, [router]);

  const handleVisitWebsite = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('skipAdminRedirect', '1');
      router.push("/");
    }
  };

  if (!checked) return null;

  return (
    <div>
      <h1>Welcome, Admin!</h1>
      <p>This is your dashboard. Use the navigation above to manage the platform.</p>
      <button
        onClick={handleVisitWebsite}
        style={{ marginTop: 24, display: "inline-block", background: "#0070f3", color: "#fff", padding: "8px 16px", borderRadius: 4 }}
      >
        Visit Website
      </button>
    </div>
  );
}
