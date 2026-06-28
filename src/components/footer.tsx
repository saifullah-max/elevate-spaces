import { Copyright } from "lucide-react";
import Link from "next/link";
import { FOOTER_LEGAL_LINKS } from "@/lib/legal-documents";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md">
            <Image
              src='/logo-navbar-upd.png'
              width={70}
              height={70}
              className="w-10 h-10 rounded-sm"
              alt="Icon"
            />
          </div>
          <span className="text-xl font-bold text-white">
            Elevate<span className="text-indigo-500">Spaces</span><span suppressHydrationWarning>AI</span>
          </span>
        </div>

        {/* Copyright */}
        <div className="flex items-center gap-2 text-sm text-center">
          <Copyright className="w-4 h-4" />
          <span suppressHydrationWarning>{new Date().getFullYear()}</span>{" "}
          ElevateSpaces. All rights reserved.
        </div>

        {/* Legal Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-12 gap-y-3 text-sm text-center md:text-left">
          {FOOTER_LEGAL_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-white py-2 px-1 block"
            >
              {link.label}
            </Link>
          ))}
        </div>

      </div>
    </footer>
  );
}
