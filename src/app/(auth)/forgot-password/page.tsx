"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
  // forgot-password api integration
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="w-full max-w-md p-8 space-y-8 rounded-xl shadow-xl bg-card border border-border">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight lg:text-5xl text-foreground">
            Forgot Password?
          </h1>
        </div>

        {/* Success Message (shown after submission) */}
        {submitted ? (
          <div className="text-center space-y-4">
            <p className="text-foreground">
              If an account exists with the email "{email}", we've sent reset
              instructions.
            </p>
            <Button asChild className="w-full h-11 font-medium">
              <Link href="/sign-in">Back to Sign In</Link>
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground">
              No worries! Enter your email and we'll send you a link to reset
              it.
            </p>
            <br />
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />

              <Button
                type="submit"
                className="w-full h-11 font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </Button>
            </form>
          </div>
        )}

        {/* Back to Sign In Link */}
        {!submitted && (
          <div className="text-center text-sm text-muted-foreground">
            <p>
              Remembered your password?{" "}
              <Link
                href="/sign-in"
                className="font-medium text-primary hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
