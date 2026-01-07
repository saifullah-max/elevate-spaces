import { Copyright, Home } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-md">
            <Home className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-white">
            Elevate<span className="text-indigo-500">Spaces</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm" id="copyright">
          <Copyright className="w-4 h-4" /> {new Date().getFullYear()}{" "}
          ElevateSpaces. All rights reserved.
        </div>
        <div className="grid grid-cols-2 md:flex gap-x-6 gap-y-2 text-sm">
          <Link href="/privacy-policy" className="hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" className="hover:text-white">
            Terms of Use
          </Link>
          <Link href="/disclaimer" className="hover:text-white">
            Disclaimer
          </Link>
          <Link href="/cancellation-policy" className="hover:text-white">
            Cancellation &amp; Refund
          </Link>
          <Link href="/support" className="hover:text-white">
            Support
          </Link>
          <Link href="/cookie-policy" className="hover:text-white">
            Cookie Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}
