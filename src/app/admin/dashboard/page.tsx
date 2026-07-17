"use client";
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import {
  BarChart3,
  Camera,
  FileText,
  Users,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  RefreshCw,
  Image as ImageIcon,
  Eye,
  UserPlus,
  Smartphone,
  Monitor,
  Tablet,
  Globe,
  MapPin,
  Target,
} from "lucide-react";
import Link from "next/link";
import { getAnalyticsOverview, type AnalyticsOverview } from "@/services/analytics.service";
import { showError } from "@/components/toastUtils";

type Range = "7d" | "30d" | "90d";

const RANGE_LABELS: Record<Range, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
};

function pctChange(current: number, prev: number): number {
  if (prev === 0) return current === 0 ? 0 : 100;
  return ((current - prev) / prev) * 100;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatPercent(value: number, digits = 2): string {
  return `${value.toFixed(digits)}%`;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const [range, setRange] = useState<Range>("30d");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AnalyticsOverview | null>(null);

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || !hasRole(auth.user.role, "ADMIN")) {
      router.replace("/");
      return;
    }
    setChecked(true);
    setUserName(auth.user.name || "Admin");
  }, [router]);

  const loadData = async (selected: Range) => {
    setLoading(true);
    try {
      const result = await getAnalyticsOverview(selected);
      setData(result);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!checked) return;
    void loadData(range);
  }, [checked, range]);

  if (!checked) return null;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">Analytics overview</p>
            <h1 className="mt-1 font-display text-3xl font-bold text-brand-900">Welcome back, {userName}</h1>
            <p className="mt-1 text-sm text-cream-800/70">Key metrics across visitors, signups, and revenue.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-xl border border-cream-200 bg-cream-50 p-1">
              {(Object.keys(RANGE_LABELS) as Range[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setRange(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    range === option ? "bg-white text-brand-900 shadow-sm" : "text-cream-800/70 hover:text-brand-900"
                  }`}
                >
                  {RANGE_LABELS[option]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => void loadData(range)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm font-semibold text-cream-800/80 hover:bg-cream-50 disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <KpiGrid data={data} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <TrendChartCard data={data} />
          <FunnelCard data={data} />
        </div>
        <div className="space-y-6">
          <DeviceCard data={data} />
          <CitiesCard data={data} />
          <ReferrerCard data={data} />
          <CommunityCard data={data} />
        </div>
      </div>

      <QuickActions />
    </div>
  );
}

function KpiGrid({ data, loading }: { data: AnalyticsOverview | null; loading: boolean }) {
  const totals = data?.totals;
  const items: Array<{
    label: string;
    value: string;
    delta: number;
    icon: React.ReactNode;
    iconBg: string;
  }> = useMemo(
    () => [
      {
        label: "Unique visitors",
        value: formatNumber(totals?.uniqueVisitors || 0),
        delta: pctChange(totals?.uniqueVisitors || 0, totals?.totalPageViewsPrev ? Math.max(1, Math.round((totals.totalPageViewsPrev * (totals.uniqueVisitors / Math.max(totals.totalPageViews, 1))))) : 0),
        icon: <Eye className="h-5 w-5 text-brand-500" />,
        iconBg: "bg-brand-50",
      },
      {
        label: "Page views",
        value: formatNumber(totals?.totalPageViews || 0),
        delta: pctChange(totals?.totalPageViews || 0, totals?.totalPageViewsPrev || 0),
        icon: <BarChart3 className="h-5 w-5 text-blue-600" />,
        iconBg: "bg-blue-50",
      },
      {
        label: "Signups",
        value: formatNumber(totals?.signups || 0),
        delta: pctChange(totals?.signups || 0, totals?.signupsPrev || 0),
        icon: <UserPlus className="h-5 w-5 text-emerald-600" />,
        iconBg: "bg-emerald-50",
      },
      {
        label: "Conversion rate",
        value: formatPercent((totals?.conversionRate || 0) * 100),
        delta: pctChange((totals?.conversionRate || 0) * 100, (totals?.conversionRatePrev || 0) * 100),
        icon: <Target className="h-5 w-5 text-amber-600" />,
        iconBg: "bg-amber-50",
      },
      {
        label: "Revenue",
        value: formatCurrency(totals?.revenue || 0),
        delta: pctChange(totals?.revenue || 0, totals?.revenuePrev || 0),
        icon: <TrendingUp className="h-5 w-5 text-rose-600" />,
        iconBg: "bg-rose-50",
      },
      {
        label: "Active users",
        value: formatNumber(totals?.activeUsers || 0),
        delta: 0,
        icon: <Users className="h-5 w-5 text-accent-600" />,
        iconBg: "bg-accent-500/10",
      },
    ],
    [totals]
  );

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
          <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${item.iconBg}`}>{item.icon}</div>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-cream-800/50">{item.label}</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">{loading && !data ? "—" : item.value}</p>
          {item.delta !== 0 ? (
            <p className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold ${item.delta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {item.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {formatPercent(Math.abs(item.delta), 1)} vs prev
            </p>
          ) : (
            <p className="mt-1 text-xs text-cream-800/40">in window</p>
          )}
        </div>
      ))}
    </div>
  );
}

