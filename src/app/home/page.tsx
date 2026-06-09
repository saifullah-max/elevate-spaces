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
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="bg-slate-100">
      <div className="text-center max-w-3xl mx-auto mb-12 ">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 text-indigo-700 text-sm font-semibold mb-6 border border-indigo-100">
          <div className="flex items-center justify-center w-4 h-4 rounded-full ">
            <Sparkles className="w-4 h-4" />
          </div>
          <span>For Sales &amp; Rentals</span>
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight  mb-6">
          Don't Just List a Property. <br />
          <span className="text-indigo-600 px-2 rounded-lg">
            Showcase Potential.
          </span>
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          AI Staging, Virtual Renovation &amp; Furnishing for modern real
          estate.
        </p>
      </div>

      <div className="mt-8 max-w-6xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
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
            {/* Upload */}
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

            {/* Style Select */}
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
  <p className="text-xs text-slate-500 mb-2">
    Preview Mode
  </p>

  <button
    disabled
    className="w-full py-2 bg-slate-200 text-slate-400 text-xs font-bold rounded cursor-not-allowed"
  >
    Select a Package Below
  </button>
</div>
            {/* yhn */}
          </div>

          

          {/* Canvas */}
          <div className="lg:col-span-2 relative [h-125] bg-slate-100 overflow-hidden group">
            {/* Top Right Actions */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button className="bg-white/90 hover:bg-white p-2 rounded-lg border border-slate-200">
                <Download className="w-4 h-4 text-slate-700 hover:text-indigo-600" />
              </button>

              <button className="bg-white/90 hover:bg-white p-2 rounded-lg border border-slate-200">
                <Share2 className="w-4 h-4 text-slate-700 hover:text-indigo-600" />
              </button>
            </div>

            {/* Slider Handle */}
            <div className="absolute inset-y-0 left-1/2 flex items-center z-20">
              <div className="w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-indigo-600">
                <MoveHorizontal className="w-4 h-4" />
              </div>
              
            </div>
            
          </div>
        </div>
      </div>

      <h1>sdff</h1>
    </div>
  );
}
