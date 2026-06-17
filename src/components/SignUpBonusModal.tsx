'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SignUpBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignUpBonusModal({ open, onOpenChange }: SignUpBonusModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="bg-linear-to-br from-amber-100 to-orange-100 p-3 rounded-full">
              <Sparkles className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">You&apos;ve used your 10 free trial credits</DialogTitle>
          <DialogDescription className="text-base text-slate-600">
            Free trial credits are for new visitors only. Sign up now to claim a one-time bonus and keep staging.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg p-4 border border-indigo-200">
            <div className="flex items-start gap-3">
              <div className="bg-indigo-100 rounded-full p-2 shrink-0">
                <Sparkles className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900">New user bonus</p>
                <p className="text-sm text-indigo-700 mt-1">
                  Create a brand-new account today and we&apos;ll add <span className="font-bold">5 bonus credits</span> instantly.
                </p>
                <p className="text-xs text-indigo-600 mt-2 opacity-75">
                  ⏰ One-time offer for new sign-ups only. Existing accounts are not eligible.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Link href="/sign-up?bonus=true" className="block" onClick={() => onOpenChange(false)}>
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 h-auto gap-2">
                Create Account &amp; Claim Bonus
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Continue Without Signing Up
            </Button>
          </div>

          <div className="text-center text-xs text-slate-500 pt-2 border-t">
            <p>Already have an account? <Link href="/sign-in" className="text-indigo-600 hover:underline font-semibold">Sign in here</Link> — the bonus does not apply to existing accounts.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
