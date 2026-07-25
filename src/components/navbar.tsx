"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  AUTH_CHANGED_EVENT,
  getAuthFromStorage,
  clearAuthFromStorage,
  saveAuthToStorage,
} from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import type { User as UserType } from "@/store/slices/authSlice";
import { deleteProfileImage, getCurrentUserProfile } from "@/services/auth.service";
import { showError, showSuccess } from "@/components/toastUtils";
import { ChevronDown, HouseIcon, LogOut, Settings, UserX } from "lucide-react";
import AuthGateModal from "@/components/AuthGateModal";
import {
  AUTH_MODAL_OPEN_EVENT,
  AuthModalOpenDetail,
  consumePendingAuthModal,
} from "@/lib/authModal";

interface UserData {
  id: string | null;
  email: string | null;
  name: string | null;
  role: UserType["role"] | string | string[] | null;
  avatarUrl?: string | null;
  manualAvatarUrl?: string | null;
}

type TabKey = "home" | "studio" | "pricing" | "resources";

const TABS: { key: TabKey; label: string; href: string }[] = [
  { key: "home", label: "Home", href: "/" },
  { key: "studio", label: "Studio", href: "/studio" },
  { key: "pricing", label: "Pricing", href: "/pricing" },
  { key: "resources", label: "Resources", href: "/resources" },
];

