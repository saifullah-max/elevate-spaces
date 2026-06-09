"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, CheckSquare, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { showError, showSuccess } from "@/components/toastUtils";
import { publishMarketplaceUpdate, subscribeMarketplaceUpdates } from "@/lib/marketplace-updates";
import {
  getMyBookings,
  getPhotographerDirectory,
  withdrawBookingRequest,
  type BookingItem,
  type PhotographerDirectoryItem,
} from "@/services/photographer.service";

type HireTabKey = "directory" | "requests";
type SortKey = "best-match" | "price-low" | "price-high";

const FILTER_OPTIONS = ["Wedding", "Events", "Portrait", "Drone", "Real estate", "Product"];

function normalizeServiceAreas(profile: PhotographerDirectoryItem): string[] {
  if (Array.isArray(profile.service_areas) && profile.service_areas.length > 0) {
    return profile.service_areas.map((entry) => String(entry || "").trim()).filter(Boolean);
  }
  return profile.service_area ? [profile.service_area] : [];
}

function normalizeKeywords(profile: PhotographerDirectoryItem): string[] {
  return (profile.service_keywords || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export default function HirePhotographerPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<HireTabKey>("directory");
  const [loading, setLoading] = useState(false);
  const [withdrawingBookingId, setWithdrawingBookingId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [photographers, setPhotographers] = useState<PhotographerDirectoryItem[]>([]);
  const [myRequests, setMyRequests] = useState<BookingItem[]>([]);

  const [locationQuery, setLocationQuery] = useState("");
  const [availabilityQuery, setAvailabilityQuery] = useState("");
  const [keywordQuery, setKeywordQuery] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortKey>("best-match");

  const loadDirectory = async () => {
    const rows = await getPhotographerDirectory();
    setPhotographers(rows);
  };

  const loadMyRequests = async () => {
    const myBookings = await getMyBookings();
    setMyRequests(myBookings);
  };

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth?.token) {
      router.replace("/sign-in?redirect=/hire-photographer");
      return;
    }
    setCurrentUserId(auth.user?.id || "");
    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;

    const loadPageData = async () => {
      setLoading(true);
      try {
        await Promise.all([loadDirectory(), loadMyRequests()]);
      } catch (error) {
        showError(error instanceof Error ? error.message : "Failed to load hire photographer data");
      } finally {
        setLoading(false);
      }
    };

    void loadPageData();
  }, [checked]);

  useEffect(() => {
    if (!checked || !currentUserId) return;

    return subscribeMarketplaceUpdates((event) => {
      if (event.type === "photographer-approved") {
        void loadDirectory();
        return;
      }

      if ((event.type === "booking-request-created" || event.type === "booking-request-updated") && event.clientUserId === currentUserId) {
        void loadMyRequests();
      }
    });
  }, [checked, currentUserId]);

  const filteredPhotographers = useMemo(() => {
    const location = locationQuery.trim().toLowerCase();
    const availability = availabilityQuery.trim().toLowerCase();
    const keyword = keywordQuery.trim().toLowerCase();

    const rows = photographers.filter((photographer) => {
      const serviceAreas = normalizeServiceAreas(photographer).map((entry) => entry.toLowerCase());
      const profileKeywords = normalizeKeywords(photographer);
      const type = (photographer.photographer_type || "").toLowerCase();

      const locationMatch =
        !location || serviceAreas.some((entry) => entry.includes(location)) || type.includes(location);
      const availabilityMatch =
        !availability || (photographer.availability || "").toLowerCase().includes(availability);
      const keywordMatch =
        !keyword ||
        profileKeywords.some((entry) => entry.includes(keyword)) ||
        (photographer.short_pitch || "").toLowerCase().includes(keyword) ||
        (photographer.bio || "").toLowerCase().includes(keyword);
      const filterMatch =
        selectedFilters.length === 0 || selectedFilters.some((filter) => type.includes(filter.toLowerCase()));

      return locationMatch && availabilityMatch && keywordMatch && filterMatch;
    });

    if (sortBy === "price-low") {
      return rows.slice().sort((a, b) => (a.price_min ?? Number.MAX_SAFE_INTEGER) - (b.price_min ?? Number.MAX_SAFE_INTEGER));
    }

    if (sortBy === "price-high") {
      return rows.slice().sort((a, b) => (b.price_max ?? 0) - (a.price_max ?? 0));
    }

    return rows
      .slice()
      .sort((a, b) => (normalizeKeywords(b).length + (b.short_pitch ? 1 : 0)) - (normalizeKeywords(a).length + (a.short_pitch ? 1 : 0)));
  }, [photographers, locationQuery, availabilityQuery, keywordQuery, selectedFilters, sortBy]);

  const handleWithdrawRequest = async (bookingId: string) => {
    setWithdrawingBookingId(bookingId);
    try {
      await withdrawBookingRequest(bookingId);
      showSuccess("Booking request withdrawn");
      await loadMyRequests();
      publishMarketplaceUpdate({ type: "booking-request-updated", clientUserId: currentUserId });
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to withdraw booking request");
    } finally {
      setWithdrawingBookingId(null);
    }
  };

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-3xl font-black text-slate-900">Find your perfect photographer</h1>
          <p className="mt-2 text-slate-600">Search by location, availability, and specialty keywords, then request booking from profile.</p>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {(["directory", "requests"] as HireTabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                activeTab === tab ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {tab === "directory" ? "Marketplace" : "My Requests"}
            </button>
          ))}
        </div>

        {activeTab === "directory" && (
          <section className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
            <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <SlidersHorizontal className="h-4 w-4" /> Filters
              </div>

              <div className="space-y-3">
                <label className="grid gap-1 text-sm text-slate-700">
                  <span className="font-medium">City / zip / area</span>
                  <div className="relative">
                    <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input value={locationQuery} onChange={(event) => setLocationQuery(event.target.value)} className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3" placeholder="e.g. NYC or 10001" />
                  </div>
                </label>

                <label className="grid gap-1 text-sm text-slate-700">
                  <span className="font-medium">Availability</span>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input value={availabilityQuery} onChange={(event) => setAvailabilityQuery(event.target.value)} className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3" placeholder="weekends, tomorrow" />
                  </div>
                </label>

                <label className="grid gap-1 text-sm text-slate-700">
                  <span className="font-medium">Keyword match</span>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input value={keywordQuery} onChange={(event) => setKeywordQuery(event.target.value)} className="w-full rounded-xl border border-slate-300 py-2 pl-9 pr-3" placeholder="drone, wedding, branding" />
                  </div>
                </label>

                <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Service type</p>
                  {FILTER_OPTIONS.map((option) => {
                    const checked = selectedFilters.includes(option);
                    return (
                      <label key={option} className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedFilters((previous) => {
                              if (event.target.checked) return [...previous, option];
                              return previous.filter((entry) => entry !== option);
                            });
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>

                <label className="grid gap-1 text-sm text-slate-700">
                  <span className="font-medium">Sort by</span>
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value as SortKey)} className="rounded-xl border border-slate-300 px-3 py-2">
                    <option value="best-match">Best match</option>
                    <option value="price-low">Price: low to high</option>
                    <option value="price-high">Price: high to low</option>
                  </select>
                </label>
              </div>
            </aside>

            <div className="space-y-4">
              {loading && <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading photographers...</div>}
              {!loading && filteredPhotographers.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">No photographers match your current filters.</div>
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredPhotographers.map((photographer) => {
                  const serviceAreas = normalizeServiceAreas(photographer);
                  const keywords = normalizeKeywords(photographer);
                  return (
                    <article key={photographer.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                      <div className="space-y-2">
                        <h2 className="text-xl font-bold text-slate-900">{photographer.user.name || "Photographer"}</h2>
                        <p className="text-sm text-slate-500">{photographer.user.email}</p>
                        <p className="text-sm text-slate-700"><span className="font-semibold">Type:</span> {photographer.photographer_type || "-"}</p>
                        <p className="text-sm text-slate-700"><span className="font-semibold">Areas:</span> {serviceAreas.length ? serviceAreas.join(", ") : "-"}</p>
                        <p className="text-sm text-slate-700"><span className="font-semibold">Availability:</span> {photographer.availability || "-"}</p>
                        <p className="text-sm text-slate-700"><span className="font-semibold">Price:</span> {photographer.price_min || photographer.price_max ? `$${photographer.price_min || "-"} - $${photographer.price_max || "-"}` : "Contact for quote"}</p>
                        <p className="text-sm text-slate-700 line-clamp-3">{photographer.short_pitch || photographer.bio || "No description yet."}</p>
                        {keywords.length > 0 ? (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {keywords.slice(0, 5).map((keyword) => (
                              <span key={keyword} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{keyword}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link href={`/hire-photographer/${photographer.id}`} className="inline-flex rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                          View details
                        </Link>
                        <Link href={`/messages?peerId=${photographer.user.id}`} className="inline-flex rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100">
                          Chat
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {activeTab === "requests" && (
          <section className="space-y-4">
            {myRequests.length === 0 && !loading && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">You have not made any booking requests yet.</div>
            )}

            {myRequests.map((request) => {
              const isPending = request.status === "PENDING";
              const isCancelled = request.status === "CANCELLED";
              const declinedAt = request.status_updated_at ? new Date(request.status_updated_at) : null;
              return (
                <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <h2 className="text-xl font-bold text-slate-900">{request.photographer?.user?.name || "Photographer"}</h2>
                      <p className="text-sm text-slate-500">{request.photographer?.user?.email || "No email available"}</p>
                      <p className="text-sm text-slate-700"><span className="font-semibold">Requested at:</span> {new Date(request.date).toLocaleString()}</p>
                      <p className="text-sm text-slate-700"><span className="font-semibold">Status:</span> {request.status.toLowerCase()}</p>

                      {isCancelled ? (
                        <>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Declined by:</span> {request.cancelled_by ? request.cancelled_by.toLowerCase() : "unknown"}</p>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Declined date:</span> {declinedAt ? declinedAt.toLocaleDateString() : "-"}</p>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Declined day:</span> {declinedAt ? declinedAt.toLocaleDateString(undefined, { weekday: "long" }) : "-"}</p>
                          <p className="text-sm text-slate-700"><span className="font-semibold">Declined time:</span> {declinedAt ? declinedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "-"}</p>
                        </>
                      ) : null}

                      {request.client_note_html ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your note</p>
                          <div className="mt-2 text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: request.client_note_html }} />
                        </div>
                      ) : null}

                      {request.photographer_note_html ? (
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Photographer feedback</p>
                          <div className="mt-2 text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: request.photographer_note_html }} />
                        </div>
                      ) : null}
                    </div>

                    {isPending ? (
                      <button
                        type="button"
                        onClick={() => handleWithdrawRequest(request.id)}
                        disabled={withdrawingBookingId === request.id}
                        className="rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                      >
                        {withdrawingBookingId === request.id ? "Withdrawing..." : "Withdraw"}
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
