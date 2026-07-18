"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Bolt, CloudUpload, Gift, MoveVertical, Shield, ShieldHalf, Sparkles, WandSparkles, Zap } from "lucide-react";
import { setPendingUploadFiles } from "@/lib/pendingUpload";

interface HeroProps {
  hasFreeDemoCredits: boolean;
  heroCreditCount: number | null;
}

const BEFORE_IMG = "/demo/interior/empty-living-room-mid-century.png";
const AFTER_IMG = "/demo/interior/living-room-mid-century.png";
export default function Hero({ hasFreeDemoCredits, heroCreditCount }: HeroProps) {
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const arr = Array.from(files).slice(0, 15);
    setPendingUploadFiles(arr);
    router.push("/studio");
  };

  const openPicker = () => fileInputRef.current?.click();

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const move = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  };

  useEffect(() => {
    if (!dragging) return;
    const mm = (e: MouseEvent | TouchEvent) => {
      const x = "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      move(x);
    };
    const up = () => setDragging(false);
    window.addEventListener("mousemove", mm);
    window.addEventListener("mouseup", up);
    window.addEventListener("touchmove", mm);
    window.addEventListener("touchend", up);
    return () => {
      window.removeEventListener("mousemove", mm);
      window.removeEventListener("mouseup", up);
      window.removeEventListener("touchmove", mm);
      window.removeEventListener("touchend", up);
    };
  }, [dragging]);

  const start = (e: React.MouseEvent | React.TouchEvent) => {
    setDragging(true);
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    move(x);
  };

  return (
    <section className="max-w-6xl mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-12 md:pb-20">
      <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left column */}
        <div className="lg:col-span-5 space-y-5">
          <span className="inline-flex items-center gap-1.5 bg-brand-100 text-brand-500 text-[10px] font-semibold uppercase tracking-widest px-3 py-1 rounded-full">
            <WandSparkles className="w-3 h-3" /> For real estate agents
          </span>

          <h1 className="font-display text-4xl md:text-5xl leading-[1.1] font-bold tracking-tight text-brand-900">
            {hasFreeDemoCredits ? (
              <>
                Turn empty rooms into staged homes in{" "}
                <span className="text-brand-500 italic font-semibold">60 seconds</span>
              </>
            ) : (
              <>
                See your listing transformed in under{" "}
                <span className="text-brand-500 italic font-semibold">60 seconds</span>
              </>
            )}
          </h1>

          <p className="text-cream-800/60 text-base md:text-lg leading-relaxed max-w-md">
            Upload up to 15 photos of a listing at once. Get 3 photorealistic staging concepts per room.
          </p>

          {/* Dropzone → picks files then navigates to /studio */}
          <div
            onClick={openPicker}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("bg-brand-100/60");
            }}
            onDragLeave={(e) => e.currentTarget.classList.remove("bg-brand-100/60")}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && openPicker()}
            className="w-full max-w-md block border-2 border-dashed border-brand-500/50 bg-brand-50 rounded-2xl p-5 hover:bg-brand-100/60 transition-colors cursor-pointer text-left"
          >
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-white shadow-sm mx-auto flex items-center justify-center mb-2">
                <CloudUpload className="w-5 h-5 text-brand-500" />
              </div>
              <p className="text-sm font-medium text-brand-900">Drag &amp; drop up to 15 photos</p>
              <p className="text-xs text-cream-800/50 mt-0.5">JPG or PNG · Opens the studio automatically</p>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <button
            onClick={() => router.push("/studio")}
            className="text-sm font-semibold text-brand-500 hover:text-brand-700 inline-flex items-center gap-1.5"
          >
            {hasFreeDemoCredits ? "Try for free now" : "or open the studio without uploading"}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="flex flex-wrap gap-2 max-w-md pt-2">
            <span className="inline-flex items-center gap-1.5 bg-white border border-cream-200 rounded-full px-3 py-1.5 text-xs font-medium text-cream-800/80">
              <Gift className="w-4 h-4 text-brand-500" /> 10 free credits
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-cream-200 rounded-full px-3 py-1.5 text-xs font-medium text-cream-800/80">
              <ShieldHalf className="w-4 h-4 text-brand-500" /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white border border-cream-200 rounded-full px-3 py-1.5 text-xs font-medium text-cream-800/80">
              <Zap className="w-4 h-4 text-brand-500" /> Results in ~60s
            </span>
          </div>

          {heroCreditCount !== null && (
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-4 py-1.5 text-sm font-semibold text-brand-500">
                <Sparkles className="h-4 w-4" />
                {heroCreditCount} free demo credit{heroCreditCount === 1 ? "" : "s"} remaining
              </span>
            </div>
          )}
        </div>

        {/* Right column: before/after slider */}
        <div className="lg:col-span-7">
          <div
            ref={containerRef}
            className="relative aspect-[16/11] bg-cream-100 rounded-3xl overflow-hidden shadow-lg border border-cream-200 select-none"
          >
            <img
              src={BEFORE_IMG}
              alt="Before"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />
            <div className="absolute top-0 left-0 w-1/2 h-20 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />
            <span className="absolute top-4 left-4 bg-brand-900/70 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
              Before
            </span>

            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
            >
              <img
                src={AFTER_IMG}
                alt="After"
                className="absolute inset-0 w-full h-full object-cover"
                draggable={false}
              />
              <div className="absolute top-0 right-0 w-full h-20 bg-gradient-to-b from-black/40 to-transparent" />
              <span className="absolute top-4 right-4 bg-brand-500/90 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md">
                After Elevated
              </span>
            </div>

            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white pointer-events-none"
              style={{ left: `${pos}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border-2 border-brand-500 flex items-center justify-center shadow-lg">
                <MoveVertical className="w-5 h-5 rotate-90 text-brand-500" />
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={100}
              value={pos}
              onChange={(e) => setPos(Number(e.target.value))}
              onMouseDown={start}
              onTouchStart={start}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10"
              aria-label="Before/After slider"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
