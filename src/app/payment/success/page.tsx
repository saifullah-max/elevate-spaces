"use client";
import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Check, Loader, AlertCircle } from "lucide-react";
import Link from "next/link";
import { jsPDF } from "jspdf";
import SupportModalTrigger from "@/components/support/SupportModalTrigger";
import { trackPurchase } from "@/lib/analytics";

interface SessionStatus {
  status: string;
  customer_email?: string;
  amount_total?: number;
  currency?: string;
  payment_status?: string;
  subscription?: string;
  invoiceId?: string | null;
  invoicePdf?: string | null;
  hostedInvoiceUrl?: string | null;
  resolvedProductKey?: string | null;
  resolvedProductName?: string | null;
  resolvedProductCategory?: string | null;
  metadata?: Record<string, string>;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API || "http://localhost:5000/api";
const PHYSICAL_STAGING_CONTACT_EMAIL = "hello@elevatespacesai.com";

function PaymentSuccessHandler() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  const [session, setSession] = useState<SessionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const purchaseReportedRef = React.useRef(false);

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
          }
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}/payment/session/${sessionId}?ts=${Date.now()}`, {
          method: "GET",
          headers,
          cache: "no-store",
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        setSession(data);

        // Fire conversion exactly once per session_id, gated on Stripe marking
        // the session paid. This is best-effort: ad-blockers may drop it.
        const alreadyReported = sessionStorage.getItem(`purchase_tracked_${sessionId}`);
        const paid = (data?.payment_status || "").toLowerCase() === "paid"
          || (data?.status || "").toLowerCase() === "complete";
        if (paid && !alreadyReported && !purchaseReportedRef.current) {
          purchaseReportedRef.current = true;
          sessionStorage.setItem(`purchase_tracked_${sessionId}`, "1");
          trackPurchase({
            value: typeof data?.amount_total === "number" ? data.amount_total / 100 : 0,
            currency: (data?.currency || "USD").toUpperCase(),
            transactionId: sessionId || undefined,
            productName: data?.resolvedProductName || data?.metadata?.productName,
          });
        }
      } catch (err: any) {
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
          <h1 className="text-2xl font-bold text-brand-900">Processing...</h1>
          <p className="text-cream-800/70">Verifying your payment</p>
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
            <h1 className="text-2xl font-bold text-brand-900 mb-2">Cannot Verify Payment</h1>
            <p className="text-cream-800/70 text-sm">{error}</p>
            <p className="text-cream-800/50 text-xs mt-2">Session ID: {sessionId?.slice(0, 20)}...</p>
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
  const hasCreditsAwarded = Number.isFinite(creditsAwarded) && creditsAwarded > 0;
  const rawProductKey = session?.metadata?.productKey || "";
  const normalizedProductKey = rawProductKey.toLowerCase().trim().replace(/[\s-]+/g, "_");
  const rawProductName = session?.metadata?.productName || "";
  const normalizedProductName = rawProductName.toLowerCase().trim();
  const resolvedProductKey = (session?.resolvedProductKey || "").toLowerCase();
  const resolvedProductName = session?.resolvedProductName || "";
  const resolvedProductCategory = (session?.resolvedProductCategory || "").toLowerCase();
  const productNameMap: Record<string, string> = {
    furnishing_addon: "Physical Staging Purchase Support",
    virtual_staging: "Full Home Virtual Staging",
    pay_per_image: "Pay Per Image",
    subscription_topup: "Subscription Top-Up Credits",
    plan_starter: "Starter",
    plan_pro: "Pro",
    plan_team: "Team",
    plan_starter_annual: "Starter Annual",
    plan_pro_annual: "Pro Annual",
    plan_team_annual: "Team Annual",
  };
  const productName =
    resolvedProductName ||
    productNameMap[resolvedProductKey] ||
    productNameMap[normalizedProductKey] ||
    rawProductName ||
    (rawProductKey ? rawProductKey.replace(/[\s_]+/g, " ") : "Product");
  const productFingerprint = [
    resolvedProductKey,
    resolvedProductName,
    resolvedProductCategory,
    normalizedProductKey,
    normalizedProductName,
    rawProductKey,
    rawProductName,
    productName,
  ]
    .join(" ")
    .toLowerCase()
    .trim();
  const isFurnishingAddon =
    resolvedProductCategory === "addon" ||
    resolvedProductKey === "furnishing_addon" ||
    productFingerprint.includes("furnishing_addon") ||
    productFingerprint.includes("furnishing addon") ||
    productFingerprint.includes("physical staging") ||
    (productFingerprint.includes("furnishing") && productFingerprint.includes("addon")) ||
    normalizedProductKey === "furnishing_addon" ||
    normalizedProductName.includes("furnishing") ||
    normalizedProductName.includes("physical staging") ||
    (rawProductKey.toLowerCase().includes("furnishing") && rawProductKey.toLowerCase().includes("addon"));
  const isSubscriptionPlanPayment =
    session?.subscription !== undefined && session?.subscription !== null
      ? true
      : ["starter", "pro", "team"].includes(resolvedProductKey || normalizedProductKey);
  const invoicePdfUrl = session?.invoicePdf || session?.hostedInvoiceUrl || null;

  const openInvoicePdf = () => {
    if (invoicePdfUrl) {
      window.open(invoicePdfUrl, "_blank", "noopener,noreferrer");
      return;
    }

    handleSaveReceiptPdf();
  };

  const handleSaveReceiptPdf = () => {
    const documentPdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const receiptDate = new Date().toLocaleString();
    const amountPaidText = session?.amount_total ? formatPrice(session.amount_total, session.currency) : "N/A";
    const paymentStatusText = session?.payment_status ? session.payment_status.toUpperCase() : "PAID";
    const paymentTypeText = isFurnishingAddon
      ? "ADD-ON PURCHASE"
      : isSubscriptionPlanPayment
        ? "SUBSCRIPTION PLAN"
        : hasCreditsAwarded
          ? "CREDIT PURCHASE"
          : "PAYMENT";
    const shortSessionId = sessionId ? `${sessionId.slice(0, 24)}...` : "N/A";

    const marginX = 14;
    const pageWidth = 210;
    const contentWidth = pageWidth - marginX * 2;

    documentPdf.setFillColor(22, 163, 74);
    documentPdf.roundedRect(marginX, 12, contentWidth, 28, 3, 3, "F");
    documentPdf.setTextColor(255, 255, 255);
    documentPdf.setFont("helvetica", "bold");
    documentPdf.setFontSize(18);
    documentPdf.text("Elevate Spaces - Payment Receipt", marginX + 6, 24);
    documentPdf.setFont("helvetica", "normal");
    documentPdf.setFontSize(11);
    documentPdf.text("Order Confirmed", marginX + 6, 31);

    documentPdf.setTextColor(31, 41, 55);
    documentPdf.setFont("helvetica", "bold");
    documentPdf.setFontSize(13);
    documentPdf.text("Receipt Details", marginX, 50);

    documentPdf.setDrawColor(226, 232, 240);
    documentPdf.roundedRect(marginX, 54, contentWidth, 54, 2, 2, "S");

    const rowStartY = 62;
    const rowGap = 8;
    const labelX = marginX + 4;
    const valueX = marginX + 54;

    documentPdf.setFont("helvetica", "bold");
    documentPdf.setFontSize(10);
    documentPdf.text("Product:", labelX, rowStartY);
    documentPdf.text("Amount Paid:", labelX, rowStartY + rowGap);
    documentPdf.text("Payment Type:", labelX, rowStartY + rowGap * 2);
    documentPdf.text("Status:", labelX, rowStartY + rowGap * 3);
    documentPdf.text("Date:", labelX, rowStartY + rowGap * 4);
    documentPdf.text("Session ID:", labelX, rowStartY + rowGap * 5);

    documentPdf.setFont("helvetica", "normal");
    documentPdf.text(productName, valueX, rowStartY);
    documentPdf.text(amountPaidText, valueX, rowStartY + rowGap);
    documentPdf.text(paymentTypeText, valueX, rowStartY + rowGap * 2);
    documentPdf.text(paymentStatusText, valueX, rowStartY + rowGap * 3);
    documentPdf.text(receiptDate, valueX, rowStartY + rowGap * 4);
    documentPdf.text(shortSessionId, valueX, rowStartY + rowGap * 5);

    let cursorY = 122;
    documentPdf.setFont("helvetica", "bold");
    documentPdf.setFontSize(13);
    documentPdf.text("What's Next", marginX, cursorY);
    cursorY += 7;

    documentPdf.setFont("helvetica", "normal");
    documentPdf.setFontSize(10);

    const bulletLines: string[] = [
      "Check your email for a payment receipt (including spam folder).",
    ];

    if (isFurnishingAddon) {
      bulletLines.push(
        `Save this payment receipt as PDF and send it to ${PHYSICAL_STAGING_CONTACT_EMAIL}.`,
        "Include required details: staging references, product preferences, and project access instructions.",
        "You can share details by adding us to your team/project or by email coordination."
      );
    } else if (isSubscriptionPlanPayment) {
      bulletLines.push(
        "Your subscription plan payment is confirmed and billing has been activated.",
        "Keep this PDF for accounting and subscription records."
      );
    } else if (hasCreditsAwarded) {
      bulletLines.push(
        "Your credits are now available in your account.",
        "You can start using your credits immediately."
      );
    } else {
      bulletLines.push("Your purchase is confirmed. You can continue from your dashboard.");
    }

    bulletLines.forEach((line) => {
      const wrapped = documentPdf.splitTextToSize(line, contentWidth - 7);
      documentPdf.text("•", marginX + 1, cursorY);
      documentPdf.text(wrapped, marginX + 5, cursorY);
      cursorY += wrapped.length * 5 + 2;
    });

    if (isFurnishingAddon) {
      cursorY += 2;
      documentPdf.setDrawColor(191, 219, 254);
      documentPdf.setFillColor(239, 246, 255);
      const noteHeight = 20;
      documentPdf.roundedRect(marginX, cursorY, contentWidth, noteHeight, 2, 2, "FD");
      documentPdf.setFont("helvetica", "bold");
      documentPdf.setFontSize(10);
      documentPdf.setTextColor(30, 64, 175);
      documentPdf.text("Physical Staging Requirement", marginX + 3, cursorY + 6);
      documentPdf.setFont("helvetica", "normal");
      documentPdf.setTextColor(30, 58, 138);
      const noteText = `Please email this receipt PDF and your required details to ${PHYSICAL_STAGING_CONTACT_EMAIL} before we begin coordination.`;
      const wrappedNote = documentPdf.splitTextToSize(noteText, contentWidth - 6);
      documentPdf.text(wrappedNote, marginX + 3, cursorY + 11);
      documentPdf.setTextColor(31, 41, 55);
    }

    const safeSession = (sessionId || "receipt").replace(/[^a-zA-Z0-9_-]/g, "");
    const fileName = `elevate-spaces-receipt-${safeSession.slice(0, 20)}.pdf`;
    documentPdf.save(fileName);
  };

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
                {isFurnishingAddon
                  ? "Your payment has been processed successfully. Your physical staging support add-on request is now confirmed."
                  : invoicePdfUrl
                    ? "Your payment has been processed successfully. Stripe has generated your branded invoice PDF and email receipt."
                  : hasCreditsAwarded
                    ? "Your payment has been processed successfully. Credits will be available in your account immediately."
                    : "Your payment has been processed successfully. Your purchase is now confirmed."}
              </p>
            </div>

            {/* Order Details */}
            <div className="space-y-3 bg-cream-50 rounded-lg p-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-cream-800/70">Product:</span>
                <span className="font-medium text-brand-900">{productName}</span>
              </div>
              {session?.amount_total && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cream-800/70">Amount Paid:</span>
                  <span className="font-semibold text-brand-900">
                    {formatPrice(session.amount_total, session.currency)}
                  </span>
                </div>
              )}
              {!isFurnishingAddon && hasCreditsAwarded && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cream-800/70">Credits Awarded:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                    {creditsAwarded.toLocaleString()} credits
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center text-sm pt-2 border-t border-cream-200">
                <span className="text-cream-800/70">Status:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Paid
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-cream-800/70">Session ID:</span>
                <span className="font-mono text-xs text-brand-900 break-all">{sessionId?.slice(0, 16)}...</span>
              </div>
              {invoicePdfUrl && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-cream-800/70">Invoice PDF:</span>
                  <a
                    href={invoicePdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline"
                  >
                    Open Stripe Invoice
                  </a>
                </div>
              )}
            </div>

            {/* What's Next */}
            <div className="space-y-2">
              <h3 className="font-semibold text-brand-900 text-sm">What's Next?</h3>
              <ul className="space-y-2 text-sm text-cream-800/70">
                <li className="flex gap-2">
                  <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  <span>Check your email for a receipt (check spam folder)</span>
                </li>
                {isFurnishingAddon ? (
                  <>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Share your requirements via the Support page, or add us by creating a team and adding us to your project.</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Save this payment receipt as PDF and email the receipt PDF plus your requirements/details to {PHYSICAL_STAGING_CONTACT_EMAIL}.</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>We will coordinate the purchase process with you based on your virtually staged images after we receive your email.</span>
                    </li>
                  </>
                ) : hasCreditsAwarded ? (
                  <>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Your credits are now available in your account</span>
                    </li>
                    <li className="flex gap-2">
                      <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                      <span>Start using your credits right away</span>
                    </li>
                  </>
                ) : (
                  <li className="flex gap-2">
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                    <span>You can return to your dashboard to continue.</span>
                  </li>
                )}
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-cream-200">
              <Link
                href="/"
                className="w-full block text-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={openInvoicePdf}
                className="w-full block text-center px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                {invoicePdfUrl ? "Download Stripe Invoice PDF" : "Save Receipt (PDF)"}
              </button>
              <Link
                href="/"
                className="w-full block text-center px-6 py-3 bg-cream-100 text-brand-900 font-semibold rounded-lg hover:bg-cream-200 transition-colors"
              >
                Continue Shopping
              </Link>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-cream-50 px-8 py-4 text-center text-xs text-cream-800/50 border-t border-cream-200">
            <p>
              Need help?{" "}
              <SupportModalTrigger className="text-blue-600 hover:underline font-medium">
                Contact Support
              </SupportModalTrigger>
            </p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="mt-6 flex justify-center gap-4 text-xs text-cream-800/70">
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
          <h1 className="text-2xl font-bold text-brand-900">Loading...</h1>
        </div>
      </div>
    }>
      <PaymentSuccessHandler />
    </Suspense>
  );
}