function TrendChartCard({ data }: { data: AnalyticsOverview | null }) {
  const series = data?.dailySeries || [];
  const maxValue = useMemo(() => Math.max(1, ...series.map((point) => Math.max(point.pageViews, point.signups))), [series]);
  const width = 720;
  const height = 240;
  const padding = { top: 16, right: 16, bottom: 28, left: 36 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const pointToX = (index: number) => {
    if (series.length <= 1) return padding.left;
    return padding.left + (index / (series.length - 1)) * innerWidth;
  };
  const valueToY = (value: number) => padding.top + innerHeight - (value / maxValue) * innerHeight;

  const pageViewsPath = series.map((point, index) => `${index === 0 ? "M" : "L"} ${pointToX(index)} ${valueToY(point.pageViews)}`).join(" ");
  const signupsPath = series.map((point, index) => `${index === 0 ? "M" : "L"} ${pointToX(index)} ${valueToY(point.signups)}`).join(" ");
  const pageViewsArea = `${pageViewsPath} L ${pointToX(series.length - 1)} ${padding.top + innerHeight} L ${pointToX(0)} ${padding.top + innerHeight} Z`;

  const firstDate = series[0]?.date;
  const lastDate = series[series.length - 1]?.date;

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Visitors vs signups</h2>
          <p className="text-sm text-cream-800/50">Daily page views and new signups across the selected window.</p>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-2 text-cream-800/70">
            <span className="h-2 w-2 rounded-full bg-brand-500" /> Page views
          </span>
          <span className="inline-flex items-center gap-2 text-cream-800/70">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Signups
          </span>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {series.length === 0 ? (
          <div className="flex h-60 items-center justify-center text-sm text-cream-800/40">No data yet for this window.</div>
        ) : (
          <svg viewBox={`0 0 ${width} ${height}`} className="block min-w-[480px]">
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <line
                key={tick}
                x1={padding.left}
                x2={padding.left + innerWidth}
                y1={padding.top + innerHeight * tick}
                y2={padding.top + innerHeight * tick}
                stroke="#e2e8f0"
                strokeWidth={1}
              />
            ))}
            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
              <text
                key={`l-${tick}`}
                x={padding.left - 6}
                y={padding.top + innerHeight * tick + 4}
                textAnchor="end"
                className="fill-current text-cream-800/40 text-[10px]"
              >
                {Math.round(maxValue * (1 - tick))}
              </text>
            ))}
            <path d={pageViewsArea} fill="rgba(99, 102, 241, 0.12)" stroke="none" />
            <path d={pageViewsPath} fill="none" stroke="#6366f1" strokeWidth={2.5} />
            <path d={signupsPath} fill="none" stroke="#10b981" strokeWidth={2.5} strokeDasharray="4 4" />
            {firstDate ? (
              <text x={padding.left} y={height - 6} className="fill-current text-cream-800/40 text-[10px]">
                {firstDate}
              </text>
            ) : null}
            {lastDate ? (
              <text x={padding.left + innerWidth} y={height - 6} textAnchor="end" className="fill-current text-cream-800/40 text-[10px]">
                {lastDate}
              </text>
            ) : null}
          </svg>
        )}
      </div>
    </div>
  );
}

