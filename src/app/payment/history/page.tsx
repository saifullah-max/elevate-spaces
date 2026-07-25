"use client";

import { PaymentsTab } from "@/components/PaymentsTab";

export default function PaymentHistoryPage() {
  return (
    <div className="min-h-screen bg-cream-50 px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-900">Payment & Invoices</h1>
          <p className="mt-2 text-cream-800/70">Unified billing view for subscriptions, invoices, and downloads.</p>
        </div>
        <PaymentsTab />
      </div>
    </div>
  );
}
