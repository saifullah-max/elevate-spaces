"use client";
import React from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PaymentError() {
  const searchParams = useSearchParams();
  const errorType = searchParams.get("type") || "failed"; // 'failed' or 'cancelled'

  const isCancel = errorType === "cancelled";

  const errorConfig = {
    failed: {
      title: "Payment Failed",
      message:
        "Unfortunately, your payment could not be processed. Please check your payment details and try again.",
      icon: AlertCircle,
      color: "from-red-600 to-rose-600",
      bgColor: "bg-red-50",
    },
    cancelled: {
      title: "Purchase Cancelled",
      message:
        "You've cancelled your purchase. No charges have been made to your account.",
      icon: AlertCircle,
      color: "from-amber-600 to-orange-600",
      bgColor: "bg-amber-50",
    },
  };

  const config = errorConfig[isCancel ? "cancelled" : "failed"];
  const Icon = config.icon;

  return (
    <div className={`min-h-screen bg-linear-to-br ${config.bgColor} to-slate-100 flex items-center justify-center p-4`}>
      <div className="max-w-md w-full">
        {/* Error Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className={`bg-linear-to-r ${config.color} px-8 py-12 text-center space-y-4`}>
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto">
              <Icon className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-black text-white">{config.title}</h1>
            <p className="text-white text-opacity-90 font-medium">Transaction not completed</p>
          </div>

          {/* Content */}
          <div className="px-8 py-8 space-y-6">
            {/* Error Message */}
            <div className={`${isCancel ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200"} border rounded-lg p-4 space-y-2`}>
              <p className={`text-sm font-semibold ${isCancel ? "text-amber-900" : "text-red-900"}`}>
                {isCancel ? "Action Cancelled" : "What Went Wrong"}
              </p>
              <p className={`text-sm ${isCancel ? "text-amber-700" : "text-red-700"}`}>
                {config.message}
              </p>
            </div>

            {/* Common Reasons */}
            {!isCancel && (
              <div className="space-y-2">
                <h3 className="font-semibold text-slate-900 text-sm">Common reasons for payment failure:</h3>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Insufficient funds in your account</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Incorrect card details (number, expiry, CVV)</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Card expired or blocked by your bank</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>Address verification failed</span>
                  </li>
                </ul>
              </div>
            )}

            {/* Recommendation */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-900">💡 Need Help?</p>
              <p className="text-sm text-blue-700">
                If you continue to experience issues, please contact our support team. We're here to help!
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <Link
                href="/test"
                className={`w-full block text-center px-6 py-3 font-semibold rounded-lg transition-colors ${
                  isCancel
                    ? "bg-amber-600 text-white hover:bg-amber-700"
                    : "bg-red-600 text-white hover:bg-red-700"
                }`}
              >
                {isCancel ? "Return to Pricing" : "Try Again"}
              </Link>

              <button
                onClick={() => window.history.back()}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 font-semibold rounded-lg hover:bg-slate-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-50 px-8 py-4 text-center text-xs text-slate-500 border-t border-slate-200">
            <p>
              Questions?{" "}
              <a href="#" className="text-blue-600 hover:underline font-medium">
                Contact Support
              </a>{" "}
              or email{" "}
              <a href="mailto:support@example.com" className="text-blue-600 hover:underline font-medium">
                support@example.com
              </a>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 space-y-3 text-sm text-slate-600 text-center">
          <p>Your data is safe. No charges have been made to your account.</p>
          <div className="flex justify-center gap-4">
            <a href="#" className="text-blue-600 hover:underline font-medium">
              FAQs
            </a>
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Support
            </a>
            <a href="#" className="text-blue-600 hover:underline font-medium">
              Status
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