function tabFromPath(pathname: string | null): TabKey {
  if (!pathname) return "home";
  if (pathname === "/" || pathname.startsWith("/home")) return "home";
  if (pathname.startsWith("/studio")) return "studio";
  if (pathname.startsWith("/pricing")) return "pricing";
  if (pathname.startsWith("/resources")) return "resources";
  return "home";
}

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isRemovingProfileImage, setIsRemovingProfileImage] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<"login" | "signup">("login");
  const [authModalError, setAuthModalError] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isAdminPage = pathname?.startsWith("/admin");
  const activeTab = tabFromPath(pathname);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

    loadUserFromApi();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "elevate_spaces_auth" || e.key === null) loadUserFromApi();
    };
    const handleAuthChanged = () => loadUserFromApi();

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
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AuthModalOpenDetail>).detail;
      if (!detail) return;
      setAuthModalView(detail.view);
      setAuthModalError(detail.error ?? null);
      setAuthModalOpen(true);
    };
    window.addEventListener(AUTH_MODAL_OPEN_EVENT, handler);
    // Drain any request that was persisted before this Navbar mounted
    // (typical when /sign-in or /sign-up trampolines redirect to /).
    const pending = consumePendingAuthModal();
    if (pending) {
      setAuthModalView(pending.view);
      setAuthModalError(pending.error ?? null);
      setAuthModalOpen(true);
    }
    return () => window.removeEventListener(AUTH_MODAL_OPEN_EVENT, handler);
  }, []);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [user?.avatarUrl]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [dropdownOpen]);

  const handleLogout = () => {
    clearAuthFromStorage();
    setUser(null);
    setDropdownOpen(false);
    window.location.href = "/";
  };

  const handleOpenSettings = () => {
    setDropdownOpen(false);
    router.push("/settings");
  };

  const handleRemoveProfileImage = async () => {
    if (!user?.avatarUrl || isRemovingProfileImage) return;
    try {
      setIsRemovingProfileImage(true);
      const result = await deleteProfileImage();
      const currentAuth = getAuthFromStorage();
      if (currentAuth?.token) {
        saveAuthToStorage(result.user, currentAuth.token);
        window.dispatchEvent(new StorageEvent("storage", { key: "elevate_spaces_auth" }));
      }
      setUser({
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        avatarUrl: result.user.avatarUrl || null,
      });
      setDropdownOpen(false);
      showSuccess(result.message || "Profile image removed successfully");
    } catch (error: any) {
      showError(error?.message || "Failed to remove profile image");
    } finally {
      setIsRemovingProfileImage(false);
    }
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "";
    const parts = name.trim().split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  if (isAdminPage || !isMounted) return null;

  const firstName = user?.name?.split(" ")[0] || "User";

  return (
    <nav
      className="sticky top-0 z-30 bg-cream-50/90 backdrop-blur-md border-b border-cream-200"
      style={{ top: "var(--top-banner-height, 0px)" }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 select-none">
          <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center">
            <HouseIcon className="text-white w-4 h-4" />
          </div>
          <span className="font-display font-bold text-lg text-brand-900">
            Elevate<span className="text-brand-500">Spaces</span>AI
          </span>
        </Link>

        {/* Desktop tabs */}
        <div className="hidden md:flex items-center gap-2 bg-white border border-cream-200 rounded-xl p-1">
          {TABS.map((t) => {
            const active = activeTab === t.key;
            return (
              <Link
                key={t.key}
                href={t.href}
                className={
                  "px-2 py-2 rounded-lg text-xs font-semibold transition-all " +
                  (active
                    ? "bg-brand-500 text-white"
                    : "text-cream-800/60 hover:text-brand-900")
                }
              >
                {t.label}
              </Link>
            );
          })}
          {userHasRole("ADMIN") && (
            <Link
              href="/admin/dashboard"
              className="px-2 py-2 rounded-lg text-xs font-semibold text-cream-800/60 hover:text-brand-900 transition-all"
            >
              Dashboard
            </Link>
          )}
        </div>

        {/* Right side: log-in or account menu + primary CTA */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className="flex items-center gap-2 hover:bg-white rounded-lg px-2 py-1.5 transition-colors"
              >
                {user.avatarUrl && !avatarLoadFailed ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User"}
                    className="w-7 h-7 rounded-full object-cover border-2 border-brand-500"
                    referrerPolicy="no-referrer"
                    onError={() => setAvatarLoadFailed(true)}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center text-xs font-semibold border-2 border-brand-500">
                    {getInitials(user.name) || firstName[0]}
                  </div>
                )}
                <span className="hidden md:inline text-sm font-semibold text-brand-900 max-w-24 truncate">
                  {firstName}
                </span>
                <ChevronDown className="w-3 h-3 text-cream-800/50" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-62 bg-white border border-cream-200 rounded-2xl shadow-xl overflow-hidden z-40">
                  <div className="p-4 border-b border-cream-200">
                    <p className="font-display font-bold text-brand-900 truncate">
                      {user.name}
                    </p>
                    <p className="text-xs text-cream-800/50 truncate">{user.email}</p>
                  </div>
                  <button
                    onClick={handleOpenSettings}
                    className="w-full flex items-center gap-2.5 px-2 py-2 text-xs font-medium text-cream-800/80 hover:bg-cream-50 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-cream-800/50" /> Settings
                  </button>
                  {/* {user.avatarUrl && (
                    <button
                      onClick={handleRemoveProfileImage}
                      disabled={isRemovingProfileImage}
                      className="w-full flex items-center gap-2.5 px-2 py-2 text-xs font-medium text-cream-800/80 hover:bg-cream-50 transition-colors disabled:opacity-60"
                    >
                      <UserX className="w-4 h-4 text-cream-800/50" /> Remove profile image
                    </button>
                  )} */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2 py-2 text-xs font-semibold text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setAuthModalView("login");
                setAuthModalError(null);
                setAuthModalOpen(true);
              }}
              className="text-xs sm:text-sm font-medium text-cream-800/70 hover:text-brand-900 whitespace-nowrap"
            >
              Log in
            </button>
          )}

          {!user && (
            <button
              type="button"
              onClick={() => {
                setAuthModalView("signup");
                setAuthModalError(null);
                setAuthModalOpen(true);
              }}
              className="bg-accent-500 hover:bg-accent-600 transition-colors text-white text-xs md:text-sm font-medium px-4 py-2 rounded-lg shadow-sm whitespace-nowrap"
            >
              Start free · 10 credits
            </button>
          )}
        </div>
      </div>

      {/* Mobile tab switcher */}
      <div className="md:hidden flex border-t border-cream-200">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={t.href}
              className={
                "flex-1 py-2.5 text-xs font-semibold text-center transition-all " +
                (active ? "bg-brand-500 text-white" : "text-cream-800/60")
              }
            >
              {t.label}
            </Link>
          );
        })}
      </div>

      <AuthGateModal
        open={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setAuthModalError(null);
        }}
        onSuccess={() => {
          setAuthModalOpen(false);
          setAuthModalError(null);
          // Reload the current page so guarded routes (projects, teams, etc.)
          // re-read auth state and load their data instead of showing the
          // LoginPrompt beneath the closed modal.
          if (typeof window !== "undefined") {
            window.location.reload();
          }
        }}
        initialView={authModalView}
        initialError={authModalError}
      />
    </nav>
  );
}
