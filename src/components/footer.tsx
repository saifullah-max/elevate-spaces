import Link from "next/link";
import { HouseIcon } from "lucide-react";
import { FOOTER_LEGAL_LINKS } from "@/lib/legal-documents";

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-white/70 mt-4">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 border-b border-white/10 pb-8">
          <Link href="/" className="flex items-center gap-2 select-none">
            <div className="w-7 h-7 rounded-md bg-brand-500 flex items-center justify-center">
              <HouseIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-white text-base">
              Elevate<span className="text-brand-500">Spaces</span>
              <span suppressHydrationWarning>AI</span>
            </span>
          </Link>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            {FOOTER_LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-white/40 mt-6">
          © <span suppressHydrationWarning>{new Date().getFullYear()}</span> ElevateSpaces. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
