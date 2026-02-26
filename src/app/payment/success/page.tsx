"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader, AlertCircle } from "lucide-react";
import Link from "next/link";

interface SessionStatus {
  status: string;
  customer_email?: string;
  amount_total?: number;
  currency?: string;
  payment_status?: string;
  subscription?: string;
  metadata?: Record<string, string>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000/api";

function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No session ID provided");
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        // Try to get auth token, but it's not required
        let token = null;
        const authRaw = localStorage.getItem("elevate_spaces_auth");
        if (authRaw) {
          try {
            const auth = JSON.parse(authRaw);
            token = auth.token;
          } catch (e) {
            console.error("Failed to parse auth data:", e);
          }
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/payment/session/${sessionId}`, {
          method: "GET",
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setSession(data);
      } catch (err: any) {
        console.error("Failed to fetch session details:", err);
        setError(err?.message || "Failed to fetch session details");
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Processing...</h1>
          <p className="text-slate-600">Verifying your payment</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lanrarbr from-red-50 to-rose-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Cannot Verify Payment</h1>
            <p className="text-slate-600 text-sm">{error}</p>
            <p className="text-slate-500 text-xs mt-2">Session ID: {sessionId?.slice(0, 20)}...</p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              ℹ️ Your payment has been processed by Stripe. If you don't see your credits, please contact support with your session ID.
            </p>
          </div>
          <Link
            href="/teams"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const formatPrice = (amount?: number, currency?: string) => {
    if (!amount) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(amount / 100);
  };

  const creditsAwarded = session?.metadata?.credits ? parseInt(session.metadata.credits) : 0;
  const productName = session?.metadata?.productKey ? 
    session.metadata.productKey.replace(/_/g, " ").toUpperCase() : 
    "Product";

  return (
    <div className="min-h-screen bg-linear-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-green-600 to-emerald-600 px-8 py-12 text-center space-y-4">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">Payment Successful!</h1>
            <p className="text-green-100 font-medium">Your purchase is complete</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Confirmation Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-green-900">Order Confirmed</p>
              <p className="text-sm text-green-700">
                Your payment has been processed successfully. Credits will be available in your account immediately.
              </p>
            </div>

            {/* Order Details */}
            <div className="space-y-3 bg-slate-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Product:</span>
                <span className="font-medium text-slate-900 capitalize">{productName.toLowerCase()}</span>
              </div>
              {session?.amount_total && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Amount Paid:</span>
                  <span className="font-semibold text-slate-900">
                    {formatPrice(session.amount_total, session.currency)}
                  </span>
                </div>
              )}
              {creditsAwarded > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600">Credits Awarded:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {creditsAwarded.toLocaleString()} credits
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200">
                <span className="text-slate-600">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600">Session ID:</span>
                <span className="font-mono text-xs text-slate-900 break-all">{sessionId?.slice(0, 16)}...</span>
              </div>
            </div>

            {/* What's Next */}
            <div className="space-y-2">
              <h3 className="font-semibold text-slate-900 text-sm">What's Next?</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Check your email for a receipt (check spam folder)</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Your credits are now available in your account</span>
                </li>
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Start using your credits right away</span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <Link
                href="/teams"
                className="w-full block text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <Link
                href="/test"
                className="w-full block text-center px-6 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-200">
            <p>
              Need help?{" "}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-600" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-600" />
            <span>Stripe Verified</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-linear-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Loader className="w-12 h-12 text-green-600 animate-spin mx-auto" />
          <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
        </div>
      </div>
    }>
      <PaymentSuccessHandler />
    </Suspense>
  );
}
