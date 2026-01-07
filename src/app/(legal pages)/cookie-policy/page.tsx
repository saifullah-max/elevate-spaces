"use client";

import LegalWrapper from "@/components/legalWrapper";


export default function CookiePolicy() {
    return (
      <LegalWrapper
        title="Cookie Policy"
        description="How and why we use cookies."
      >
        <p>
          We use essential cookies required for platform functionality, including
          authentication and session management.
        </p>
        <p>
          You can control or disable cookies through your browser settings, though
          some features may not function correctly.
        </p>
      </LegalWrapper>
    );
  }