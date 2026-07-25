"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordClient({ token }: { token: string }) {
  const router = useRouter();
  const API_BASE = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:3003";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage("Reset token missing. Please use the link from your email.");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/auth/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await resp.json();
      if (resp.ok && data?.success) {
        setMessage("Password reset successful. Redirecting to sign in...");
        setTimeout(() => router.push("/sign-in"), 1200);
      } else {
        setMessage(data?.message || "Reset failed. The link may be expired.");
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-xl bg-card border border-border">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Reset Password</h1>
        </div>

        {message && <p className="text-sm text-center text-foreground">{message}</p>}

        {!message?.includes("successful") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword((e.target as HTMLInputElement).value)}
              required
              className="h-11"
            />
            <Input
              type="password"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword((e.target as HTMLInputElement).value)}
              required
              className="h-11"
            />

            <Button disabled={loading} type="submit" className="w-full h-11">
              {loading ? "Saving…" : "Save New Password"}
            </Button>
          </form>
        )}

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
