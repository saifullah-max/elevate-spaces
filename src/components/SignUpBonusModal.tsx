"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, X } from "lucide-react";
import Link from "next/link";

interface SignUpBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpBonusModal({ open, onOpenChange }: SignUpBonusModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-6 text-center relative [&>button]:hidden">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 text-cream-800/40 hover:text-brand-900"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-14 h-14 rounded-full bg-brand-100 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6 text-brand-500" />
        </div>

        <h3 className="font-display text-lg font-bold text-brand-900 mb-2">
          You've used your 10 free trial credits
        </h3>

        <p className="text-sm text-cream-800/60 leading-relaxed mb-6">
          Sign up now and get <span className="font-semibold text-brand-900">5 bonus credits, watermark-free</span>.
          This one-time offer is for new visitors only - existing accounts are not eligible.
        </p>

        <Link href="/sign-up?bonus=true" className="block" onClick={() => onOpenChange(false)}>
          <button className="w-full bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold py-3 rounded-lg transition-colors">
            Sign Up &amp; Claim 5 Free Credits
          </button>
        </Link>

        <p className="text-xs text-cream-800/40 mt-4">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-brand-500 hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </DialogContent>
    </Dialog>
  );
}
