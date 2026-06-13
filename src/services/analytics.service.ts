import axios from "axios";
import { getAuthHeaders } from "@/helpers/auth.helpers";

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_API;

function requireApiBase(): string {
  if (!API_BASE_URL) throw new Error("Backend API URL is not configured");
  return API_BASE_URL;
}

export interface AnalyticsOverview {
  range: { days: number; since: string; now: string };
  totals: {
    totalPageViews: number;
    totalPageViewsPrev: number;
    uniqueVisitors: number;
    activeUsers: number;
    totalUsers: number;
    signups: number;
    signupsPrev: number;
    conversionRate: number;
    conversionRatePrev: number;
    revenue: number;
    revenuePrev: number;
  };
  photographers: { total: number; approved: number; pending: number; rejected: number };
  bookings: { total: number; pending: number; confirmed: number; cancelled: number };
  dailySeries: Array<{ date: string; pageViews: number; signups: number }>;
  deviceBreakdown: Record<string, number>;
  topReferrers: Array<{ source: string; count: number }>;
  topCities: Array<{ location: string; visitors: number }>;
  funnel: Array<{ label: string; value: number }>;
}

export async function getAnalyticsOverview(range: "7d" | "30d" | "90d"): Promise<AnalyticsOverview> {
  const response = await axios.get<{ success: boolean; data: AnalyticsOverview }>(
    `${requireApiBase()}/analytics/admin/overview`,
    { params: { range }, headers: getAuthHeaders() }
  );
  return response.data.data;
}
