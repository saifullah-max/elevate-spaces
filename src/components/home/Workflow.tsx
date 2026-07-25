import { CloudUpload, Palette, WandSparkles } from "lucide-react";

const STEPS = [
  {
    icon: CloudUpload,
    step: "Step 1",
    title: "Upload your photos",
    desc: "Drop up to 15 real listing photos from a phone or camera, in one batch.",
  },
  {
    icon: Palette,
    step: "Step 2",
    title: "Choose room & style",
    desc: "Pick the room type and a staging style — Modern, Scandinavian, Coastal, and more.",
  },
  {
    icon: WandSparkles,
    step: "Step 3",
    title: "Get 3 staged concepts",
    desc: "Receive 3 photorealistic concepts per photo, MLS-ready HD, in about 60 seconds.",
  },
];

export default function Workflow() {
  return (
    <section className="bg-cream-50 border-y border-cream-200">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center max-w-lg mx-auto mb-12">
          <p className="text-brand-500 text-xs font-bold uppercase tracking-widest mb-3">
            The Seamless Pipeline
          </p>
          <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-brand-900">
            Stage any listing in 3 steps
          </h2>
          <p className="text-cream-800/60 text-sm md:text-base mt-3">
            Skip the staging truck and the calendar juggling. Upload real photos and let AI place the furniture for you.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {STEPS.map(({ icon: Icon, step, title, desc }) => (
            <div key={step} className="bg-white border border-cream-200 rounded-2xl p-7 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-100 text-brand-500 flex items-center justify-center mx-auto mb-5">
                <Icon className="w-5 h-5" />
              </div>
              <p className="text-brand-500 text-[10px] font-bold uppercase tracking-widest mb-1.5">
                {step}
              </p>
              <h3 className="font-bold text-base mb-2 text-brand-900">{title}</h3>
              <p className="text-xs text-cream-800/60 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
