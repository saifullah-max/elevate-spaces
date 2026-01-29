'use client';
import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || auth.user.role !== "ADMIN") {
      router.replace("/");
    }
  }, [router]);
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ background: "#222", color: "#fff", padding: 16, display: "flex", gap: 24 }}>
        <Link href="/admin/dashboard">Dashboard</Link>
        <Link href="/admin/photographer-approvals">Photographer Approvals</Link>
        <Link href="/">Visit Website</Link>
      </nav>
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  );
}
