'use client';
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { Home, Calendar, FileText, Camera, BarChart3, Users, Settings, Search, Bell, User } from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [userName, setUserName] = useState("Admin");

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || auth.user.role !== "ADMIN") {
      router.replace("/");
    } else {
      setUserName(auth.user.name || "Admin");
    }
  }, [router]);

  const isActive = (path: string) => pathname === path;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Booking.com-style Header */}
      <header className="bg-[#003580] text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <Link href="/admin/dashboard" className="text-2xl font-bold hover:opacity-90 transition-opacity">
                ElevateSpaces<span className="text-[#FEBB02]">.admin</span>
              </Link>
              
              {/* Search Bar */}
              <div className="hidden md:flex items-center bg-white/10 rounded-md px-3 py-1.5 w-80">
                <Search className="w-4 h-4 text-white/70 mr-2" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="bg-transparent border-none outline-none text-white placeholder-white/60 text-sm w-full"
                />
              </div>
            </div>

            {/* Right Menu */}
            <div className="flex items-center gap-4">
              <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1.5 hover:bg-white/20 transition-colors cursor-pointer">
                <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{userName}</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 -mb-px">
            <NavItem href="/admin/dashboard" icon={Home} label="Home" active={isActive('/admin/dashboard')} />
            <NavItem href="/admin/logs" icon={BarChart3} label="Analytics" active={isActive('/admin/logs')} />
            <NavItem href="/admin/photographer-approvals" icon={Camera} label="Photographers" active={isActive('/admin/photographer-approvals')} />
            <NavItem href="/" icon={FileText} label="Visit Website" active={false} />
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active: boolean }) {
  return (
    <Link 
      href={href}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
        ${active 
          ? 'text-white bg-white/10' 
          : 'text-white/80 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white"></div>}
    </Link>
  );
}
