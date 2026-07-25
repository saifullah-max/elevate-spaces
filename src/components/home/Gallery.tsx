"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Download, MoveHorizontal, X } from "lucide-react";
import type { RoomType, StagingStyle } from "@/lib/errors";
import { getDemoComparisonImageUrl } from "@/components/data/demoImagePaths";
import { getAuthFromStorage, AUTH_CHANGED_EVENT } from "@/lib/auth.storage";
import AuthGateModal from "@/components/AuthGateModal";

type FilterKey = "all" | "living" | "bedroom" | "kitchen" | "dining" | "office" | "outdoor";

interface Pair {
  key: string;
  room: FilterKey;
  title: string;
  styleLabel: string;
  before: string;
  after: string;
}

const INTERIOR_ROOMS: {
  key: Exclude<FilterKey, "all" | "outdoor">;
  roomType: RoomType;
  title: string;
}[] = [
  { key: "living", roomType: "living-room", title: "Living room" },
  { key: "bedroom", roomType: "bedroom", title: "Master bedroom" },
  { key: "kitchen", roomType: "kitchen", title: "Kitchen refresh" },
  { key: "dining", roomType: "dining-room", title: "Formal dining" },
  { key: "office", roomType: "office", title: "Home office" },
];

const STYLES: { value: StagingStyle; label: string }[] = [
  { value: "modern", label: "Modern" },
  { value: "contemporary", label: "Contemporary" },
  { value: "minimalist", label: "Minimalist" },
  { value: "scandinavian", label: "Scandinavian" },
  { value: "industrial", label: "Industrial" },
  { value: "traditional", label: "Traditional" },
  { value: "transitional", label: "Transitional" },
  { value: "farmhouse", label: "Farmhouse" },
  { value: "coastal", label: "Coastal" },
  { value: "bohemian", label: "Bohemian" },
  { value: "mid-century", label: "Mid-Century" },
  { value: "luxury", label: "Luxury" },
];

const OUTDOOR_SCENES: { key: string; title: string; scene: RoomType }[] = [
  { key: "outdoor-outdoor", title: "Outdoor patio", scene: "outdoor" },
  { key: "outdoor-backyard", title: "Backyard", scene: "other" as RoomType },
  { key: "outdoor-garage", title: "Garage", scene: "garage" as RoomType },
];

function buildPairs(): Pair[] {
  const pairs: Pair[] = [];
  for (const room of INTERIOR_ROOMS) {
    for (const style of STYLES) {
      pairs.push({
        key: `${room.key}-${style.value}`,
        room: room.key,
        title: `${room.title} · ${style.label}`,
        styleLabel: style.label,
        before: getDemoComparisonImageUrl({
          areaType: "interior",
          roomType: room.roomType,
          stagingStyle: style.value,
          before: true,
        }),
        after: getDemoComparisonImageUrl({
          areaType: "interior",
          roomType: room.roomType,
          stagingStyle: style.value,
          before: false,
        }),
      });
    }
  }
  for (const scene of OUTDOOR_SCENES) {
    pairs.push({
      key: scene.key,
      room: "outdoor",
      title: scene.title,
      styleLabel: "Exterior",
      before: getDemoComparisonImageUrl({
        areaType: "exterior",
        exteriorType: scene.scene,
        before: true,
      }),
      after: getDemoComparisonImageUrl({
        areaType: "exterior",
        exteriorType: scene.scene,
        before: false,
      }),
    });
  }
  return pairs;
}

const ALL_PAIRS = buildPairs();

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All rooms" },
  { key: "living", label: "Living room" },
  { key: "bedroom", label: "Bedroom" },
  { key: "kitchen", label: "Kitchen" },
  { key: "dining", label: "Dining" },
  { key: "office", label: "Office" },
  { key: "outdoor", label: "Outdoor" },
];

const PAGE_SIZE = 6;

