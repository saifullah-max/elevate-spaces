"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Loader2, Save, ExternalLink, Upload, FileDown, Youtube, Lightbulb, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { showError, showSuccess } from "@/components/toastUtils";
import { getResources, saveResource, type ResourceItem, type ResourceTip, getResourceAssetUrl } from "@/services/resources.service";
import { Button } from "@/components/ui/button";

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("resources");
  const [title, setTitle] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [tips, setTips] = useState<ResourceTip[]>([]);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.slug === selectedSlug) || null,
    [resources, selectedSlug]
  );

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color.configure({ types: ["textStyle"] })],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] rounded-b-xl border border-cream-200 border-t-0 px-4 py-4 focus:outline-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-brand-900 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-brand-900 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
      },
    },
  });

  const addTip = () => setTips((prev) => [...prev, { heading: "", body: "" }]);
  const updateTip = (idx: number, patch: Partial<ResourceTip>) =>
    setTips((prev) => prev.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  const removeTip = (idx: number) => setTips((prev) => prev.filter((_, i) => i !== idx));
  const moveTip = (idx: number, dir: -1 | 1) =>
    setTips((prev) => {
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const next = prev.slice();
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });

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
      } catch (error: any) {
        showError(error?.message || "Failed to load resources");
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

  useEffect(() => {
    if (!selectedResource) {
      return;
    }

    setTitle(selectedResource.title || "");
    setYoutubeUrl(selectedResource.youtube_url || "");
    setPdfFile(null);
    setRemovePdf(false);
    setUploadProgress(null);
    setTips(
      (selectedResource.tips || []).map((t) => ({
        id: t.id,
        heading: t.heading || "",
        body: t.body || "",
        position: t.position,
      }))
    );
    if (editor && editor.getHTML() !== (selectedResource.content_html || "<p></p>")) {
      editor.commands.setContent(selectedResource.content_html || "<p></p>");
    }
  }, [editor, selectedResource]);

  const handleSave = async () => {
    if (!editor) return;

    const targetSlug = selectedSlug.trim();
    if (!targetSlug) {
      showError("Slug is required");
      return;
    }

    try {
      setSaving(true);
      setUploadProgress(pdfFile ? 0 : null);

      const updated = await saveResource(
        targetSlug,
        {
          title: title || "Resources",
          contentHtml: editor.getHTML(),
          tips: tips.map((t) => ({ heading: t.heading, body: t.body })),
          youtubeUrl,
          pdf: pdfFile,
          removePdf,
        },
        {
          onUploadProgress: (percent) => setUploadProgress(percent),
        }
      );

      setResources((previous) => {
        const exists = previous.some((item) => item.slug === updated.slug);
        if (!exists) {
          return [updated, ...previous];
        }
        return previous.map((item) => (item.slug === updated.slug ? updated : item));
      });

      setSelectedSlug(updated.slug);
      setYoutubeUrl(updated.youtube_url || "");
      setTips(
        (updated.tips || []).map((t) => ({
          id: t.id,
          heading: t.heading || "",
          body: t.body || "",
          position: t.position,
        }))
      );
      setPdfFile(null);
      setRemovePdf(false);
      setUploadProgress(null);
      showSuccess(`${updated.title} saved successfully.`);
    } catch (error: any) {
      showError(error?.message || "Failed to save resource");
    } finally {
      setSaving(false);
      if (!pdfFile) {
        setUploadProgress(null);
      }
    }
  };

  const currentPdfUrl = selectedResource?.pdf_filename && !removePdf ? getResourceAssetUrl(selectedResource.slug) : null;
  const hasPdfToShow = Boolean(pdfFile) || Boolean(selectedResource?.pdf_filename && !removePdf);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-cream-800/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading resource manager...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-brand-900">Resources</h1>
        <p className="mt-1 text-sm text-cream-800/70">Edit the public resources page from one place.</p>
        <div className="mt-4 space-y-2">
          {resources.map((resource) => (
            <button
              key={resource.slug}
              type="button"
              onClick={() => setSelectedSlug(resource.slug)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${selectedSlug === resource.slug
                ? "border-brand-500 bg-brand-50 text-brand-900"
                : "border-cream-200 bg-white text-cream-800/80 hover:bg-cream-50"
                }`}
            >
              <div className="font-semibold">{resource.title}</div>
              <div className="mt-1 text-xs text-cream-800/50">/{resource.slug}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b border-cream-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">{selectedResource?.title || "Resources"}</h2>
            <p className="text-sm text-cream-800/70">Manage text, PDF and YouTube link for the public resources page.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/resources"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-lg border border-cream-200 px-4 py-2 text-sm font-medium text-cream-800/80 hover:bg-cream-50"
            >
              <ExternalLink className="h-4 w-4" /> View page
            </Link>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !editor}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save changes
            </button>
          </div>
        </div>

        {saving && uploadProgress !== null ? (
          <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 p-3">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-brand-900">
              <span>Uploading PDF...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100">
              <div className="h-full bg-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
            </div>
          </div>
        ) : null}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-cream-800/80">Slug</label>
            <input
              value={selectedSlug}
              onChange={(event) => setSelectedSlug(event.target.value)}
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
              placeholder="resources"
              disabled
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-cream-800/80">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
              placeholder="AI Virtual Staging Resources"
            />
          </div>

          <div>
            <label className="mb-1 flex items-center gap-2 text-sm font-medium text-cream-800/80">
              <Youtube className="h-4 w-4 text-red-600" /> YouTube URL
            </label>
            <input
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
              placeholder="https://www.youtube.com/watch?v=..."
            />
            <p className="mt-1 text-xs text-cream-800/50">Paste a YouTube link instead of uploading a video file.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <AssetUploadCard
              title="PDF"
              description="Attach a downloadable PDF guide or worksheet."
              icon={<FileDown className="h-4 w-4" />}
              file={pdfFile}
              currentName={selectedResource?.pdf_filename || null}
              currentUrl={currentPdfUrl}
              accept="application/pdf"
              onChange={(file) => {
                setPdfFile(file);
                setRemovePdf(false);
              }}
              onRemovePdf={() => {
                setPdfFile(null);
                setRemovePdf(true);
              }}
              showCurrentFile={hasPdfToShow}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-cream-800/80">Content</label>
            <div className="flex flex-wrap gap-2 rounded-t-xl border border-cream-200 bg-cream-50 p-2">
              <button type="button" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-cream-800/80 hover:bg-cream-100">H2</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBold().run()} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-cream-800/80 hover:bg-cream-100">Bold</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleItalic().run()} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-cream-800/80 hover:bg-cream-100">Italic</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleBulletList().run()} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-cream-800/80 hover:bg-cream-100">Bullets</button>
              <button type="button" onClick={() => editor?.chain().focus().toggleOrderedList().run()} className="rounded-md bg-white px-3 py-2 text-sm font-medium text-cream-800/80 hover:bg-cream-100">Numbered</button>
            </div>
            <EditorContent editor={editor} />
          </div>

          <div className="border-t border-cream-200 pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-brand-500" />
                <h3 className="text-sm font-semibold text-brand-900">Staging tips</h3>
                <span className="rounded-full bg-cream-100 px-2 py-0.5 text-[10px] font-semibold text-cream-800/60">
                  {tips.length}
                </span>
              </div>
              <button
                type="button"
                onClick={addTip}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-500/40 px-3 py-1.5 text-xs font-semibold text-brand-500 hover:bg-brand-50"
              >
                <Plus className="h-3.5 w-3.5" /> Add tip
              </button>
            </div>
            <p className="mb-4 text-xs text-cream-800/60">
              Each tip is rendered as a card on the public resources page. Leave the list empty to
              hide the section entirely.
            </p>

            {tips.length === 0 ? (
              <div className="rounded-xl border border-dashed border-cream-200 bg-cream-50 py-8 text-center text-xs text-cream-800/50">
                No tips yet — click <span className="font-semibold">Add tip</span> to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {tips.map((tip, idx) => (
                  <div
                    key={tip.id ?? `new-${idx}`}
                    className="rounded-xl border border-cream-200 bg-white p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-cream-800/50">
                        Tip {idx + 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveTip(idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                          className="rounded-md p-1.5 text-cream-800/50 hover:bg-cream-50 disabled:opacity-30"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTip(idx, 1)}
                          disabled={idx === tips.length - 1}
                          aria-label="Move down"
                          className="rounded-md p-1.5 text-cream-800/50 hover:bg-cream-50 disabled:opacity-30"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeTip(idx)}
                          aria-label="Remove"
                          className="rounded-md p-1.5 text-cream-800/50 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <label className="mb-1 block text-xs font-medium text-cream-800/70">
                      Heading
                    </label>
                    <input
                      value={tip.heading}
                      onChange={(e) => updateTip(idx, { heading: e.target.value })}
                      className="mb-3 w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
                      placeholder="e.g. Shoot with the widest lens you have"
                    />
                    <label className="mb-1 block text-xs font-medium text-cream-800/70">
                      Text
                    </label>
                    <textarea
                      value={tip.body}
                      onChange={(e) => updateTip(idx, { body: e.target.value })}
                      rows={3}
                      className="w-full resize-y rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
                      placeholder="Short paragraph explaining the tip."
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function AssetUploadCard({
  title,
  description,
  icon,
  file,
  currentName,
  currentUrl,
  accept,
  onChange,
  onRemovePdf,
  showCurrentFile,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  file: File | null;
  currentName: string | null;
  currentUrl: string | null;
  accept: string;
  onChange: (file: File | null) => void;
  onRemovePdf: () => void;
  showCurrentFile: boolean;
}) {
  return (
    <div className="rounded-xl border border-cream-200 p-4">
      <div className="flex items-center gap-2 text-brand-900">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <p className="mt-1 text-sm text-cream-800/70">{description}</p>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-cream-200 px-4 py-5 text-center hover:border-brand-500 hover:bg-brand-50/40">
        <Upload className="h-5 w-5 text-cream-800/50" />
        <span className="mt-2 text-sm font-medium text-cream-800/80">Choose {title.toLowerCase()}</span>
        <span className="mt-1 text-xs text-cream-800/50">{file ? file.name : showCurrentFile ? currentName || "No file selected" : "No file selected"}</span>
        <input type="file" className="hidden" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} />
      </label>
      <div className="flex flex-row align-middle gap-6 mt-4">
        {showCurrentFile && currentUrl ? (
          <Link href={currentUrl} target="_blank" className="pt-2 inline-flex text-sm font-medium text-brand-500 hover:underline">
            View current {title.toLowerCase()}
          </Link>
        ) : null}
        {showCurrentFile ? (
          <Button type="button" variant="ghost" className="text-red-500 text-md underline" onClick={onRemovePdf} >Remove</Button>
        ) : null}
      </div>
    </div>
  );
}

