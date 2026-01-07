'use client';

import { useState } from 'react';
import {
  Camera,
  User,
  MapPin,
  Calendar,
  Sparkles,
  Star,
  Clock,
  Check,
  ChevronRight,
  ArrowLeft,
  Phone,
  MessageSquare,
  Image as ImageIcon,
  ShieldCheck,
  CreditCard,
  ChevronDown,
} from 'lucide-react';

// Types
type PlatformProgram = {
  id: string;
  platform: string;
  program: string;
  tag: string;
  deliverables: string[];
};

type Package = {
  programId: string;
  price: number;
  extras: string;
};

type Photographer = {
  id: number;
  name: string;
  location: string;
  rating: number;
  reviews: number;
  responseTime: string;
  priceRange: [number, number];
  image: string;
  bio: string;
  portfolio: string[];
  packages: Package[];
};

type View = 'search' | 'detail' | 'checkout' | 'success';

// Data
const PLATFORM_PROGRAMS: PlatformProgram[] = [
  {
    id: 'z1',
    platform: 'Zillow',
    program: 'Zillow Showcase',
    tag: '3D Tour + Interactive Floor Plan (Zillow 3D Home app)',
    deliverables: ['3D Home Tour', 'Interactive Floor Plan'],
  },
  {
    id: 'z2',
    platform: 'Zillow',
    program: 'Zillow 3D Home',
    tag: '3D Tours',
    deliverables: ['3D Tour'],
  },
  {
    id: 'r1',
    platform: 'Redfin',
    program: '3D Walkthrough',
    tag: 'Matterport 3D Model + Interactive Floor Plan',
    deliverables: ['Matterport / 3D Walkthrough'],
  },
  {
    id: 'm1',
    platform: 'MLS',
    program: 'Standard HDR',
    tag: 'HDR Photos',
    deliverables: ['25 HDR Photos'],
  },
];

const PHOTOGRAPHERS: Photographer[] = [
  {
    id: 1,
    name: 'Caleb Vance',
    location: 'Miami, FL',
    rating: 4.9,
    reviews: 312,
    responseTime: '15m',
    priceRange: [150, 450],
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Specializing in luxury waterfront properties. I provide ultra-fast turnaround for high-volume agents.',
    portfolio: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1600566753190-17f0bb2a6c3e?auto=format&fit=crop&q=80&w=400',
    ],
    packages: [
      { programId: 'z1', price: 399, extras: 'Drone photos included' },
      { programId: 'r1', price: 250, extras: '24h delivery' },
      { programId: 'm1', price: 150, extras: 'Next day delivery' },
    ],
  },
  {
    id: 2,
    name: 'Sarah Jenkins',
    location: 'Miami, FL',
    rating: 5.0,
    reviews: 88,
    responseTime: '5m',
    priceRange: [200, 600],
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Architecture-first approach. I work primarily with Zillow Showcase requirements to ensure compliance.',
    portfolio: [
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=400',
    ],
    packages: [
      { programId: 'z1', price: 549, extras: 'Twilight photos included' },
      { programId: 'r1', price: 300, extras: 'Matterport Pro 2 Scans' },
    ],
  },
  {
    id: 3,
    name: 'Marco Rossi',
    location: 'Los Angeles, CA',
    rating: 4.7,
    reviews: 156,
    responseTime: '45m',
    priceRange: [120, 350],
    image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop',
    bio: 'Affordable, reliable, and consistent. Best choice for suburban residential listings.',
    portfolio: [],
    packages: [{ programId: 'm1', price: 120, extras: 'Same-day delivery' }],
  },
];

