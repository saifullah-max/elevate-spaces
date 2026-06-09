"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import { showError, showSuccess } from "@/components/toastUtils";
import { publishMarketplaceUpdate, subscribeMarketplaceUpdates } from "@/lib/marketplace-updates";
import {
  getReceivedBookings,
  updateBookingStatus,
  type BookingItem,
} from "@/services/photographer.service";
import { MoreVertical } from "lucide-react";

export default function PhotographerRequestsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [requests, setRequests] = useState<BookingItem[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showDeclinedOnly, setShowDeclinedOnly] = useState(false);
  const [photographerNotesByBookingId, setPhotographerNotesByBookingId] = useState<Record<string, string>>({});

  const loadRequests = async () => {
    setLoading(true);
    try {
      const data = await getReceivedBookings();
      setRequests(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load booking requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth?.user || !hasRole(auth.user.role, "PHOTOGRAPHER")) {
      router.replace("/");
      return;
    }

    setChecked(true);
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    void loadRequests();
  }, [checked]);

  useEffect(() => {
    if (!checked) return;

    return subscribeMarketplaceUpdates((event) => {
      if (event.type === "booking-request-created" || event.type === "booking-request-updated") {
        void loadRequests();
      }
    });
  }, [checked]);

  const visibleRequests = useMemo(
    () =>
      showDeclinedOnly
        ? requests.filter((request) => request.status === "CANCELLED")
        : requests.filter((request) => request.status !== "CANCELLED"),
    [requests, showDeclinedOnly]
  );

  const totalVisibleCount = useMemo(() => visibleRequests.length, [visibleRequests]);
  const pendingVisibleCount = useMemo(
    () => visibleRequests.filter((request) => request.status === "PENDING").length,
    [visibleRequests]
  );

  const handleUpdateBookingStatus = async (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    setLoading(true);
    try {
      const rawNote = (photographerNotesByBookingId[bookingId] || "").trim();
      const photographerNoteHtml = rawNote ? `<p>${rawNote.replace(/\n/g, "<br/>")}</p>` : "";

      await updateBookingStatus(bookingId, status, photographerNoteHtml);
      showSuccess(`Request ${status.toLowerCase()}`);
      setPhotographerNotesByBookingId((previous) => ({ ...previous, [bookingId]: "" }));
      await loadRequests();
      publishMarketplaceUpdate({ type: "booking-request-updated" });
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update booking request");
    } finally {
      setLoading(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Link href="/photographer" className="text-sm font-semibold text-indigo-600 hover:underline">
                Back to photographer dashboard
              </Link>
              <h1 className="mt-2 text-3xl font-black text-slate-900">Incoming hire requests</h1>
              <p className="mt-2 text-slate-600">
                See who wants to hire you, review the requested date, and accept or decline each request.
              </p>
            </div>

            <div className="relative">
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMenuOpen((previous) => !previous)}
                  className="rounded-md border border-slate-300 bg-white p-2 text-slate-700 hover:bg-slate-50"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {menuOpen && (
                <div className="absolute right-0 top-10 z-20 min-w-52 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeclinedOnly(true);
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    View declined requests
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeclinedOnly(false);
                      setMenuOpen(false);
                    }}
                    className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    View active requests
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 sm:min-w-72">
                <StatCard label="Total requests" value={totalVisibleCount} />
                <StatCard label="Pending" value={pendingVisibleCount} />
              </div>
            </div>
          </div>
        </div>

        {loading && visibleRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Loading requests...
          </div>
        ) : null}

        {!loading && visibleRequests.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            {showDeclinedOnly
              ? "No declined requests found."
              : "No active hire requests right now."}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4">
          {visibleRequests.map((request) => {
            const bookingDate = new Date(request.date);
            const bookingDateLabel = bookingDate.toLocaleDateString();
            const bookingDayLabel = bookingDate.toLocaleDateString(undefined, { weekday: "long" });
            const bookingTimeLabel = bookingDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
            const declinedAt = request.status_updated_at ? new Date(request.status_updated_at) : null;

            return (
              <article key={request.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {request.user?.name || request.user?.email || "Client"}
                      </h2>
                      <p className="text-sm text-slate-500">{request.user?.email || "No email available"}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-5">
                      <Info label="Client name" value={request.user?.name || "Not provided"} />
                      <Info label="Booking date" value={bookingDateLabel} />
                      <Info label="Day" value={bookingDayLabel} />
                      <Info label="Time" value={bookingTimeLabel} />
                      <Info label="Status" value={request.status.toLowerCase()} />
                    </div>

                    {request.status === "CANCELLED" ? (
                      <div className="grid gap-3 sm:grid-cols-4">
                        <Info label="Declined by" value={(request.cancelled_by || "UNKNOWN").toLowerCase()} />
                        <Info label="Declined date" value={declinedAt ? declinedAt.toLocaleDateString() : "-"} />
                        <Info label="Declined day" value={declinedAt ? declinedAt.toLocaleDateString(undefined, { weekday: "long" }) : "-"} />
                        <Info label="Declined time" value={declinedAt ? declinedAt.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" }) : "-"} />
                      </div>
                    ) : null}

                    {request.client_note_html ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Client note</p>
                        <div className="mt-2 text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: request.client_note_html }} />
                      </div>
                    ) : null}

                    {request.photographer_note_html ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Your feedback</p>
                        <div className="mt-2 text-sm text-slate-800" dangerouslySetInnerHTML={{ __html: request.photographer_note_html }} />
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {request.status === "PENDING" ? (
                      <div className="space-y-2">
                        <textarea
                          value={photographerNotesByBookingId[request.id] || ""}
                          onChange={(event) =>
                            setPhotographerNotesByBookingId((previous) => ({
                              ...previous,
                              [request.id]: event.target.value,
                            }))
                          }
                          placeholder="Optional note/feedback for client"
                          className="min-h-24 w-72 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />

                        <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(request.id, "CONFIRMED")}
                          disabled={loading}
                          className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateBookingStatus(request.id, "CANCELLED")}
                          disabled={loading}
                          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          Decline
                        </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="text-2xl font-black text-slate-900">{value}</p>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}