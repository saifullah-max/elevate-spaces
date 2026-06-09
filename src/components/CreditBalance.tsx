"use client";

import React, { useEffect, useState } from "react";
import { Coins, RefreshCw, Loader2 } from "lucide-react";
import { getUserCredits } from "@/services/payment.service";

interface CreditBalanceProps {
  onBalanceChange?: (balance: number) => void;
  refreshTrigger?: number; // Use this prop to trigger refresh from parent
}

export function CreditBalance({ onBalanceChange, refreshTrigger }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchBalance = async () => {
    try {
      setLoading(true);
      setError(null);
      const credits = await getUserCredits();
      setBalance(credits.currentBalance);
      setLastRefresh(new Date());
      onBalanceChange?.(credits.currentBalance);
    } catch (err: any) {
      setError(err?.message || "Failed to load credits");
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchBalance();
  }, []);

  // Refresh when trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchBalance();
    }
  }, [refreshTrigger]);

  if (loading && balance === null) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
        <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
        <span className="text-sm text-slate-600">Loading credits...</span>
      </div>
    );
  }

  if (error && balance === null) {
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-lg border border-red-200">
        <span className="text-sm text-red-600">{error}</span>
        <button
          onClick={fetchBalance}
          className="text-red-600 hover:text-red-700 ml-2"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const creditColor = balance === 0 ? "text-red-600" : balance && balance < 5 ? "text-amber-600" : "text-emerald-600";
  const bgColor = balance === 0 ? "bg-red-50" : balance && balance < 5 ? "bg-amber-50" : "bg-emerald-50";
  const borderColor = balance === 0 ? "border-red-200" : balance && balance < 5 ? "border-amber-200" : "border-emerald-200";

  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border ${bgColor} ${borderColor}`}>
      <div className="flex items-center gap-2">
        <Coins className={`w-4 h-4 ${creditColor}`} />
        <div>
          <span className={`text-sm font-semibold ${creditColor}`}>{balance} credits</span>
          {lastRefresh && <p className="text-xs text-slate-500">Updated just now</p>}
        </div>
      </div>
      <button
        onClick={fetchBalance}
        disabled={loading}
        className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}
