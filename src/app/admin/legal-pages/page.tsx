"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Loader2, Save, ExternalLink, Bold, Italic, List, ListOrdered, Heading2, Heading3, Undo2, Redo2, ALargeSmall, X } from "lucide-react";
import { showError, showSuccess } from "@/components/toastUtils";
import { LEGAL_DOCUMENT_CONFIG, type LegalDocumentSlug } from "@/lib/legal-documents";
import { getLegalDocuments, saveLegalDocument, type LegalDocument } from "@/services/legal.service";

export default function AdminLegalPagesPage() {
  const [documents, setDocuments] = useState<LegalDocument[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<LegalDocumentSlug>("terms-of-use");
  const [title, setTitle] = useState(LEGAL_DOCUMENT_CONFIG["terms-of-use"].title);
  const [description, setDescription] = useState(LEGAL_DOCUMENT_CONFIG["terms-of-use"].description);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const selectedDocument = useMemo(
    () => documents.find((document) => document.slug === selectedSlug) || null,
    [documents, selectedSlug]
  );

  const editor = useEditor({
    extensions: [StarterKit, TextStyle, Color.configure({ types: ["textStyle"] })],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-[360px] rounded-b-xl border border-cream-200 border-t-0 px-4 py-4 focus:outline-none [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-brand-900 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-brand-900 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-brand-900 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1",
      },
    },
  });

  useEffect(() => {
    let mounted = true;

    const loadDocuments = async () => {
      try {
        const data = await getLegalDocuments();
        if (!mounted) return;
        setDocuments(data);
        if (data.length > 0) {
          const initial = data.find((document) => document.slug === selectedSlug) || data[0];
          setSelectedSlug(initial.slug);
        }
      } catch (error: any) {
        showError(error?.message || "Failed to load legal documents");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadDocuments();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedDocument) return;
    setTitle(selectedDocument.title);
    setDescription(selectedDocument.description);
    if (editor && editor.getHTML() !== selectedDocument.contentHtml) {
      editor.commands.setContent(selectedDocument.contentHtml || "<p></p>");
    }
  }, [selectedDocument, editor]);

  const handleSave = async () => {
    if (!editor) return;

    try {
      setSaving(true);
      const updated = await saveLegalDocument(selectedSlug, {
        title,
        description,
        contentHtml: editor.getHTML(),
      });

      setDocuments((previous) => previous.map((document) => (document.slug === updated.slug ? updated : document)));
      showSuccess(`${updated.title} saved successfully.`);
    } catch (error: any) {
      showError(error?.message || "Failed to save legal document");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-cream-800/50">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading legal page manager...
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
        <h1 className="text-lg font-bold text-brand-900">Legal Pages</h1>
        <p className="mt-1 text-sm text-cream-800/70">Edit every footer legal page from one place.</p>
        <div className="mt-4 space-y-2">
          {documents.map((document) => (
            <button
              key={document.slug}
              type="button"
              onClick={() => setSelectedSlug(document.slug)}
              className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                selectedSlug === document.slug
                  ? "border-brand-500 bg-brand-50 text-brand-900"
                  : "border-cream-200 bg-white text-cream-800/80 hover:bg-cream-50"
              }`}
            >
              <div className="font-semibold">{document.title}</div>
              <div className="mt-1 text-xs text-cream-800/50">Updated {new Date(document.updatedAt).toLocaleString()}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 border-b border-cream-200 pb-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">{LEGAL_DOCUMENT_CONFIG[selectedSlug].title}</h2>
            <p className="text-sm text-cream-800/70">Rich-text editor for public legal content.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={LEGAL_DOCUMENT_CONFIG[selectedSlug].href}
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

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-cream-800/80">Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-cream-800/80">Description</label>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="w-full rounded-lg border border-cream-200 px-3 py-2 text-sm text-brand-900 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-cream-800/80">Content</label>
            <div className="flex flex-wrap gap-2 rounded-t-xl border border-cream-200 bg-cream-50 p-2">
              <ToolbarButton label="H2" onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} active={!!editor?.isActive("heading", { level: 2 })} icon={<Heading2 className="h-4 w-4" />} />
              <ToolbarButton label="H3" onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()} active={!!editor?.isActive("heading", { level: 3 })} icon={<Heading3 className="h-4 w-4" />} />
              <ToolbarButton label="Bold" onClick={() => editor?.chain().focus().toggleBold().run()} active={!!editor?.isActive("bold")} icon={<Bold className="h-4 w-4" />} />
              <ToolbarButton label="Italic" onClick={() => editor?.chain().focus().toggleItalic().run()} active={!!editor?.isActive("italic")} icon={<Italic className="h-4 w-4" />} />
              <ToolbarButton label="Bullets" onClick={() => editor?.chain().focus().toggleBulletList().run()} active={!!editor?.isActive("bulletList")} icon={<List className="h-4 w-4" />} />
              <ToolbarButton label="Numbered" onClick={() => editor?.chain().focus().toggleOrderedList().run()} active={!!editor?.isActive("orderedList")} icon={<ListOrdered className="h-4 w-4" />} />
              <ToolbarButton label="Undo" onClick={() => editor?.chain().focus().undo().run()} icon={<Undo2 className="h-4 w-4" />} />
              <ToolbarButton label="Redo" onClick={() => editor?.chain().focus().redo().run()} icon={<Redo2 className="h-4 w-4" />} />
              <div className="ml-auto">
                <ColorPickerButton editor={editor ?? null} />
              </div>
            </div>
            <EditorContent editor={editor} />
          </div>
        </div>
      </section>
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active,
  icon,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
        active ? "bg-brand-500 text-white" : "bg-white text-cream-800/80 hover:bg-cream-100"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

const PRESET_COLORS = [
  "#1a1a2e", "#e63946", "#e76f51", "#f4a261", "#2a9d8f",
  "#264653", "#457b9d", "#6c63ff", "#8338ec", "#3a86ff",
];

function ColorPickerButton({ editor }: { editor: import("@tiptap/react").Editor | null }) {
  const [open, setOpen] = useState(false);
  const [hex, setHex] = useState("#e63946");
  const ref = useRef<HTMLDivElement>(null);

  const currentColor = (editor?.getAttributes("textStyle")?.color as string | undefined) ?? null;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const applyColor = (color: string) => {
    setHex(color);
    editor?.chain().focus().setColor(color).run();
  };

  const removeColor = () => {
    editor?.chain().focus().unsetColor().run();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        title="Text color"
        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          open ? "bg-brand-500 text-white" : "bg-white text-cream-800/80 hover:bg-cream-100"
        }`}
      >
        <ALargeSmall className="h-4 w-4" />
        <span
          className="h-3 w-3 rounded-sm border border-cream-200"
          style={{ background: currentColor ?? hex }}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-cream-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Text Color</span>
            <button type="button" onClick={() => setOpen(false)} className="text-cream-800/40 hover:text-cream-800/70">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Hex input + native color picker */}
          <div className="mb-3 flex items-center gap-2">
            <input
              type="color"
              value={hex}
              onChange={(e) => applyColor(e.target.value)}
              className="h-9 w-10 cursor-pointer rounded-md border border-cream-200 bg-white p-0.5"
              title="Pick a color"
            />
            <input
              type="text"
              value={hex}
              maxLength={7}
              onChange={(e) => {
                const v = e.target.value;
                setHex(v);
                if (/^#[0-9a-fA-F]{6}$/.test(v)) applyColor(v);
              }}
              placeholder="#000000"
              className="flex-1 rounded-lg border border-cream-200 px-3 py-1.5 font-mono text-sm text-brand-900 outline-none focus:border-brand-500"
            />
            <button
              type="button"
              onClick={removeColor}
              title="Remove color"
              className="rounded-md border border-cream-200 px-2 py-1.5 text-xs text-cream-800/50 hover:bg-cream-50"
            >
              Clear
            </button>
          </div>

          {/* Preset swatches */}
          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => applyColor(color)}
                title={color}
                className={`h-8 w-full rounded-md border-2 transition-transform hover:scale-110 ${
                  currentColor === color ? "border-brand-500 ring-2 ring-brand-100" : "border-transparent"
                }`}
                style={{ background: color }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