export default function Gallery() {
  const [active, setActive] = useState<FilterKey>("all");
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZE);
  const [lightbox, setLightbox] = useState<Pair | null>(null);
  const [authGateOpen, setAuthGateOpen] = useState(false);
  const [pendingDownload, setPendingDownload] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Keep local login state in sync with the auth storage changes so the
    // Download button can react to a fresh sign-in without a page refresh.
    const noop = () => {};
    window.addEventListener(AUTH_CHANGED_EVENT, noop);
    return () => window.removeEventListener(AUTH_CHANGED_EVENT, noop);
  }, []);

  const filtered = useMemo(
    () => (active === "all" ? ALL_PAIRS : ALL_PAIRS.filter((p) => p.room === active)),
    [active]
  );

  const visible = useMemo(() => filtered.slice(0, pageSize), [filtered, pageSize]);
  const hasMore = pageSize < filtered.length;
  const nextBatch = Math.min(PAGE_SIZE, filtered.length - pageSize);

  const changeFilter = (key: FilterKey) => {
    setActive(key);
    setPageSize(PAGE_SIZE);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 py-14 md:py-20">
      <div className="text-center max-w-xl mx-auto mb-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-brand-900">
          Real results
        </h2>
        <p className="text-cream-800/60 text-sm md:text-base mt-2">
          See what our AI staging can do. Click any card for the full before/after comparison.
        </p>
        <p className="text-[11px] text-cream-800/40 mt-1.5">
          Example transformations, not tied to real listings or addresses
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {FILTERS.map((f) => {
          const isActive = f.key === active;
          return (
            <button
              key={f.key}
              onClick={() => changeFilter(f.key)}
              className={
                "px-4 py-1.5 rounded-full text-xs font-semibold transition-all " +
                (isActive
                  ? "bg-brand-500 text-white"
                  : "bg-white border border-cream-200 text-cream-800/70 hover:border-brand-500/50 hover:text-brand-500")
              }
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {visible.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setLightbox(item)}
            className="bg-white border border-cream-200 rounded-2xl overflow-hidden group cursor-pointer text-left"
          >
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={item.after}
                alt={item.title}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute top-3 left-3 bg-brand-900/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
                {item.styleLabel}
              </span>
              <span className="absolute bottom-3 right-3 bg-white/90 text-brand-500 text-[10px] font-semibold px-2.5 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                Download HD
              </span>
            </div>
            <p className="text-xs font-semibold text-brand-900 px-4 py-3">{item.title}</p>
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="text-center mt-8">
          <button
            onClick={() => setPageSize((n) => n + PAGE_SIZE)}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-700"
          >
            View {nextBatch} more <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <p className="text-[11px] text-cream-800/40 mt-1">
            Showing {visible.length} of {filtered.length}
          </p>
        </div>
      )}

      {lightbox && (
        <GalleryLightbox
          item={lightbox}
          onClose={() => setLightbox(null)}
          onRequestDownload={(url) => {
            const isLoggedIn = Boolean(getAuthFromStorage()?.token);
            if (!isLoggedIn) {
              setPendingDownload(url);
              setAuthGateOpen(true);
            } else {
              triggerDownload(url);
            }
          }}
        />
      )}

      <AuthGateModal
        open={authGateOpen}
        onClose={() => setAuthGateOpen(false)}
        onSuccess={() => {
          if (pendingDownload) triggerDownload(pendingDownload);
          setPendingDownload(null);
        }}
        initialView="signup"
      />
    </section>
  );
}

function triggerDownload(url: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = url.split("/").pop() || "download";
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function GalleryLightbox({
  item,
  onClose,
  onRequestDownload,
}: {
  item: Pair;
  onClose: () => void;
  onRequestDownload: (url: string) => void;
}) {
  const [pos, setPos] = useState(50);

  // Lock body scroll while the modal is open + close on Escape.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-brand-900/70 backdrop-blur-sm z-50 flex items-center justify-center px-4 py-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-200">
          <p className="font-semibold text-sm text-brand-900">{item.title}</p>
          <button
            onClick={onClose}
            className="text-cream-800/40 hover:text-brand-900"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-[16/10] bg-cream-100 overflow-hidden select-none">
          <img
            src={item.before}
            alt={item.title + " (before)"}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
          <div className="absolute top-0 left-0 w-1/2 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
          <span className="absolute top-3 left-3 bg-brand-900/70 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
            Before
          </span>

          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
          >
            <img
              src={item.after}
              alt={item.title + " (after)"}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute top-0 right-0 w-full h-16 bg-gradient-to-b from-black/40 to-transparent" />
            <span className="absolute top-3 right-3 bg-brand-500/90 backdrop-blur-md text-white text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-md">
              After Elevated
            </span>
          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
            style={{ left: `${pos}%` }}
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-lg">
              <MoveHorizontal className="w-3 h-3 text-brand-500" />
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            value={pos}
            onChange={(e) => setPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
            aria-label="Before/After slider"
          />
        </div>

        <div className="px-6 py-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-cream-800/50">
            Example transformation, not tied to a real listing or address
          </p>
          <button
            type="button"
            onClick={() => onRequestDownload(item.after)}
            className="shrink-0 bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" /> Download HD
          </button>
        </div>
      </div>
    </div>
  );
}
