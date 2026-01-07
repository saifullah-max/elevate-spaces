"use client";

import { useState, useRef, useEffect } from "react";
import {
  Home,
  Menu,
  FolderOpen,
  PenTool,
  TrendingUp,
  Users,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { useAuthUser, useIsAuthenticated, useAppDispatch } from "@/store/hooks";
import { useRouter } from "next/navigation";
import { logout } from "@/store/slices/authSlice";
import { clearAuthFromStorage } from "@/lib/auth.storage";

export default function Navbar() {
  const user = useAuthUser();
  const isLoggedIn = useIsAuthenticated();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dispatch = useAppDispatch();
  const router = useRouter();

  // Refs for dropdown and button
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const userMenuButtonRef = useRef<HTMLButtonElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDropdown) return;
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        userMenuButtonRef.current &&
        !userMenuButtonRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  const handleLogout = () => {
    clearAuthFromStorage();
    dispatch(logout());
    setShowDropdown(false);
    router.push("/sign-in");
  };

  // Close dropdown on outside click
  // (for simplicity, only closes on menu toggle or option click)

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 py-6 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
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

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-6">
          <button
            onClick={() => scrollToSection("try-it-free")}
            className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Try Demo
          </button>

          <button className="text-slate-600 hover:text-indigo-600 font-medium transition-colors">
            Services
          </button>

          <button
            id="nav-projects"
            className=" text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
          >
            <FolderOpen className="w-4 h-4" /> Projects
          </button>

          <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
            <button
              className="text-indigo-600 font-bold flex items-center gap-1 text-sm hover:underline transition"
            >
              <PenTool className="w-4 h-4" /> Writer
            </button>

            <button
              className="text-emerald-600 font-bold flex items-center gap-1 text-sm hover:underline transition"
            >
              <TrendingUp className="w-4 h-4" /> ROI Calculator
            </button>
          </div>

          <button
            className="text-slate-600 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors"
          >
            <Users className="w-4 h-4" /> Team
          </button>

          <button
            onClick={() => scrollToSection("pricing")}
            className="text-slate-600 hover:text-indigo-600 font-medium transition-colors"
          >
            Pricing
          </button>

          {!isLoggedIn ? (
            <div>
              <Link
                href="/sign-in"
                className="inline-flex items-center gap-2 h-11 px-5 font-semibold text-slate-600 bg-white border border-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
                style={{ verticalAlign: 'middle' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <LogIn className="w-5 h-5" />
                Log In
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                className="flex items-center gap-2 font-semibold text-slate-800 hover:text-indigo-600 focus:outline-none"
                id="user-menu-button"
                aria-haspopup="true"
                aria-expanded={showDropdown ? "true" : "false"}
                onClick={() => setShowDropdown((prev) => !prev)}
                type="button"
              >
                {user?.name}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
                >
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-t-lg"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-slate-100 rounded-b-lg"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-slate-800 p-2"
            aria-label="Toggle menu"
          >
            <Menu className="w-7 h-7" />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white shadow-lg py-4 px-5 flex flex-col gap-3 border-t border-slate-100">
          <button
            onClick={() => scrollToSection("try-it-free")}
            className="text-left py-2 text-base font-medium text-slate-700 hover:text-indigo-600 transition-colors"
          >
            Try Demo
          </button>

          <button
            id="mobile-projects"
            className="text-left py-2 text-base font-medium flex items-center gap-2 text-slate-700 hover:text-indigo-600 transition-colors"
          >
            <FolderOpen className="w-5 h-5" /> Projects
          </button>

          <button
            className="text-left py-2 text-base font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
          >
            AI Writer
          </button>

          <button
            className="text-left py-2 text-base font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            ROI Calculator
          </button>

          <button
            className="text-left py-2 text-base font-medium text-slate-700 hover:text-indigo-600 transition-colors"
          >
            Team
          </button>

          <button
            onClick={() => scrollToSection("pricing")}
            className="text-left py-2 text-base font-medium text-slate-700 hover:text-indigo-600 transition-colors"
          >
            Pricing
          </button>

          {!isLoggedIn ? (
            <div className="pt-2">
              <Link
                href="/sign-in"
                className="block w-full text-center py-3 px-5 font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center justify-center gap-2">
                  <LogIn className="w-5 h-5" />
                  Log In
                </div>
              </Link>
            </div>
          ) : (
            <div className="relative">
              <button
                ref={userMenuButtonRef}
                className="flex items-center gap-2 font-semibold text-slate-800 hover:text-indigo-600 focus:outline-none"
                id="user-menu-button-mobile"
                aria-haspopup="true"
                aria-expanded={showDropdown ? "true" : "false"}
                onClick={() => setShowDropdown((prev) => !prev)}
                type="button"
              >
                {user?.name}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
              </button>
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50"
                >
                  <Link
                    href="/profile"
                    className="block px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-t-lg"
                    onClick={() => setShowDropdown(false)}
                  >
                    Profile
                  </Link>
                  <button
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-slate-100 rounded-b-lg"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
