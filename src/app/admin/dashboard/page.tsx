"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { BarChart3, Camera, FileText, Users, TrendingUp, CheckCircle, AlertCircle, Image } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [platformName] = useState("ElevateSpaces AI");

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || auth.user.role !== "ADMIN") {
      router.replace("/");
    } else {
      setChecked(true);
      setUserName(auth.user.name || "Admin");
    }
  }, [router]);

  if (!checked) return null;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 bg-linear-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome!</h1>
              <p className="text-slate-600">
                We're happy to have <span className="font-semibold">{userName}</span> as <span className="font-semibold">{platformName}</span> administrator.
              </p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 max-w-md">
            <h3 className="font-semibold text-amber-900 mb-1">Platform is live and operational</h3>
            <p className="text-sm text-amber-700">All systems running smoothly. Monitor activity in Analytics.</p>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Card 1 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xl font-bold mb-4">
              1
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Monitor Analytics</h3>
            <p className="text-sm text-slate-600 mb-6">
              Track platform usage, payments, and multi-image staging runs in real-time.
            </p>
            <Link 
              href="/admin/logs"
              className="inline-block w-full text-center px-4 py-2.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              View Analytics
            </Link>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xl font-bold mb-4">
              2
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Manage Photographers</h3>
            <p className="text-sm text-slate-600 mb-6">
              Review and approve photographer applications to maintain quality standards.
            </p>
            <Link 
              href="/admin/photographer-approvals"
              className="inline-block w-full text-center px-4 py-2.5 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors text-sm font-medium"
            >
              Review Approvals
            </Link>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6">
            <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center text-white text-xl font-bold mb-4">
              3
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Visit Website</h3>
            <p className="text-sm text-slate-600 mb-6">
              Experience the platform from a user perspective and test features.
            </p>
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('skipAdminRedirect', '1');
                  router.push("/");
                }
              }}
              className="w-full px-4 py-2.5 bg-[#0071c2] text-white rounded-md hover:bg-[#005999] transition-colors text-sm font-medium"
            >
              Go to website now!
            </button>
          </div>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Platform Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard 
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Users"
            value="View in Analytics"
            bgColor="bg-blue-50"
          />
          <StatCard 
            icon={<Image className="w-6 h-6 text-purple-600" />}
            label="Images Staged"
            value="View in Analytics"
            bgColor="bg-purple-50"
          />
          <StatCard 
            icon={<TrendingUp className="w-6 h-6 text-green-600" />}
            label="Total Revenue"
            value="View in Analytics"
            bgColor="bg-green-50"
          />
          <StatCard 
            icon={<Camera className="w-6 h-6 text-orange-600" />}
            label="Active Photographers"
            value="View Approvals"
            bgColor="bg-orange-50"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mt-6">
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-slate-600" />
          Quick Actions
        </h3>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <Link href="/admin/logs" className="text-blue-600 hover:underline">
              View system logs and analytics
            </Link>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <Link href="/admin/photographer-approvals" className="text-blue-600 hover:underline">
              Review pending photographer approvals
            </Link>
          </li>
          <li className="flex items-center gap-2 text-slate-700">
            <CheckCircle className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600">Monitor payment transactions and user credits</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bgColor }: { icon: React.ReactNode; label: string; value: string; bgColor: string }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-lg border border-slate-100">
      <div className={`w-12 h-12 ${bgColor} rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-500 font-medium">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value}</p>
      </div>
    </div>
  );
}
