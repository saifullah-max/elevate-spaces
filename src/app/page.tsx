"use client";

import Navbar from "@/components/navbar";
<<<<<<< HEAD
import {
  Sparkles,
  Monitor,
  Save,
  Settings,
  UploadCloud,
  ChevronDown,
  Download,
  Share2,
  MoveHorizontal,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import React, { useState } from "react";

export default function Home() {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number) => {
    const rect = document
      .getElementById("slider-container")
      ?.getBoundingClientRect();
    if (!rect) return;

    const x = clientX - rect.left;
    const width = rect.width;
    const percentage = Math.max(0, Math.min(100, (x / width) * 100));
    setSliderPosition(percentage);
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  };

  const handleDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    handleMove(clientX);
  };

  const handleEnd = () => {
    setIsDragging(false);
  };

  // Add global listeners when dragging
  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleDrag as any);
      window.addEventListener("mouseup", handleEnd);
      window.addEventListener("touchmove", handleDrag as any);
      window.addEventListener("touchend", handleEnd);
      return () => {
        window.removeEventListener("mousemove", handleDrag as any);
        window.removeEventListener("mouseup", handleEnd);
        window.removeEventListener("touchmove", handleDrag as any);
        window.removeEventListener("touchend", handleEnd);
      };
    }
  }, [isDragging]);

=======
import Footer from "@/components/footer";
import Demo from "@/components/demo";
import Services from "@/components/services";
import Pricing from "@/components/pricing";