export default function LensProp() {
  const [view, setView] = useState<View>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPro, setSelectedPro] = useState<Photographer | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformProgram | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [propertyAddress, setPropertyAddress] = useState('');

  const filteredPhotographers = PHOTOGRAPHERS.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleBackToSearch = () => {
    setSelectedPro(null);
    setSelectedPlatform(null);
    setSelectedPackage(null);
    setPropertyAddress('');
    setView('search');
  };

  const openDetail = (pro: Photographer) => {
    setSelectedPro(pro);
    setSelectedPlatform(null);
    setSelectedPackage(null);
    setView('detail');
  };

  const selectPlatform = (platform: PlatformProgram) => {
    setSelectedPlatform(platform);
    setSelectedPackage(null);
  };

  const selectPackageAndCheckout = (pkg: Package) => {
    setSelectedPackage(pkg);
    setView('checkout');
  };

  const confirmBooking = () => {
    setView('success');
  };

  // Photographer Card Component
  const PhotographerCard = ({ pro }: { pro: Photographer }) => {
    const tags = new Set<string>();
    pro.packages.forEach((pkg) => {
      const prog = PLATFORM_PROGRAMS.find((p) => p.id === pkg.programId);
      if (prog?.tag) tags.add(prog.tag);
      if (pkg.extras.toLowerCase().includes('drone')) tags.add('Drone / Aerial');
    });

    return (
      <div
        onClick={() => openDetail(pro)}
        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:border-blue-300 transition-all flex flex-col md:flex-row group min-h-[16rem] cursor-pointer"
      >
        <div className="md:w-72 h-48 md:h-auto relative overflow-hidden shrink-0">
          <img
            src={pro.image}
            alt={pro.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <button className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur rounded-full hover:bg-white text-slate-700">
            <User className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-black text-[#006ce4] hover:underline">{pro.name}</h3>
              <div className="flex items-center gap-1 bg-[#003580] text-white px-2 py-1 rounded text-sm font-bold">
                {pro.rating}
                <Star className="w-3 h-3 fill-[#ffb700] text-[#ffb700]" />
              </div>
            </div>

            <p className="text-slate-500 text-sm font-bold flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-red-500" /> {pro.location}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {Array.from(tags).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-bold uppercase tracking-tight bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200"
                >
                  {tag}
                </span>
              ))}
            </div>

            <p className="text-sm text-slate-600 mt-4 line-clamp-2 italic">"{pro.bio}"</p>
          </div>

          <div className="flex justify-between items-end pt-4 border-t border-slate-50 mt-4">
            <div className="text-xs text-slate-400 font-medium">
              <Clock className="w-3 h-3 inline text-slate-400 mr-1" /> Responds in {pro.responseTime}
              <br />
              <Check className="w-3 h-3 inline text-green-600 mr-1" /> {pro.reviews} verified reviews
            </div>

            <div className="text-right">
              <span className="block text-xs text-slate-500 font-bold uppercase mb-1">Price Range</span>
              <span className="text-2xl font-black text-slate-900">
                ${pro.priceRange[0]} – ${pro.priceRange[1]}
              </span>
              <button className="bg-[#006ce4] text-white px-6 py-2 rounded-lg font-bold text-sm mt-3 flex items-center gap-2 ml-auto">
                See Availability <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Detail View Component
  const DetailView = () => {
    if (!selectedPro) return null;

    const availablePackages = selectedPlatform
      ? selectedPro.packages.filter((p) => p.programId === selectedPlatform.id)
      : [];

    return (
      <section className="max-w-6xl mx-auto space-y-8 animate-in slide-in-from-right duration-300">
        <button
          onClick={handleBackToSearch}
          className="text-[#006ce4] font-bold flex items-center gap-1 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to results
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Header */}
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8">
              <img
                src={selectedPro.image}
                alt={selectedPro.name}
                className="w-40 h-40 rounded-2xl object-cover ring-8 ring-slate-50 shadow-lg"
              />
              <div className="flex-1">
                <div className="flex justify-between">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900">{selectedPro.name}</h2>
                    <p className="text-sm font-medium text-slate-500 mt-1">
                      Typically responds in {selectedPro.responseTime}
                    </p>
                  </div>
                  <div className="bg-[#003580] text-white px-3 py-1.5 rounded-lg flex items-center gap-2 h-fit">
                    <span className="text-xl font-black">{selectedPro.rating}</span>
                    <div className="text-[10px] leading-tight font-bold">
                      Wonderful<br />
                      <span>{selectedPro.reviews}</span> reviews
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 font-bold mt-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" />
                  <span>{selectedPro.location}</span>
                </p>

                <div className="flex gap-4 mt-6">
                  <a
                    href="tel:+15555555555"
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#006ce4] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700"
                  >
                    <Phone className="w-4 h-4" /> Tap to Call
                  </a>
                  <button className="flex-1 md:flex-none px-6 py-3 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-slate-700 flex items-center justify-center gap-2">
                    <MessageSquare className="w-5 h-5" /> Chat with Pro
                  </button>
                </div>
              </div>
            </div>

            {/* Portfolio */}
            <div>
              <h3 className="text-xl font-black mb-4 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" /> Portfolio Highlights
              </h3>
              {selectedPro.portfolio.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedPro.portfolio.map((src, i) => (
                    <div key={i} className="aspect-video bg-slate-100 rounded-xl overflow-hidden group">
                      <img
                        src={src}
                        alt="Portfolio"
                        className="w-full h-full object-cover transition-transform group-hover:scale-110"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-12 text-center text-slate-400 font-medium bg-slate-50 rounded-2xl">
                  Portfolio coming soon...
                </p>
              )}
            </div>
          </div>

          {/* Sticky Booking Widget */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl border-2 border-blue-600 shadow-2xl sticky top-24">
              <h3 className="font-black text-xl mb-4">Availability & Pricing</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                    1. Select Platform
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {PLATFORM_PROGRAMS.map((prog) => {
                      const isSelected = selectedPlatform?.id === prog.id;
                      return (
                        <button
                          key={prog.id}
                          onClick={() => selectPlatform(prog)}
                          className={`text-left p-3 rounded-xl border-2 transition-all ${
                            isSelected
                              ? 'border-[#006ce4] bg-blue-50'
                              : 'border-slate-100 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm">{prog.program}</span>
                            {isSelected && <Check className="w-4 h-4 text-[#006ce4]" />}
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Mapped for {prog.platform}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">
                    2. Available Package
                  </label>
                  <div className="space-y-3">
                    {selectedPlatform && availablePackages.length > 0 ? (
                      availablePackages.map((pkg, i) => {
                        const prog = PLATFORM_PROGRAMS.find((p) => p.id === pkg.programId)!;
                        return (
                          <div key={i} className="bg-slate-900 rounded-2xl p-5 text-white">
                            <div className="flex justify-between items-center mb-4">
                              <span className="text-2xl font-black">${pkg.price}</span>
                              <span className="bg-[#006ce4] text-[10px] font-black px-2 py-1 rounded">
                                OFFICIAL PRICE
                              </span>
                            </div>
                            <ul className="space-y-2 mb-6">
                              {prog.deliverables.map((d) => (
                                <li key={d} className="flex items-center gap-2 text-xs opacity-90 font-medium">
                                  <Check className="w-3 h-3 text-green-400" /> {d}
                                </li>
                              ))}
                              <li className="flex items-center gap-2 text-xs opacity-90 font-medium">
                                <Check className="w-3 h-3 text-green-400" /> {pkg.extras}
                              </li>
                            </ul>
                            <button
                              onClick={() => selectPackageAndCheckout(pkg)}
                              className="w-full bg-[#ffb700] text-[#003580] py-4 rounded-xl font-black text-lg hover:bg-[#e6a500] active:scale-95 transition-all"
                            >
                              Reserve Job
                            </button>
                          </div>
                        );
                      })
                    ) : selectedPlatform ? (
                      <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs font-bold text-amber-800">
                        {selectedPro.name} doesn't offer {selectedPlatform.program} yet. Try another platform.
                      </div>
                    ) : (
                      <div className="p-4 text-center text-slate-400">Select a platform to see packages</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-start gap-3 text-[11px] text-slate-400 font-medium pt-4 border-t border-slate-50">
                <ShieldCheck className="w-5 h-5 text-green-600 shrink-0" />
                <span>
                  LensProp Guarantee: Verified professionals, professional insurance included, and 24hr delivery.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Checkout View
  const CheckoutView = () => (
    <section className="max-w-xl mx-auto py-10 animate-in zoom-in-95 duration-300">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-[#003580] p-8 text-white">
          <h2 className="text-3xl font-black mb-1">Final Step</h2>
          <p className="opacity-70 font-medium">Review your listing details and schedule</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex gap-4 pb-6 border-b border-slate-100">
            <img
              src={selectedPro?.image}
              alt={selectedPro?.name}
              className="w-16 h-16 rounded-xl object-cover"
            />
            <div>
              <h3 className="font-black text-xl">{selectedPro?.name}</h3>
              <p className="text-sm font-bold text-[#006ce4]">{selectedPlatform?.program}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">Date</label>
              <div className="font-bold p-3 bg-slate-50 rounded-xl border border-slate-200">
                Jan 05, 2026
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black uppercase text-slate-400">Time</label>
              <div className="font-bold p-3 bg-slate-50 rounded-xl border border-slate-200">
                10:00 AM
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-slate-400">Property Address</label>
            <input
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              placeholder="Enter listing address..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-6 border-t border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-slate-500">Total Due Today</span>
              <span className="text-4xl font-black text-slate-900">
                $<span>{selectedPackage?.price || 0}</span>
              </span>
            </div>

            <button
              onClick={confirmBooking}
              className="w-full bg-[#006ce4] text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <CreditCard className="w-6 h-6" /> Confirm & Pay
            </button>

            <p className="text-center text-xs text-slate-400 mt-4 font-bold uppercase tracking-widest">
              Secure Stripe Payment
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // Success View
  const SuccessView = () => (
    <section className="max-w-lg mx-auto py-20 text-center space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
      <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
        <Check className="w-12 h-12" />
      </div>

      <h2 className="text-5xl font-black text-slate-900 tracking-tight">Booking Confirmed!</h2>
      <p className="text-xl text-slate-600 font-medium">
        We've sent the details for <strong>{propertyAddress || 'your listing'}</strong> to{' '}
        <span>{selectedPro?.name}</span>.
      </p>

      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 text-left">
        <h4 className="font-black text-blue-900 mb-2 uppercase text-xs tracking-widest">What's Next?</h4>
        <ul className="space-y-3 text-sm text-blue-800 font-bold">
          <li className="flex gap-2">
            <Check className="w-4 h-4" /> Photographer will confirm the time within 15 mins.
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4" /> You'll receive a prep-guide for your sellers.
          </li>
          <li className="flex gap-2">
            <Check className="w-4 h-4" /> Media delivery scheduled for Jan 06, 2026.
          </li>
        </ul>
      </div>

      <button
        onClick={handleBackToSearch}
        className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 transition-all shadow-xl"
      >
        Manage Bookings
      </button>
    </section>
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-[#003580] px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-8">
          <div onClick={handleBackToSearch} className="flex items-center gap-2 cursor-pointer">
            <div className="bg-white p-1.5 rounded-lg">
              <Camera className="text-[#003580] w-5 h-5" />
            </div>
            <span className="text-2xl font-black text-white tracking-tight">LensProp</span>
          </div>
          <button className="text-blue-100 font-bold hover:text-white transition-colors text-sm hidden md:block">
            Book a Pro
          </button>
        </div>

        <div className="flex gap-6 items-center">
          <button className="text-white font-bold text-sm hover:underline hidden md:block">
            List your service
          </button>
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <User className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-bold">Sign In</span>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Search View */}
        {view === 'search' && (
          <section className="space-y-8">
            <div className="bg-[#003580] -mx-4 -mt-8 px-8 pt-12 pb-20 text-white md:rounded-b-[40px]">
              <h1 className="text-3xl md:text-5xl font-black mb-4">Find your next shoot</h1>
              <p className="text-xl text-blue-100 max-w-2xl">
                Search deals on photography, 3D tours, and more for your property...
              </p>
            </div>

            <div className="bg-[#ffb700] p-1 rounded-xl shadow-2xl -mt-12 max-w-5xl mx-auto relative z-10 border-4 border-[#ffb700]">
              <div className="bg-white rounded-lg flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200">
                <div className="flex-1 flex items-center gap-3 p-4 group">
                  <MapPin className="text-slate-400 w-5 h-5" />
                  <input
                    placeholder="Where are you listing?"
                    className="w-full outline-none font-bold text-slate-700 placeholder:text-slate-400"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="md:w-64 flex items-center gap-3 p-4 bg-slate-50/50">
                  <Calendar className="text-slate-400 w-5 h-5" />
                  <span className="font-bold text-sm text-slate-600">Available Tomorrow</span>
                </div>
                <button className="bg-[#006ce4] text-white px-10 py-4 font-bold text-lg hover:bg-blue-700 transition-colors rounded-r-lg">
                  Search
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-4">
              {/* Sidebar (static for now) */}
              <div className="hidden lg:block space-y-6">
                <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-bold">AI Matchmaker</h3>
                  </div>
                  <textarea
                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white placeholder:text-white/50 outline-none focus:ring-2 focus:ring-white/30"
                    placeholder="Describe your property (e.g. 5M Luxury Waterfront)..."
                    rows={3}
                  />
                  <button className="w-full bg-white text-indigo-600 py-2.5 rounded-xl font-bold mt-4 text-sm">
                    Find Pro
                  </button>
                </div>
                {/* Static filters can be made interactive later */}
              </div>

              {/* Results */}
              <div className="lg:col-span-3 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h2 className="text-xl font-black">
                    {filteredPhotographers.length} properties found
                  </h2>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#006ce4]">
                    Sort by:
                    <span className="flex items-center cursor-pointer">
                      Best match <ChevronDown className="w-4 h-4" />
                    </span>
                  </div>
                </div>

                <div className="space-y-6">
                  {filteredPhotographers.map((pro) => (
                    <PhotographerCard key={pro.id} pro={pro} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Other Views */}
        {view === 'detail' && <DetailView />}
        {view === 'checkout' && <CheckoutView />}
        {view === 'success' && <SuccessView />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-6 mt-20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-8 opacity-60">
          <div>
            <span className="text-2xl font-black">LensProp</span>
            <p className="text-sm mt-2">© 2026 LensProp Marketplace. All rights reserved.</p>
          </div>
          <div className="flex gap-8 text-sm font-bold">
            <a href="#" className="hover:underline">Privacy</a>
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}