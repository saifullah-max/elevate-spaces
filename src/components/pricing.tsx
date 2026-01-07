import {
  Bitcoin,
  Briefcase,
  CheckCircle,
  CheckCircle2,
  MousePointer2,
  PercentIcon,
  Sparkles,
} from "lucide-react";

export default function Pricing() {
  return (
    <section
      id="pricing"
      className="py-20 bg-slate-50 border-t border-slate-200"
    >
      <div className="max-w-360 mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-sm font-bold text-indigo-600 uppercase tracking-wide mb-2">
            Flexible Models
          </h2>
          <h3 className="text-3xl font-bold text-slate-900">
            Choose Your Partnership Style
          </h3>
          <p className="text-slate-600 mt-2">
            Solutions tailored for homeowners, landlords, and commercial
            businesses.
          </p>
        </div>

        {/* STAGING PLANS */}
        <div
          id="content-staging"
          className="grid md:grid-cols-2 xl:grid-cols-4 gap-6"
        >
          {/* 1. */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all cursor-pointer group">
            <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center text-blue-600 mb-4">
              <MousePointer2 className="w-6 h-6 text-blue-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              Do It Yourself – AI Staging
            </h4>
            <p className="text-slate-500 text-sm mb-4">
              Upload and edit your own photos using our AI tools.
            </p>
            <div className="mb-4">
              <span className="text-3xl font-extrabold text-slate-900">
                $19.99
              </span>{" "}
              <span className="text-slate-500">/ room</span>
            </div>
            <ul className="space-y-2 mb-8 text-sm text-slate-600 flex-1">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Up to 5
                revisions per room
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Immediate AI
                results
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" /> Self-service
                portal
              </li>
            </ul>
            <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
              <Bitcoin className="w-4 h-4 " />
              Crypto Accepted
            </div>
            <button className="w-full py-3 border-2 border-blue-600 text-blue-600 font-bold rounded-lg group-hover:bg-blue-50 transition-colors">
              Try Studio
            </button>
          </div>

          {/* 2. Professional (Clickable Card) */}
          <div className="bg-slate-900 rounded-2xl shadow-xl p-6 flex flex-col relative overflow-hidden transform xl:-translate-y-4 cursor-pointer group">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              24H DELIVERY
            </div>
            <div className="bg-white/10 w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 backdrop-blur-sm">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h4 className="text-xl font-bold text-white">
              Full Home Virtual Staging
            </h4>
            <p className="text-slate-400 text-sm mb-4">
              We virtually stage your entire home. You choose a style, upload
              your photos once, and we handle the rest.
            </p>
            <p className="text-indigo-300 text-xs mb-4">
              Optionally add Physical Furnishing (90% matches) for $39.99.
            </p>
            <div className="mb-1 text-slate-400 text-xs">Starts at</div>
            <div className="mb-4">
              <span className="text-4xl font-extrabold text-white">$99.99</span>{" "}
              <span className="text-slate-400">/ house</span>
            </div>
            <ul className="space-y-2 mb-8 text-sm text-slate-300 flex-1">
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                Done-for-you OR Self-service
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                Bulk Upload Supported
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <p>
                  {" "}
                  Optional <strong>Physical Furnishing</strong> add-on
                </p>
              </li>
              <li className="flex gap-2">
                <CheckCircle className="w-4 h-4 text-purple-500" />
                <p>
                  {" "}
                  <strong>90% product match</strong> on furnishings{" "}
                </p>
              </li>
            </ul>
            <div className="text-xs text-slate-400 mb-4 flex items-center gap-1">
              <Bitcoin className="w-4 h-4 " />
              Crypto Accepted
            </div>
            <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg group-hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* 3. Agent (Clickable Card) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all cursor-pointer group">
            <div className="absolute top-0 right-0 bg-purple-100 text-purple-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              24H DELIVERY
            </div>
            <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center text-purple-600 mb-4">
              <Briefcase className="w-6 h-6 text-purple-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-900 leading-tight">
              Agents &amp; Property Managers
            </h4>
            <p className="text-slate-500 text-sm mb-6 mt-1">
              High-volume pricing for brokerages, teams, and property managers.
            </p>
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-slate-900">
                Custom
              </span>{" "}
              <span className="text-slate-500">Quote</span>
            </div>
            <p className="text-xs text-slate-500 mb-4 font-medium">
              Based on annual listing/unit count.
            </p>
            <ul className="space-y-2 mb-8 text-sm text-slate-600 flex-1">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                Volume Discounts
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                Bulk Upload Tools
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                Contracts vary by agency
              </li>
            </ul>
            <div className="text-xs text-slate-500 mb-4 flex items-center gap-1">
              <Bitcoin className="w-4 h-4 " />
              Crypto Accepted
            </div>
            <button className="w-full py-3 border-2 border-purple-600 text-purple-600 font-bold rounded-lg group-hover:bg-purple-50 transition-colors">
              Get Agent Quote
            </button>
          </div>

          {/* 4. Pay-On-Success (Clickable Card) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-all cursor-pointer group">
            <div className="absolute top-0 right-0 bg-green-100 text-green-700 text-[10px] font-bold px-3 py-1 rounded-bl-lg">
              24H DELIVERY
            </div>
            <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center text-green-600 mb-4">
              <PercentIcon className="w-6 h-6 text-green-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-900">
              Pay-On-Success – Pay When the Deal Is Done
            </h4>
            <div className="mb-6 mt-4">
              <span className="text-3xl font-extrabold text-slate-900">$0</span>{" "}
              <span className="text-slate-500">upfront</span>
            </div>
            <ul className="space-y-2 mb-4 text-sm text-slate-600 flex-1">
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Fee paid at closing (for sales)
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Fee paid from first month’s rent (for rentals)
              </li>
              <li className="flex gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Contract required
              </li>
            </ul>
            <p className="text-[11px] text-slate-500 mt-4 leading-relaxed border-t pt-3">
              You only pay once the property is sold or rented, so your cash
              isn’t tied up upfront. If the property is withdrawn from the
              market or you decide not to sell or rent it after we’ve delivered
              the staging, the agreed fee still becomes payable under the
              contract.
            </p>
            <button className="w-full py-3 mt-4 border-2 border-green-600 text-green-700 font-bold rounded-lg group-hover:bg-green-50 transition-colors">
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