function FunnelCard({ data }: { data: AnalyticsOverview | null }) {
  const steps = data?.funnel || [];
  const maxValue = steps[0]?.value || 1;
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-brand-900">Conversion funnel</h2>
          <p className="text-sm text-cream-800/50">From anonymous visit through to a paid booking.</p>
        </div>
        <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">In window</span>
      </div>

      <div className="mt-4 space-y-3">
        {steps.length === 0 ? (
          <p className="text-sm text-cream-800/40">No funnel data yet.</p>
        ) : (
          steps.map((step, index) => {
            const widthPct = Math.max(6, (step.value / Math.max(maxValue, 1)) * 100);
            const prev = steps[index - 1]?.value || 0;
            const dropoff = index > 0 && prev > 0 ? ((prev - step.value) / prev) * 100 : 0;
            return (
              <div key={step.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-semibold text-cream-800/80">{step.label}</span>
                  <span className="font-bold text-brand-900">{formatNumber(step.value)}</span>
                </div>
                <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-cream-100">
                  <div
                    className="h-3 rounded-full bg-linear-to-r from-brand-500 to-accent-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
                {index > 0 ? (
                  <p className={`mt-1 text-[11px] font-semibold ${dropoff > 50 ? "text-rose-500" : "text-cream-800/50"}`}>
                    {dropoff > 0 ? `Dropoff ${formatPercent(dropoff, 1)}` : "No dropoff"}
                  </p>
                ) : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function DeviceCard({ data }: { data: AnalyticsOverview | null }) {
  const breakdown = data?.deviceBreakdown || { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
  const entries = [
    { key: "desktop", label: "Desktop", icon: <Monitor className="h-4 w-4" />, color: "text-brand-500 bg-brand-50" },
    { key: "mobile", label: "Mobile", icon: <Smartphone className="h-4 w-4" />, color: "text-emerald-600 bg-emerald-50" },
    { key: "tablet", label: "Tablet", icon: <Tablet className="h-4 w-4" />, color: "text-amber-600 bg-amber-50" },
    { key: "unknown", label: "Other", icon: <Globe className="h-4 w-4" />, color: "text-cream-800/70 bg-cream-100" },
  ];
  const total = entries.reduce((acc, entry) => acc + (breakdown[entry.key] || 0), 0);

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-900">Devices</h2>
      <p className="text-sm text-cream-800/50">Where visitors came from.</p>
      <div className="mt-4 space-y-3">
        {entries.map((entry) => {
          const value = breakdown[entry.key] || 0;
          const pct = total > 0 ? (value / total) * 100 : 0;
          return (
            <div key={entry.key}>
              <div className="flex items-center justify-between text-sm">
                <span className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold ${entry.color}`}>
                  {entry.icon} {entry.label}
                </span>
                <span className="font-bold text-brand-900">{formatNumber(value)}</span>
              </div>
              <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-100">
                <div className="h-2 rounded-full bg-brand-900" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-cream-800/50">{formatPercent(pct, 1)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CitiesCard({ data }: { data: AnalyticsOverview | null }) {
  const cities = data?.topCities || [];
  const max = cities[0]?.visitors || 0;
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-brand-900">
            <MapPin className="h-4 w-4 text-rose-600" /> Top cities
          </h2>
          <p className="text-sm text-cream-800/50">Where most of your visitors are.</p>
        </div>
        <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">Top 5</span>
      </div>
      <div className="mt-4 space-y-2">
        {cities.length === 0 ? (
          <p className="text-sm text-cream-800/40">No location data yet — usually takes a few visits to populate.</p>
        ) : (
          cities.map((row, index) => {
            const pct = max > 0 ? (row.visitors / max) * 100 : 0;
            return (
              <div key={row.location}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="flex min-w-0 items-center gap-2 text-cream-800/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-cream-100 text-[10px] font-bold text-cream-800/70">
                      {index + 1}
                    </span>
                    <span className="truncate">{row.location}</span>
                  </span>
                  <span className="ml-3 font-bold text-brand-900">{formatNumber(row.visitors)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-100">
                  <div className="h-2 rounded-full bg-linear-to-r from-rose-500 to-amber-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function ReferrerCard({ data }: { data: AnalyticsOverview | null }) {
  const referrers = data?.topReferrers || [];
  const max = referrers[0]?.count || 0;
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-900">Top referrers</h2>
      <p className="text-sm text-cream-800/50">Sources sending traffic.</p>
      <div className="mt-4 space-y-2">
        {referrers.length === 0 ? (
          <p className="text-sm text-cream-800/40">No referrer data yet.</p>
        ) : (
          referrers.map((row) => {
            let label = row.source;
            try {
              const url = new URL(row.source);
              label = url.hostname.replace(/^www\./, "");
            } catch {
              // not a URL
            }
            const pct = max > 0 ? (row.count / max) * 100 : 0;
            return (
              <div key={row.source}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="truncate text-cream-800/80">{label || "Direct"}</span>
                  <span className="ml-3 font-bold text-brand-900">{formatNumber(row.count)}</span>
                </div>
                <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-cream-100">
                  <div className="h-2 rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function CommunityCard({ data }: { data: AnalyticsOverview | null }) {
  const photographers = data?.photographers || { total: 0, approved: 0, pending: 0, rejected: 0 };
  const bookings = data?.bookings || { total: 0, pending: 0, confirmed: 0, cancelled: 0 };
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-brand-900">Community</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <MiniStat icon={<Camera className="h-4 w-4 text-emerald-600" />} label="Approved photographers" value={photographers.approved} />
        <MiniStat icon={<Camera className="h-4 w-4 text-amber-600" />} label="Pending photographers" value={photographers.pending} />
        <MiniStat icon={<CheckCircle className="h-4 w-4 text-blue-600" />} label="Confirmed bookings" value={bookings.confirmed} />
        <MiniStat icon={<ImageIcon className="h-4 w-4 text-cream-800/70" />} label="Total bookings" value={bookings.total} />
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-cream-100 bg-cream-50 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-cream-800/70">
        {icon} {label}
      </div>
      <p className="mt-1 text-xl font-bold text-brand-900">{formatNumber(value)}</p>
    </div>
  );
}

function QuickActions() {
  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
      <h3 className="flex items-center gap-2 text-lg font-bold text-brand-900">
        <FileText className="h-5 w-5 text-cream-800/70" /> Quick actions
      </h3>
      <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <li>
          <Link href="/admin/users" className="flex items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm text-cream-800/80 hover:bg-cream-50">
            <CheckCircle className="h-4 w-4 text-blue-600" /> Manage users and pending deletions
          </Link>
        </li>
        <li>
          <Link href="/admin/photographer-approvals" className="flex items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm text-cream-800/80 hover:bg-cream-50">
            <CheckCircle className="h-4 w-4 text-blue-600" /> Review photographer applications
          </Link>
        </li>
        <li>
          <Link href="/admin/logs" className="flex items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm text-cream-800/80 hover:bg-cream-50">
            <CheckCircle className="h-4 w-4 text-blue-600" /> System logs and analytics history
          </Link>
        </li>
        <li>
          <Link href="/admin/legal-pages" className="flex items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm text-cream-800/80 hover:bg-cream-50">
            <CheckCircle className="h-4 w-4 text-blue-600" /> Edit legal pages and policies
          </Link>
        </li>
      </ul>
    </div>
  );
}
