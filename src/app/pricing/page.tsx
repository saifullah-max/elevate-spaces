"use client";

import dynamic from "next/dynamic";
import Pricing from "@/components/pricing-new";

const Footer = dynamic(() => import("@/components/footer"), { ssr: false });

export default function PricingPage() {
  return (
    <div className="bg-cream-50 min-h-screen text-brand-900 antialiased">
      <Pricing />
      <Footer />
    </div>
  );
}
