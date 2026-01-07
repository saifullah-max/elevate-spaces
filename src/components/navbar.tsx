"use client";

import { useState } from "react";
import {
  Home,
  Menu,
  FolderOpen,
  PenTool,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setMobileMenuOpen(false);
  };

  // Navigation items for desktop & mobile reuse
  const navItems = [
    { label: "Try Demo", section: "try-it-free" },
    { label: "Services", section: "services" },
    {
      label: "Projects",
      icon: <FolderOpen className="w-4 h-4" />,
      section: null,
      id: "nav-projects",
    },
    { label: "Team", icon: <Users className="w-4 h-4" />, section: null },
    { label: "Pricing", section: "pricing" },
  ];

  const toolLinks = [
    {
      label: "Writer",
      color: "text-indigo-600",
      hover: "hover:text-indigo-700",
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      label: "ROI Calculator",
      color: "text-emerald-600",
      hover: "hover:text-emerald-700",
      icon: <TrendingUp className="w-4 h-4" />,
    },
  ];

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 py-6 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            onClick={scrollToTop}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Home className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Elevate<span className="text-indigo-600">Spaces</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                id={item.id || undefined}
                onClick={() => item.section && scrollToSection(item.section)}
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1.5"
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            {/* Tool Links */}
            <div className="flex items-center gap-6 border-l border-slate-200 pl-8">
              {toolLinks.map((tool) => (
                <button
                  key={tool.label}
                  className={`font-bold text-sm flex items-center gap-1.5 hover:underline transition ${tool.color} ${tool.hover}`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>

            {/* Login Button */}
            <Link
              href="/sign-in"
              className="font-semibold text-indigo-600 px-6 py-2.5 rounded-full shadow-lg text-sm hover:bg-indigo-600 hover:text-white transition-all border border-indigo-600"
            >
              Log In
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden text-slate-800 p-2"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <X className="w-7 h-7" />
            ) : (
              <Menu className="w-7 h-7" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu - Improved Design */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="px-6 py-6 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                id={item.id ? `mobile-${item.id}` : undefined}
                onClick={() => item.section && scrollToSection(item.section)}
                className="w-full text-left py-3.5 px-4 rounded-lg text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-3"
              >
                {item.icon}
                {item.label}
              </button>
            ))}

            <div className="pt-4 space-y-1">
              {toolLinks.map((tool) => (
                <button
                  key={tool.label}
                  className={`w-full text-left py-3.5 px-4 rounded-lg text-base font-semibold flex items-center gap-3 hover:bg-gray-50 transition ${tool.color} ${tool.hover}`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div>

            <div className="pt-6">
              <Link
                href="/sign-in"
                onClick={() => setMobileMenuOpen(false)}
                className="block w-full text-center py-4 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-transform active:scale-95"
              >
                Log In
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
