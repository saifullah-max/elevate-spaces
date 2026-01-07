"use client";

import LegalWrapper from "@/components/legalWrapper";

export default function TermsOfUse() {
  return (
    <LegalWrapper
      title="Terms of Use"
      description="Rules and conditions for using our AI staging platform."
    >
      <p>
        By accessing or using our services, you agree to comply with these Terms
        of Use. Our platform provides AI-powered virtual staging, renovation,
        and furnishing services for real estate marketing purposes only.
      </p>
      <p>
        You are responsible for ensuring that uploaded images do not violate any
        third-party rights and that you have permission to use them.
      </p>
    </LegalWrapper>
  );
}
