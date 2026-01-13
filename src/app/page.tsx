"use client";
import Navbar from "@/components/navbar";
import {
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";
import React, { useState } from "react";
import Demo from "@/components/demo";
import RecentUploads from "@/components/recent-uploads";
import Services from "@/components/services";
import Pricing from "@/components/pricing";
import Footer from "@/components/footer";

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

  return (
    <div className="bg-slate-100 min-h-screen">
      <Navbar />

      {/* Added space below navbar */}

      {/* Our Expertise Section - Matches the design perfectly */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white pt-32 pb-12">
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

      <Demo />
      <RecentUploads />

      <Services />

      <Pricing />

      <Footer />
    </div>
  );
}