export default function Home() {
>>>>>>> temp-merge-branch
  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

<<<<<<< HEAD
      {/* Added space below navbar */}
      <div className="pt-32 pb-12">
        <div className="text-center max-w-3xl mx-auto mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6 border border-indigo-100 animate-slide-down">
            <div className="flex items-center justify-center w-4 h-4 rounded-full">
              <Sparkles className="w-4 h-4" />
            </div>
            <span>For Sales &amp; Rentals</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight mb-6 animate-slide-up">
            Don't Just List a Property. <br />
            <span className="text-indigo-600 px-2 rounded-lg">
              Showcase Potential.
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-8 animate-fade-in delay-300">
            AI Staging, Virtual Renovation &amp; Furnishing for modern real
            estate.
          </p>
        </div>

        <div className="mt-8 max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200 animate-fade-in delay-500">
          {/* Header */}
          <div className="bg-slate-900 p-4 text-white flex justify-between items-center px-6">
            <span className="font-bold flex items-center gap-2">
              <Monitor className="w-4 h-4" />
              <span id="workspace-title">Instant AI Staging Demo</span>
            </span>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="hidden text-emerald-400 border-emerald-500/50 hover:text-white"
              >
                <Save className="w-3 h-3 mr-1" />
                Save Project
              </Button>

              <button
                className="text-slate-400 hover:text-white"
                title="Configuration"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3">
            {/* Controls */}
            <div className="p-6 border-r border-slate-200 bg-slate-50 flex flex-col gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  1. Upload Photo (Single)
                </label>

                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center cursor-pointer hover:border-indigo-500 bg-white transition-colors">
                  <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                  <span className="text-xs text-slate-600 font-medium">
                    Click to Upload
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Single JPG/PNG
                  </span>
                  <input type="file" className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  2. Staging Style
                </label>

                <div className="relative mb-3">
                  <select className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none">
                    <option>Modern Minimalist</option>
                    <option>Scandinavian</option>
                    <option>Industrial</option>
                    <option>Mid-century Modern</option>
                    <option>Modern Farmhouse</option>
                    <option>Coastal / Beach</option>
                    <option className="text-red-600 font-bold">
                      No Furniture (Empty)
                    </option>
                  </select>

                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                  Refine (Optional)
                </label>

                <input
                  type="text"
                  placeholder="e.g. kid friendly, bright colors"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm mb-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                />

                <Button className="w-full text-xs font-bold">
                  Update Preview
                </Button>
              </div>

              <div
                id="workspace-actions"
                className="p-4 bg-slate-100 rounded-lg text-center space-y-2"
              >
                <p className="text-xs text-slate-500 mb-2">Preview Mode</p>

                <button
                  disabled
                  className="w-full py-2 bg-slate-200 text-slate-400 text-xs font-bold rounded cursor-not-allowed"
                >
                  Select a Package Below
                </button>
              </div>
            </div>

            {/* Canvas - Before/After Slider */}
            <div
              id="slider-container"
              className="lg:col-span-2 relative h-96 md:h-125 lg:h-full min-h-96 bg-slate-100 overflow-hidden cursor-ew-resize select-none"
              onMouseDown={handleStart}
              onTouchStart={handleStart}
            >
              {/* BEFORE Image (Empty) - Always full, on the bottom layer */}
              <div className="absolute inset-0">
                <img
                  src="https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1000&auto=format&fit=crop"
                  alt="Empty room before staging"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* AFTER Image (Staged) - Clipped to the right of the slider */}
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img
                  src="https://media.houseandgarden.co.uk/photos/67dc464c0f2847aedf2da20b/16:9/w_2580,c_limit/Shot05117_RT-production_digital.jpg" // Beautifully staged modern living room
                  alt="Staged living room"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Slider Line + Handle */}
              <div
                className="absolute inset-y-0 w-1 bg-white shadow-2xl pointer-events-none"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-indigo-600 pointer-events-none">
                  <MoveHorizontal className="w-5 h-5 text-indigo-600" />
                </div>
              </div>

              {/* Top Right Actions (unchanged) */}
              <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button className="bg-white/90 hover:bg-white p-2 rounded-lg border border-slate-200 shadow-md transition">
                  <Download className="w-4 h-4 text-slate-700 hover:text-indigo-600" />
                </button>
                <button className="bg-white/90 hover:bg-white p-2 rounded-lg border border-slate-200 shadow-md transition">
                  <Share2 className="w-4 h-4 text-slate-700 hover:text-indigo-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Our Expertise Section - Matches the design perfectly */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Our Expertise
          </h2>
          <p className="text-xl text-slate-600">From Listing to Living</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Large Hero Image */}
          <div className="animate-fade-in">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80"
                alt="Beautifully staged modern living room"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg">
                <p className="text-sm text-slate-600 font-medium">
                  <span className="text-slate-400">©</span> High-Quality
                  Professional Photos Required
                </p>
              </div>
            </div>
          </div>

          <div className="text-left space-y-6">
            <h4 className="text-2xl font-bold text-slate-900">
              The Visual Advantage
            </h4>
            <div className="flex gap-4">
              <div className="bg-indigo-50 p-3 rounded h-fit text-indigo-600">
                <Sparkles className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h5 className="font-bold">Empty or Furnished</h5>
                <p className="text-slate-600 text-sm">
                  We don't just fill empty rooms. We can declutter and virtually
                  renovate existing furnished spaces to modernize the look.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-indigo-50 p-3 rounded h-fit text-indigo-600">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h5 className="font-bold">Rentals &amp; Sales</h5>
                <p className="text-slate-600 text-sm">
                  Whether you are selling a luxury home or looking for long-term
                  tenants, visual presentation drives higher prices.
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-red-50 p-3 rounded h-fit text-red-600">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h5 className="font-bold">Quality Input Matters</h5>
                <p className="text-slate-600 text-sm">
                  Garbage in, garbage out. We require high-resolution
                  professional photography.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Simple Tailwind Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s ease-out forwards;
        }
        .animate-slide-down {
          animation: slideDown 0.6s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }
        .delay-300 {
          animation-delay: 0.3s;
        }
        .delay-500 {
          animation-delay: 0.5s;
        }
      `}</style>
=======
      <Demo />

      <Services />

      <Pricing />

      <Footer />
>>>>>>> temp-merge-branch
    </div>
  );
}
