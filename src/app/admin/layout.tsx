'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearAuthFromStorage, getAuthFromStorage, saveAuthToStorage } from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import { Home, FileText, BookOpen, Camera, BarChart3, Users, User, HouseIcon, Loader, LogOut, Settings, ExternalLink, Building2 } from "lucide-react";
import { deleteProfileImage } from "@/services/auth.service";
import { showError, showSuccess } from "@/components/toastUtils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Admin");
  const [userEmail, setUserEmail] = useState("");
  const [userAvatarUrl, setUserAvatarUrl] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || !hasRole(auth.user.role, "ADMIN")) {
      router.replace("/");
    } else {
      setUserName(auth.user.name || "Admin");
      setUserEmail(auth.user.email || "");
      setUserAvatarUrl(auth.user.avatarUrl || null);
    }
  }, [router]);

  const handleOpenSettings = () => {
    setDropdownOpen(false);
    router.push('/settings');
  };

  const handleDeleteProfileImage = async () => {
    const auth = getAuthFromStorage();
    if (!auth?.user?.avatarUrl) return;

    try {
      setIsUploadingAvatar(true);
      const result = await deleteProfileImage();
      if (auth.token) {
        saveAuthToStorage(result.user, auth.token);
        window.dispatchEvent(new StorageEvent('storage', { key: 'elevate_spaces_auth' }));
      }
      setUserName(result.user.name || "Admin");
      setUserEmail(result.user.email || "");
      setUserAvatarUrl(result.user.avatarUrl || null);
      setDropdownOpen(false);
      showSuccess(result.message || "Profile image removed successfully");
    } catch (error: any) {
      showError(error?.message || "Failed to remove profile image");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleLogout = () => {
    clearAuthFromStorage();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <div className="min-h-screen bg-cream-50">
      {/* Brand header — mirrors the studio nav pattern */}
      <header className="bg-brand-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/admin/dashboard" className="flex items-center gap-2 shrink-0 select-none">
              <div className="w-8 h-8 rounded-md bg-brand-500 flex items-center justify-center">
                <HouseIcon className="text-white w-4 h-4" />
              </div>
              <span className="font-display font-bold text-base sm:text-lg text-white whitespace-nowrap">
                Elevate<span className="text-brand-500">Spaces</span>
                <span className="text-accent-400">.admin</span>
              </span>
            </Link>

            {/* Right menu */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-2.5 py-1 transition-colors"
                >
                  {userAvatarUrl ? (
                    <img
                      src={userAvatarUrl}
                      alt={userName}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <div className="w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <span className="hidden sm:inline text-sm font-medium max-w-32 truncate">{userName}</span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-cream-200 bg-white py-2 text-brand-900 shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-cream-100">
                      <p className="font-display font-bold truncate">{userName}</p>
                      <p className="text-xs text-cream-800/50 truncate">{userEmail}</p>
                    </div>
                    <button
                      onClick={handleOpenSettings}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-cream-800/80 hover:bg-cream-50 transition-colors disabled:opacity-60"
                    >
                      <Settings className="w-4 h-4 text-cream-800/50" />
                      Settings
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation tabs */}
          <nav className="flex items-center gap-1 -mb-px overflow-x-auto scrollbar-hide">
            <NavItem href="/admin/dashboard" icon={Home} label="Home" active={isActive('/admin/dashboard')} />
            <NavItem href="/admin/users" icon={Users} label="Users" active={isActive('/admin/users')} />
            <NavItem href="/admin/enterprise-plans" icon={Building2} label="Enterprise" active={isActive('/admin/enterprise-plans')} />
            <NavItem href="/admin/logs" icon={BarChart3} label="Analytics" active={isActive('/admin/logs')} />
            <NavItem href="/admin/photographer-approvals" icon={Camera} label="Photographers" active={isActive('/admin/photographer-approvals')} />
            <NavItem href="/admin/legal-pages" icon={FileText} label="Legal" active={isActive('/admin/legal-pages')} />
            <NavItem href="/admin/resources" icon={BookOpen} label="Resources" active={isActive('/admin/resources')} />
            <NavItem href="/" icon={ExternalLink} label="Website" active={false} />
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap shrink-0
        ${active
          ? 'text-white'
          : 'text-white/60 hover:text-white'
        }
      `}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="hidden sm:inline">{label}</span>
      <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 transition-opacity ${active ? 'opacity-100' : 'opacity-0'}`}></div>
    </Link>
  );
}
