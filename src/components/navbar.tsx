"use client";

import { useState, useEffect } from "react";
import {
  Home,
  Menu,
  FolderOpen,
  PenTool,
  TrendingUp,
  Users,
  X,
  LogOut,
  User,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAuthFromStorage, clearAuthFromStorage } from "@/lib/auth.storage";
import type { User as UserType } from "@/store/slices/authSlice";

interface UserData {
  id: string | null;
  email: string | null;
  name: string | null;
  avatarUrl?: string | null;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Function to load user from localStorage
    const loadUserFromStorage = () => {
      const authData = getAuthFromStorage();
      if (authData && authData.user) {
        setUser({
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.name,
          avatarUrl: authData.user.avatarUrl || null,
        });
      } else {
        setUser(null);
      }
    };

    // Load user on mount
    loadUserFromStorage();

    // Listen for storage changes (e.g., from other tabs or after login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "elevate_spaces_auth" || e.key === null) {
        loadUserFromStorage();
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const handleLogout = () => {
    clearAuthFromStorage();
    setUser(null);
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

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

            {/* Login Button / User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full object-cover border-2 border-indigo-600"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                      {user.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                    </div>
                  )}
                  <span className="font-medium text-slate-700 max-w-[120px] truncate">
                    {user.name?.split(" ")[0] || "User"}
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/sign-in"
                className="font-semibold text-indigo-600 px-6 py-2.5 rounded-full shadow-lg text-sm hover:bg-indigo-600 hover:text-black transition-all border border-indigo-600"
              >
                Log In
              </Link>
            )}
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
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-200 rounded-xl">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || "User"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {user.name?.charAt(0).toUpperCase() || <User className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-3 px-6 font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <Link
                  href="/sign-in"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block w-full text-center py-4 px-6 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-lg transition-transform active:scale-95"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
