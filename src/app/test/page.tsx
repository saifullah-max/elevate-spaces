"use client";
import React, { useState } from 'react';
import { Check, X, Building, Camera, Users, Zap, Home } from 'lucide-react';
import { createCheckoutSession } from '@/services/payment.service';

const PricingPage = () => {
  const [purchaseFor, setPurchaseFor] = useState<'individual' | 'team'>('individual');
  const [teamId, setTeamId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCheckout = async (productKey: string, qty?: number) => {
    try {
      setErrorMessage(null);
      setLoadingKey(productKey);

      if (purchaseFor === 'team' && !teamId.trim()) {
        throw new Error('Team ID is required for team purchases');
      }

      const session = await createCheckoutSession({
        productKey,
        purchaseFor,
        teamId: purchaseFor === 'team' ? teamId.trim() : undefined,
        quantity: qty,
      });

      if (session?.url) {
        window.location.href = session.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Checkout failed');
    } finally {
      setLoadingKey(null);
    }
  };

  const isTeamCheckoutDisabled = purchaseFor === 'team' && !teamId.trim();
  return (
    <div className="min-h-screen bg-cream-50 py-16 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-350 mx-auto">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-blue-600 font-semibold tracking-wide uppercase text-sm mb-2">
            Pricing Plans
          </h2>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 mb-4">
            Professional Real Estate Media Solutions
          </h1>
          <p className="text-lg text-cream-800/70 max-w-2xl mx-auto">
            Choose the right plan for your workflow, from solo agents to large brokerages.
          </p>
          <div className="mt-8 inline-flex flex-col items-center gap-3 bg-white border border-cream-200 rounded-xl px-5 py-4 shadow-sm">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPurchaseFor('individual')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${purchaseFor === 'individual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-cream-800/80 border-cream-200'}`}
              >
                Buy for Individual
              </button>
              <button
                onClick={() => setPurchaseFor('team')}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border ${purchaseFor === 'team' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-cream-800/80 border-cream-200'}`}
              >
                Buy for Team
              </button>
            </div>
            {purchaseFor === 'team' && (
              <input
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                placeholder="Enter Team ID"
                className="w-64 px-3 py-2 rounded-lg border border-cream-200 text-sm"
              />
            )}
            {errorMessage && (
              <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
            )}
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4 xl:gap-6 items-start">
          
          {/* Card 1: Starter */}
          <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-4 xl:p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-brand-900">Starter</h3>
              <p className="text-sm text-cream-800/50 mt-2 h-10">Best for first time users and occasional projects</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-brand-900">$25</span>
              <span className="text-cream-800/50 ml-2">/ month</span>
            </div>
            <button
              onClick={() => startCheckout('starter')}
              disabled={isTeamCheckoutDisabled || loadingKey === 'starter'}
              className="w-full py-3 px-4 bg-white border-2 border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingKey === 'starter' ? 'Processing...' : 'Get Started'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">60 photos every month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">No long term commitment</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Access to ROI Calculator</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Support response within 24 hours</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Pro (Most Popular) */}
          <div className="relative bg-brand-900 rounded-2xl shadow-xl border border-brand-900 p-4 xl:p-6 flex flex-col h-full transform lg:scale-105 z-10">
            <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg uppercase tracking-wider">
              Most Popular
            </div>
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white">Pro</h3>
              <p className="text-sm text-cream-800/30 mt-2 h-10">For agents and freelancers</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-white">$59</span>
              <span className="text-cream-800/40 ml-2">/ month</span>
            </div>
            <button
              onClick={() => startCheckout('pro')}
              disabled={isTeamCheckoutDisabled || loadingKey === 'pro'}
              className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-8 shadow-lg shadow-blue-900/50 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingKey === 'pro' ? 'Processing...' : 'Get Started'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/30">160 photos every month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/30">Access to ROI Calculator</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/30">Support response within 12 hours</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/30">Designed for consistent monthly usage</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/30">Better value per photo than Starter</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-400 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/30">Ideal for active agents and solo creators</span>
              </li>
            </ul>
          </div>

          {/* Card 3: Team */}
          <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-4 xl:p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-brand-900">Team</h3>
              <p className="text-sm text-cream-800/50 mt-2 h-10">For small teams and agencies</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-brand-900">$119</span>
              <span className="text-cream-800/50 ml-2">/ month</span>
            </div>
            <button
              onClick={() => startCheckout('team')}
              disabled={isTeamCheckoutDisabled || loadingKey === 'team'}
              className="w-full py-3 px-4 bg-white border-2 border-cream-200 text-brand-900 font-semibold rounded-lg hover:border-cream-200 hover:bg-cream-50 transition-colors mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingKey === 'team' ? 'Processing...' : 'Get Team Plan'}
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">360 photos every month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Built for higher volume workflows</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Team access and shared usage</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Access to ROI Calculator</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Support response within 8 hours</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Easy photo sharing across projects</span>
              </li>
               <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Photo storage for up to one month</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Best for teams managing multiple listings</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Enterprise */}
          <div className="bg-white rounded-2xl shadow-sm border border-cream-200 p-4 xl:p-6 flex flex-col h-full hover:shadow-md transition-shadow duration-300">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-brand-900">Enterprise</h3>
              <p className="text-sm text-cream-800/50 mt-2 h-10">For large teams and custom needs</p>
            </div>
            <div className="mb-6 flex items-baseline">
              <span className="text-3xl font-bold text-brand-900">Custom</span>
            </div>
            <button className="w-full py-3 px-4 bg-white border-2 border-cream-200 text-brand-900 font-semibold rounded-lg hover:border-cream-200 hover:bg-cream-50 transition-colors mb-8">
              Contact Sales
            </button>
            <ul className="space-y-4 flex-1">
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">High volume monthly credits</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Access to ROI Calculator</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Easy photo sharing across projects</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Extended photo storage</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Priority support within 6 hours</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Custom onboarding and setup</span>
              </li>
              <li className="flex items-start">
                <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                <span className="text-sm text-cream-800/70">Best for brokerages and enterprise level usage</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Virtual Staging */}
          <div className="bg-white rounded-2xl shadow-sm border border-cream-200 flex flex-col h-full hover:shadow-md transition-shadow duration-300 overflow-hidden">
            <div className="p-4 xl:p-6 pb-4">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-brand-900 leading-tight">Full Home Virtual Staging</h3>
                <p className="text-sm text-cream-800/50 mt-2 h-10">For complete property presentation</p>
              </div>
              <div className="mb-6">
                <span className="text-4xl font-bold text-brand-900">$99.99</span>
                <span className="text-cream-800/50 ml-2">/ home</span>
              </div>
              <button
                onClick={() => startCheckout('virtual_staging')}
                disabled={isTeamCheckoutDisabled || loadingKey === 'virtual_staging'}
                className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors mb-8 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loadingKey === 'virtual_staging' ? 'Processing...' : 'Get Started'}
              </button>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                  <span className="text-sm text-cream-800/70">Virtual staging for entire home</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                  <span className="text-sm text-cream-800/70">One selected design style</span>
                </li>
                 <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                  <span className="text-sm text-cream-800/70">Images delivered within 24 hours</span>
                </li>
                <li className="flex items-start">
                  <Check className="w-5 h-5 text-blue-500 mr-3 shrink-0" />
                  <span className="text-sm text-cream-800/70">Best for vacant homes and marketing</span>
                </li>
              </ul>
            </div>

            {/* Add-on Section */}
            <div className="mt-auto bg-cream-50 p-4 xl:p-6 border-t border-cream-100">
               <div className="flex justify-between items-start mb-2">
                 <h4 className="font-semibold text-brand-900 text-sm">Physical Furnishing Add-On</h4>
                 <span className="text-blue-600 font-bold text-sm">$39.99</span>
               </div>
               <p className="text-xs text-cream-800/50 mb-3">Optional</p>
               <ul className="space-y-2">
                 <li className="flex items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 shrink-0"></div>
                   <span className="text-xs text-cream-800/70">~90% visual match to staging</span>
                 </li>
                 <li className="flex items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 shrink-0"></div>
                   <span className="text-xs text-cream-800/70">Furniture approval before purchase</span>
                 </li>
                 <li className="flex items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 mr-2 shrink-0"></div>
                   <span className="text-xs text-cream-800/70">Items shipped directly to property</span>
                 </li>
                 <li className="flex items-start">
                   <div className="w-1.5 h-1.5 rounded-full bg-cream-800/30 mt-1.5 mr-2 shrink-0"></div>
                   <span className="text-xs text-cream-800/40 italic">Installation not included</span>
                 </li>
               </ul>
               <button
                 onClick={() => startCheckout('furnishing_addon')}
                 disabled={isTeamCheckoutDisabled || loadingKey === 'furnishing_addon'}
                 className="mt-4 w-full py-2 px-3 bg-white border border-cream-200 text-cream-800/80 text-sm font-semibold rounded-lg hover:bg-cream-50 disabled:opacity-60 disabled:cursor-not-allowed"
               >
                 {loadingKey === 'furnishing_addon' ? 'Processing...' : 'Add Furnishing'}
               </button>
            </div>
          </div>

        </div>

        {/* Footer Options */}
        <div className="mt-16 pt-8 border-t border-cream-200">
           <div className="flex flex-col md:flex-row justify-center items-center gap-6 md:gap-12">
             
             {/* Extra Credits */}
             <div className="flex items-center space-x-4 bg-white px-6 py-4 rounded-xl border border-cream-200 shadow-sm">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Camera className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-900">Buy Extra Credits</h4>
                  <p className="text-sm text-cream-800/70">
                    <span className="font-semibold text-blue-600">50</span> for $22 or <span className="font-semibold text-blue-600">100</span> for $40
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => startCheckout('extra_credits_50')}
                      disabled={isTeamCheckoutDisabled || loadingKey === 'extra_credits_50'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingKey === 'extra_credits_50' ? 'Processing...' : 'Buy 50'}
                    </button>
                    <button
                      onClick={() => startCheckout('extra_credits_100')}
                      disabled={isTeamCheckoutDisabled || loadingKey === 'extra_credits_100'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingKey === 'extra_credits_100' ? 'Processing...' : 'Buy 100'}
                    </button>
                  </div>
                </div>
             </div>

             {/* Pay Per Image */}
             <div className="flex items-center space-x-4 bg-white px-6 py-4 rounded-xl border border-cream-200 shadow-sm">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-900">Pay Per Image</h4>
                  <p className="text-sm text-cream-800/70">
                    Flexible usage starting from <span className="font-semibold text-blue-600">$1.50</span> / image
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                      className="w-20 px-2 py-1 text-xs border border-cream-200 rounded-lg"
                    />
                    <button
                      onClick={() => startCheckout('pay_per_image', quantity)}
                      disabled={isTeamCheckoutDisabled || loadingKey === 'pay_per_image'}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {loadingKey === 'pay_per_image' ? 'Processing...' : 'Pay Per Image'}
                    </button>
                  </div>
                </div>
             </div>

           </div>
           
           <div className="text-center mt-8 text-cream-800/40 text-sm">
             Prices are in USD. Standard taxes apply. Need help? <a href="#" className="text-blue-500 hover:underline">Contact Support</a>.
           </div>
        </div>

      </div>
    </div>
  );
};

export default PricingPage;