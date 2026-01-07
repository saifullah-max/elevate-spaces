"use client";

import LegalWrapper from "@/components/legalWrapper";

export default function Disclaimer() {
  return (
    <LegalWrapper
      title="Disclaimer"
      description="Important legal limitations and notices."
    >
      <p>
        All AI-generated visuals are for marketing and illustrative purposes
        only. Results may not reflect exact dimensions, materials, or final
        outcomes.
      </p>
      <p>
        We make no guarantees regarding buyer decisions, property valuation, or
        sales outcomes.
      </p>
    </LegalWrapper>
  );
}
