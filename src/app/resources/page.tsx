"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, FileDown, Loader2, PlayCircle } from "lucide-react";
import { getResources, getResourceAssetUrl, type ResourceItem } from "@/services/resources.service";

export default function ResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("resources");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadResources = async () => {
      try {
        const data = await getResources();
        if (!mounted) return;
        setResources(data);
        if (data.length > 0) {
          const initial = data.find((resource) => resource.slug === selectedSlug) || data[0];
          setSelectedSlug(initial.slug);
        }
      } catch {
        if (mounted) {
          setResources([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadResources();
    return () => {
      mounted = false;
    };
  }, []);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.slug === selectedSlug) || resources[0] || null,
    [resources, selectedSlug]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF7F2] text-slate-500">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading resources...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] px-4 py-14">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-linear-to-r from-slate-900 via-slate-800 to-indigo-900 px-6 py-10 text-white sm:px-10">
            <div className="flex items-center gap-2 text-indigo-200">
              <BookOpen className="h-5 w-5" />
              <span className="text-sm font-semibold uppercase tracking-wide">Resources</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold sm:text-4xl">AI Virtual Staging Resources</h1>
            <p className="mt-3 max-w-3xl text-sm text-slate-200 sm:text-base">
              Training notes, process documents, and media files maintained by the admin team.
            </p>
          </div>

          {resources.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
              {resources.map((resource) => (
                <button
                  key={resource.slug}
                  type="button"
                  onClick={() => setSelectedSlug(resource.slug)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    resource.slug === selectedSlug
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {resource.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {selectedResource ? (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">{selectedResource.slug}</p>
                  <h2 className="mt-1 text-2xl font-bold text-slate-900">{selectedResource.title}</h2>
                </div>
                <p className="text-xs text-slate-500">Updated {new Date(selectedResource.updated_at).toLocaleString()}</p>
              </div>

              <div className="prose prose-slate mt-6 max-w-none prose-headings:text-slate-900 prose-a:text-indigo-600">
                <div dangerouslySetInnerHTML={{ __html: selectedResource.content_html || "<p>This resource has not been published yet.</p>" }} />
              </div>
            </article>

            <aside className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Downloads</h3>
                <div className="mt-4 space-y-3">
                  <AssetLink
                    label={selectedResource.pdf_filename || "PDF guide"}
                    href={selectedResource.pdf_filename ? getResourceAssetUrl(selectedResource.slug, "pdf") : null}
                    icon={<FileDown className="h-4 w-4" />}
                    helper="Open the attached PDF in browser"
                  />
                  <AssetLink
                    label={selectedResource.video_filename || "Video guide"}
                    href={selectedResource.video_filename ? getResourceAssetUrl(selectedResource.slug, "video") : null}
                    icon={<PlayCircle className="h-4 w-4" />}
                    helper="Stream the attached video"
                  />
                </div>
              </div>
            </aside>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">No resources are published yet.</p>
            <p className="mt-2">Ask an admin to create the first resource entry from the admin resources page.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function AssetLink({
  label,
  href,
  icon,
  helper,
}: {
  label: string;
  href: string | null;
  icon: React.ReactNode;
  helper: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-slate-900">
        {icon}
        <p className="font-medium">{label}</p>
      </div>
      <p className="mt-1 text-xs text-slate-500">{helper}</p>
      {href ? (
        <a href={href} target="_blank" rel="noreferrer" className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:underline">
          Open file
        </a>
      ) : (
        <p className="mt-3 text-sm text-slate-400">Not attached</p>
      )}
    </div>
  );
}

