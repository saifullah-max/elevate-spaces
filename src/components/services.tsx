"use client";

import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function Services() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = (clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(pct);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    updatePosition(clientX);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      const clientX =
        "touches" in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      updatePosition(clientX);
    };
    const handleEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging]);

  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 bg-white">
      <div className="text-center mb-12">
        <h2 className="font-display text-4xl font-bold text-brand-900 mb-4 mt-8">
          Our Expertise
        </h2>
        <p className="text-xl text-cream-800/70">From Listing to Living</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-12 items-center">
        <div className="animate-fade-in">
          <div
            ref={containerRef}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            className="relative rounded-2xl overflow-hidden shadow-2xl select-none cursor-ew-resize aspect-[4/3]"
          >
            {/* AFTER — staged, full width, sits underneath */}
            <img
              src="/furnished-room.png"
              alt="AI staged living room"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              draggable={false}
            />

            {/* BEFORE — empty, clipped to slider position, sits on top */}
            <div
              className="absolute inset-0 h-full overflow-hidden pointer-events-none"
              style={{ width: `${sliderPosition}%` }}
            >
              <img
                src="/unfurnished-room.png"
                alt="Empty living room before staging"
                className="absolute inset-0 h-full max-w-none object-cover"
                style={{ width: containerRef.current?.offsetWidth || "100%" }}
                draggable={false}
              />
            </div>

            {/* Drag handle */}
            <div
              className="absolute top-0 h-full w-0.5 bg-white shadow-md pointer-events-none"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center text-brand-500 font-bold text-sm">
                ⇔
              </div>
            </div>

            {/* Corner tags */}
            <span className="absolute top-4 left-4 bg-brand-900/70 text-white text-xs font-semibold px-3 py-1 rounded-full">
              EMPTY
            </span>
            <span className="absolute top-4 right-4 bg-brand-500 text-white text-xs font-semibold px-3 py-1 rounded-full">
              AI STAGED
            </span>

            {/* Existing caption, kept as requested */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm text-cream-800/70 font-medium">
                <span className="text-cream-800/40">©</span> High-Quality
                Professional Photos Required
              </p>
            </div>
          </div>
        </div>
        <div className="text-left space-y-6">
          <h4 className="font-display text-2xl font-bold text-brand-900">
            The Visual Advantage
          </h4>
          <div className="flex gap-4">
            <div className="bg-brand-50 p-3 rounded h-fit text-brand-500">
              <Sparkles className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h5 className="font-bold text-brand-900">Empty or Furnished</h5>
              <p className="text-cream-800/70 text-sm">
                We don't just fill empty rooms. We can declutter and virtually
                renovate existing furnished spaces to modernize the look.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-brand-50 p-3 rounded h-fit text-brand-500">
              <TrendingUp className="w-6 h-6 text-brand-500" />
            </div>
            <div>
              <h5 className="font-bold text-brand-900">Rentals &amp; Sales</h5>
              <p className="text-cream-800/70 text-sm">
                Whether you are selling a luxury home or looking for long-term
                tenants, visual presentation drives higher prices.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-accent-500/10 p-3 rounded h-fit text-accent-600">
              <AlertTriangle className="w-6 h-6 text-accent-600" />
            </div>
            <div>
              <h5 className="font-bold text-brand-900">Quality Input Matters</h5>
              <p className="text-cream-800/70 text-sm">
                Garbage in, garbage out. We require high-resolution professional
                photography.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
