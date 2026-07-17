"use client";

import { useEffect, useState } from "react";
import LegalWrapper from "@/components/legalWrapper";
import type { LegalDocumentSlug } from "@/lib/legal-documents";
import { LEGAL_DOCUMENT_CONFIG } from "@/lib/legal-documents";
import { getLegalDocument, type LegalDocument } from "@/services/legal.service";
import { Loader2 } from "lucide-react";
import SupportForm from "@/components/support/SupportForm";

export default function LegalDocumentPage({ slug }: { slug: LegalDocumentSlug }) {
  const fallback = LEGAL_DOCUMENT_CONFIG[slug];
  const [document, setDocument] = useState<LegalDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadDocument = async () => {
      try {
        const data = await getLegalDocument(slug);
        if (mounted) {
          setDocument(data);
        }
      } catch {
        if (mounted) {
          setDocument(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDocument();
    return () => {
      mounted = false;
    };
  }, [slug]);

  return (
    <LegalWrapper
      title={document?.title || fallback.title}
      description={document?.description || fallback.description}
    >
      {loading ? (
        <div className="flex items-center gap-2 text-cream-800/50">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading legal content...
        </div>
      ) : (
        <article
          className="space-y-4"
          dangerouslySetInnerHTML={{
            __html:
              document?.contentHtml ||
              `<p>The latest content for this page is temporarily unavailable. Please try again shortly.</p>`,
          }}
        />
      )}
      {slug === "support" ? <SupportForm /> : null}
    </LegalWrapper>
  );
}
