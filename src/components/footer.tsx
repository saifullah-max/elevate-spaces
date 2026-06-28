import { Copyright } from "lucide-react";
import Link from "next/link";
import { FOOTER_LEGAL_LINKS } from "@/lib/legal-documents";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-row items-center justify-between gap-8">
        
        {/* Logo + Copyright side by side */}
        <div className="flex flex-col gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <Image
              src='/logo-navbar-upd.png'
              width={70}
              height={70}
              className="w-10 h-10 rounded-sm"
              alt="Icon"
            />
            <span className="text-xl font-bold text-white">
              Elevate<span className="text-indigo-500">Spaces</span><span suppressHydrationWarning>AI</span>
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Copyright className="w-3 h-3" />
            <span suppressHydrationWarning>{new Date().getFullYear()}</span>
            <span>ElevateSpaces. All rights reserved.</span>
          </div>
        </div>

        {/* Legal Links */}
        <div className="grid grid-cols-4 gap-x-16 gap-y-3 text-sm">
          {FOOTER_LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white whitespace-nowrap"
            >
              {link.label}
            </Link>
          ))}
        </div>

      </div>
    </footer>
  );
}
