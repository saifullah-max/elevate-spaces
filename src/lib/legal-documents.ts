export type LegalDocumentSlug =
  | "terms-of-use"
  | "privacy-policy"
  | "cancellation-policy"
  | "cookie-policy"
  | "copyright-policy"
  | "disclaimer"
  | "support";

export const LEGAL_DOCUMENT_CONFIG: Record<
  LegalDocumentSlug,
  { title: string; description: string; href: string }
> = {
  "terms-of-use": {
    title: "Terms of Use",
    description: "Rules, conditions, and legal obligations governing use of Elevate Spaces.",
    href: "/terms-of-use",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    description: "How Elevate Spaces collects, uses, stores, and protects personal information.",
    href: "/privacy-policy",
  },
  "cancellation-policy": {
    title: "Cancellation & Refund",
    description: "Cancellation rights, refund rules, and chargeback consequences for Elevate Spaces purchases.",
    href: "/cancellation-policy",
  },
  "cookie-policy": {
    title: "Cookie Policy",
    description: "How Elevate Spaces uses cookies and similar tracking technologies across the platform.",
    href: "/cookie-policy",
  },
  "copyright-policy": {
    title: "Copyright Policy",
    description: "DMCA and copyright reporting procedures for intellectual property complaints.",
    href: "/copyright-policy",
  },
  disclaimer: {
    title: "Disclaimer",
    description: "Important limitations and disclaimers regarding AI-generated outputs and platform use.",
    href: "/disclaimer",
  },
  support: {
    title: "Support",
    description: "How to contact Elevate Spaces for assistance, support, and legal inquiries.",
    href: "/support",
  },
};

export const FOOTER_LEGAL_LINKS: Array<{ label: string; href: string }> = [
  { label: "Terms of Use", href: "/terms-of-use" },
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Cancellation & Refund", href: "/cancellation-policy" },
  { label: "Cookie Policy", href: "/cookie-policy" },
  { label: "Copyright Policy", href: "/copyright-policy" },
  { label: "Disclaimer", href: "/disclaimer" },
  { label: "Support", href: "/support" },
];
