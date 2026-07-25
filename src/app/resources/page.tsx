"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { FileText, Lightbulb, Youtube, Download, Loader2 } from "lucide-react";
import { getResources, getResourceAssetUrl, type ResourceItem } from "@/services/resources.service";

const Footer = dynamic(() => import("@/components/footer"), { ssr: false });

function youtubeEmbed(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace(/^\//, "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
      const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
      if (embedMatch) return url;
    }
    return null;
  } catch {
    return null;
  }
}

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getResources();
        if (mounted) setResources(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || "Failed to load resources");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const videoResources = useMemo(
    () =>
      resources.filter((r) => Boolean(r.youtube_url || r.video_filename)).slice(0, 4),
    [resources]
  );
  const deckResource = useMemo(() => resources.find((r) => r.pdf_filename), [resources]);
  const contentResources = useMemo(
    () => resources.filter((r) => (r.content_html || "").trim().length > 0),
    [resources]
  );
  const stagingTips = useMemo(
    () =>
      resources.flatMap((r) => r.tips || []).filter((t) => (t.heading || "").trim() || (t.body || "").trim()),
    [resources]
  );

  return (
    <div className="bg-cream-50 min-h-screen text-brand-900 antialiased">
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-14 md:py-20">
        <div className="text-center max-w-lg mx-auto mb-12">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">Resources</h1>
          <p className="text-cream-800/60 text-sm md:text-base mt-2">
            Everything you need to get the most out of Elevate Spaces AI.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-cream-800/60 text-sm">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Loading resources…
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-14 bg-red-50 border border-red-200 rounded-2xl p-5 text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Video walkthroughs — hidden until admin uploads a video or adds a YouTube link */}
            {!error && videoResources.length > 0 && (
              <div className="mb-14">
                <h2 className="font-bold text-sm uppercase tracking-wider text-brand-500 mb-4 flex items-center gap-2">
                  <Youtube className="w-4 h-4" /> Video walkthroughs
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {videoResources.map((r) => {
                    const embed = youtubeEmbed(r.youtube_url);
                    return (
                      <div
                        key={r.id}
                        className="bg-white border border-cream-200 rounded-2xl overflow-hidden"
                      >
                        <div className="aspect-video bg-cream-100">
                          {embed ? (
                            <iframe
                              className="w-full h-full"
                              src={embed}
                              title={r.title}
                              frameBorder={0}
                              allowFullScreen
                              loading="lazy"
                            />
                          ) : r.video_filename ? (
                            <video
                              className="w-full h-full object-cover"
                              controls
                              src={getResourceAssetUrl(r.slug, "video")}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-cream-800/40">
                              No video
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <p className="text-sm font-semibold text-brand-900">{r.title}</p>
                          {r.content_html && (
                            <p
                              className="text-xs text-cream-800/60 mt-1 line-clamp-2"
                              dangerouslySetInnerHTML={{ __html: r.content_html }}
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Onboarding deck */}
            {deckResource && (
              <div className="mb-14">
                <h2 className="font-bold text-sm uppercase tracking-wider text-brand-500 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Onboarding deck
                </h2>
                <div className="bg-white border border-cream-200 rounded-2xl p-6 flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-900">{deckResource.title}</p>
                      <p className="text-xs text-cream-800/60">
                        A quick walkthrough of the platform, credits, and staging styles.
                      </p>
                    </div>
                  </div>
                  <a
                    href={getResourceAssetUrl(deckResource.slug, "pdf")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Download deck
                  </a>
                </div>
              </div>
            )}

            {/* Article / long-form content — admin-managed rich text per resource */}
            {contentResources.length > 0 && (
              <div className="mb-14 space-y-8">
                {contentResources.map((r) => (
                  <article key={r.id} className="bg-white border border-cream-200 rounded-2xl p-6 md:p-8">
                    <h2 className="font-display text-lg md:text-xl font-bold text-brand-900 mb-4">
                      {r.title}
                    </h2>
                    <div
                      className="text-sm text-cream-800/70 leading-relaxed space-y-3 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-brand-900 [&_h2]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-brand-900 [&_h3]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-brand-900 [&_p]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-1 [&_a]:text-brand-500 [&_a]:underline [&_strong]:font-semibold [&_strong]:text-brand-900"
                      dangerouslySetInnerHTML={{ __html: r.content_html || "" }}
                    />
                  </article>
                ))}
              </div>
            )}

            {/* Staging tips — admin-managed */}
            {stagingTips.length > 0 && (
              <div>
                <h2 className="font-bold text-sm uppercase tracking-wider text-brand-500 mb-4 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" /> Staging tips
                </h2>
                <div className="grid sm:grid-cols-2 gap-5">
                  {stagingTips.map((tip, idx) => (
                    <div
                      key={tip.id || `${tip.heading}-${idx}`}
                      className="bg-white border border-cream-200 rounded-2xl p-5"
                    >
                      {tip.heading && (
                        <h3 className="text-sm font-semibold text-brand-900 mb-1.5">{tip.heading}</h3>
                      )}
                      {tip.body && (
                        <p className="text-xs text-cream-800/60 leading-relaxed whitespace-pre-wrap">
                          {tip.body}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}
