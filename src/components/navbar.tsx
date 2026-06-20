"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { AUTH_CHANGED_EVENT, getAuthFromStorage, clearAuthFromStorage, saveAuthToStorage } from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import type { User as UserType } from "@/store/slices/authSlice";
import { deleteProfileImage, getCurrentUserProfile } from "@/services/auth.service";
import { showError, showSuccess } from "@/components/toastUtils";
import { BookOpen, FolderOpen, Loader, LogOut, Menu, Settings, User, Users, UserX, X } from "lucide-react";
import Image from "next/image";

interface UserData {
  id: string | null;
  email: string | null;
  name: string | null;
  role: UserType["role"] | string | string[] | null;
  avatarUrl?: string | null;
  manualAvatarUrl?: string | null;
}

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRemovingProfileImage, setIsRemovingProfileImage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  // Tracks whether the current avatarUrl failed to load (CORS, 403 from a
  // hotlink-protected CDN, broken upload, etc.) so we can fall back to the
  // initials bubble instead of rendering a broken image.
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith('/admin');

  const userHasRole = (roleName: string): boolean => hasRole(user?.role ?? null, roleName);

  useEffect(() => {
    if (isAdminPage) return;

    const loadUserFromApi = async () => {
      const authData = getAuthFromStorage();
      if (!authData?.token) {
        setUser(null);
        return;
      }

      try {
        const apiUser = await getCurrentUserProfile();
        setUser({
          id: apiUser.id,
          email: apiUser.email,
          name: apiUser.name,
          role: apiUser.role,
          // Prefer the user's manually-uploaded avatar; fall back to the
          // OAuth/provider avatar when no manual one has been set.
          avatarUrl: apiUser.manualAvatarUrl || apiUser.avatarUrl || null,
          manualAvatarUrl: apiUser.manualAvatarUrl || null,
        });
      } catch {
        setUser({
          id: authData.user.id,
          email: authData.user.email,
          name: authData.user.name,
          role: authData.user.role,
          avatarUrl: authData.user.manualAvatarUrl || authData.user.avatarUrl || null,
          manualAvatarUrl: authData.user.manualAvatarUrl || null,
        });
      }
    };

    // Load user on mount
    loadUserFromApi();

    // Listen for storage changes (e.g., from other tabs or after login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "elevate_spaces_auth" || e.key === null) {
        loadUserFromApi();
      }
    };

    const handleAuthChanged = () => {
      loadUserFromApi();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(AUTH_CHANGED_EVENT, handleAuthChanged);
    };
  }, [isAdminPage]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatarUrl]);

  const handleLogout = () => {
    clearAuthFromStorage();
    setUser(null);
    setDropdownOpen(false);
    setMobileMenuOpen(false);

    window.location.href = "/";
  };

  const handleOpenSettings = () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    router.push('/settings');
  };

  const handleRemoveProfileImage = async () => {
    if (!user?.avatarUrl || isRemovingProfileImage) return;

    try {
      setIsRemovingProfileImage(true);
      const result = await deleteProfileImage();
      const currentAuth = getAuthFromStorage();
      if (currentAuth?.token) {
        saveAuthToStorage(result.user, currentAuth.token);
        window.dispatchEvent(new StorageEvent('storage', { key: 'elevate_spaces_auth' }));
      }

      setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        avatarUrl: result.user.avatarUrl || null,
      });
      setDropdownOpen(false);
      setMobileMenuOpen(false);
      showSuccess(result.message || 'Profile image removed successfully');
    } catch (error: any) {
      showError(error?.message || 'Failed to remove profile image');
    } finally {
      setIsRemovingProfileImage(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const scrollToTop = () => {
    if (window.location.pathname === "/") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      setMobileMenuOpen(false);
    } else {
      router.push("/");
    }
  };

  // Navigation items for desktop & mobile reuse
  const navItems = [
    {
      label: "Projects",
      icon: <FolderOpen className="w-4 h-4" />,
      section: null,
      id: "nav-projects",
      href: "/projects",
    },
    { label: "Team", icon: <Users className="w-4 h-4" />, section: null, href: "/teams" },
    { label: "Resources", icon: <BookOpen className="w-4 h-4" />, section: null, href: "/resources" },
    // { label: "Pricing", section: "pricing", href: null },
  ];

  // Helper to compute initials
  const getInitials = (name?: string | null) => {
    if (!name) return '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 1) {
      // Only first name: use first two letters
      return parts[0].slice(0, 2).toUpperCase();
    } else if (parts.length >= 2) {
      // Two or more names: first letter of first and last
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return '';
  };

  if (isAdminPage || !isMounted) {
    return null;
  }

  return (
    <nav className="fixed w-full z-50 transition-all duration-300 py-6 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div
            onClick={scrollToTop}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className="p-1 rounded-lg">
              {/* <Home className="w-6 h-6 text-white" /> */}
              <Image
                src='/logo-navbar-upd.png'
                width={70}
                height={70}
                className="w-10 h-10 rounded-sm"
                alt="Icon"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              Elevate<span className="text-indigo-600">Spaces</span><span suppressHydrationWarning>AI</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1.5"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  id={item.id || undefined}
                  onClick={() => item.section && scrollToSection(item.section)}
                  className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1.5"
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            ))}

            {userHasRole("ADMIN") && (
              <Link
                href="/admin/dashboard"
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1.5"
              >
                Dashboard
              </Link>
            )}

            {/* {user && (
              <button
                onClick={handleOpenSettings}
                className="text-slate-600 hover:text-indigo-600 font-medium transition-colors flex items-center gap-1.5"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )} */}

            {/* Tool Links */}
            {/* <div className="flex items-center gap-4 border-l border-slate-200 pl-8">
              {toolLinks.map((tool) => (
                <button
                  key={tool.label}
                  className={`font-bold text-sm flex items-center gap-1 hover:underline transition ${tool.color} ${tool.hover}`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div> */}

            {/* Login Button / User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  {user.avatarUrl && !avatarLoadFailed ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name || "User"}
                      className="w-8 h-8 rounded-full object-cover border-2 border-indigo-600"
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarLoadFailed(true)}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm">
                      {getInitials(user.name) || <User className="w-4 h-4" />}
                    </div>
                  )}
                  <span className="font-medium text-slate-700 max-w-30 truncate">
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
                      onClick={handleOpenSettings}
                      className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
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

      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white shadow-xl border-t border-slate-100 animate-in slide-in-from-top duration-300">
          <div className="px-6 py-6 space-y-1">
            {navItems.map((item) => (
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  prefetch
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-left py-3.5 px-4 rounded-lg text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-3"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ) : (
                <button
                  key={item.label}
                  type="button"
                  id={item.id ? `mobile-${item.id}` : undefined}
                  onClick={() => item.section && scrollToSection(item.section)}
                  className="w-full text-left py-3.5 px-4 rounded-lg text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-3"
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            ))}

            {userHasRole("ADMIN") && (
              <Link
                href="/admin/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-left py-3.5 px-4 rounded-lg text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition flex items-center gap-3"
              >
                Dashboard
              </Link>
            )}

            {/* <div className="pt-4 space-y-1">
              {toolLinks.map((tool) => (
                <button
                  key={tool.label}
                  className={`w-full text-left py-3.5 px-4 rounded-lg text-base font-semibold flex items-center gap-3 hover:bg-gray-50 transition ${tool.color} ${tool.hover}`}
                >
                  {tool.icon}
                  {tool.label}
                </button>
              ))}
            </div> */}

            <div className="pt-6">
              {user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 px-4 py-3 bg-slate-200 rounded-xl">
                    {user.avatarUrl && typeof user.avatarUrl === 'string' && !avatarLoadFailed ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name || "User"}
                        className="w-10 h-10 rounded-full object-cover border-2 border-indigo-600"
                        referrerPolicy="no-referrer"
                        onError={() => setAvatarLoadFailed(true)}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                        {getInitials(user?.name) || <User className="w-5 h-5" />}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{user?.name || ''}</p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenSettings}
                    className="w-full py-3 px-6 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </button>
                  <button
                    onClick={handleRemoveProfileImage}
                    disabled={isRemovingProfileImage || !user.avatarUrl}
                    className="w-full py-3 px-6 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-60 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    {isRemovingProfileImage ? <Loader className="w-4 h-4 animate-spin" /> : <UserX className="w-4 h-4" />}
                    Remove profile image
                  </button>
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
