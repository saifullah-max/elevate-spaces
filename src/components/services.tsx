import { AlertTriangle, Sparkles, TrendingUp } from "lucide-react";

export default function Services() {
  return (
    <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-slate-900 mb-4 mt-8">
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
              className="w-full h-full object-cover "
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
