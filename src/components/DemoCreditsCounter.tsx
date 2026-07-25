'use client'
import { Sparkles } from "lucide-react";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { useEffect, useState } from "react";

interface DemoCreditsCounterProps {
  demoCount: number;
  demoLimit: number;
  isDemo: boolean;
}

export function DemoCreditsCounter({ demoCount, demoLimit, isDemo }: DemoCreditsCounterProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const auth = getAuthFromStorage();
    setIsLoggedIn(!!auth?.user);
  }, []);

  // Show counter only for non-logged-in users (demo mode)
  if (isLoggedIn) return null;

  const percentage = (demoCount / demoLimit) * 100;
  const remaining = Math.max(0, demoLimit - demoCount);
  
  // Color based on usage
  const getColor = () => {
    if (percentage >= 100) return 'text-red-600';
    if (percentage >= 80) return 'text-orange-600';
    if (percentage >= 50) return 'text-amber-600';
    return 'text-brand-500';
  };

  const getBgColor = () => {
    if (percentage >= 100) return 'bg-red-50 border-red-200';
    if (percentage >= 80) return 'bg-orange-50 border-orange-200';
    if (percentage >= 50) return 'bg-amber-50 border-amber-200';
    return 'bg-brand-50 border-brand-100';
  };

  const getBarColor = () => {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-brand-500';
  };

  return (
    <div className={`rounded-lg p-4 border ${getBgColor()} transition-all duration-300`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-5 h-5 ${getColor()}`} />
          <h3 className={`font-semibold ${getColor()}`}>Instant AI Staging Demo</h3>
        </div>
        <div className={`text-sm font-bold ${getColor()}`}>
          {remaining} left
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-cream-800/70">Demo Used:</span>
          <span className={`font-semibold ${getColor()}`}>
            {demoCount} / {demoLimit}
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-cream-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full ${getBarColor()} transition-all duration-500 ease-out`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        
        {percentage >= 100 && (
          <p className="text-xs text-red-600 font-medium mt-2">
            ⚠️ Demo limit reached. Sign up to continue!
          </p>
        )}
      </div>
    </div>
  );
}
