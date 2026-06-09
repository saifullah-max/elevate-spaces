"use client";

import { useEffect, useMemo, useState } from "react";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { showError, showSuccess } from "@/components/toastUtils";
import { publishMarketplaceUpdate } from "@/lib/marketplace-updates";
import {
  createBookingRequest,
  getMyBookings,
  getPhotographerDirectory,
  getReceivedBookings,
  updateBookingStatus,
  withdrawBookingRequest,
  type BookingItem,
  type PhotographerDirectoryItem,
} from "@/services/photographer.service";
import { PhotographerApplicationWorkflow } from "@/components/photographer/PhotographerApplicationWorkflow";
import Link from "next/link";

type TabKey = "directory" | "onboarding" | "bookings";

export default function PhotographerPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("directory");
  const [isAuthed, setIsAuthed] = useState(false);
  const [authRole, setAuthRole] = useState<string>("");
  const [authUserId, setAuthUserId] = useState<string>("");

  const [directory, setDirectory] = useState<PhotographerDirectoryItem[]>([]);
  const [myBookings, setMyBookings] = useState<BookingItem[]>([]);
  const [receivedBookings, setReceivedBookings] = useState<BookingItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [bookingDateById, setBookingDateById] = useState<Record<string, string>>({});
  const [transactionIdById, setTransactionIdById] = useState<Record<string, string>>({});
  const [paymentConfirmedById, setPaymentConfirmedById] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const auth = getAuthFromStorage();
    setIsAuthed(Boolean(auth?.token));
    setAuthRole(auth?.user?.role || "");
    setAuthUserId(auth?.user?.id || "");
  }, []);

  const canSeeReceivedBookings = useMemo(() => authRole === "PHOTOGRAPHER" || authRole === "ADMIN", [authRole]);

  const loadDirectory = async () => {
    const data = await getPhotographerDirectory();
    setDirectory(data);
  };

  const loadBookings = async () => {
    const mine = await getMyBookings();
    setMyBookings(mine);

    if (canSeeReceivedBookings) {
      const received = await getReceivedBookings();
      setReceivedBookings(received);
    } else {
      setReceivedBookings([]);
    }
  };

  const loadAll = async () => {
    setLoading(true);
    try {
      await loadDirectory();
      if (isAuthed) {
        await loadBookings();
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load photographer marketplace");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, canSeeReceivedBookings]);

  const handleBookingRequest = async (photographerId: string) => {
    const date = bookingDateById[photographerId];
    if (!date) {
      showError("Choose a date for the booking request");
      return;
    }

    const paymentConfirmed = Boolean(paymentConfirmedById[photographerId]);
    const transactionId = (transactionIdById[photographerId] || "").trim();
    if (!paymentConfirmed) {
      showError("Confirm payment before submitting the request");
      return;
    }
    if (!transactionId) {
      showError("Add a transaction ID before submitting the request");
      return;
    }

    setLoading(true);
    try {
      await createBookingRequest({ photographerId, date, paymentConfirmed, transactionId });
      showSuccess("Booking request sent");
      await loadBookings();
      publishMarketplaceUpdate({ type: "booking-request-created", photographerId, clientUserId: authUserId });
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, status: "CONFIRMED" | "CANCELLED") => {
    setLoading(true);
    try {
      await updateBookingStatus(bookingId, status);
      showSuccess(`Booking ${status.toLowerCase()}`);
      await loadBookings();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update booking status");
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawBookingRequest = async (bookingId: string) => {
    setLoading(true);
    try {
      await withdrawBookingRequest(bookingId);
      showSuccess("Booking request withdrawn");
      await loadBookings();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to withdraw booking request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-slate-900">Photographer Marketplace</h1>
              <p className="mt-2 text-slate-600">
                Milestone 6 frontend: marketplace listings, photographer onboarding, admin review workflow, and booking placeholders.
              </p>
            </div>

            <Link
              href="/photographer/requests"
              className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              View incoming requests
            </Link>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto">
          {(["directory", "onboarding", "bookings"] as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-xl border px-4 py-2 text-sm font-bold ${
                activeTab === tab ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {tab === "directory" && "Directory"}
              {tab === "onboarding" && "Become a Photographer"}
              {tab === "bookings" && "Bookings"}
            </button>
          ))}
        </div>

        {activeTab === "directory" && (
          <section className="space-y-4">
            {directory.length === 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
                No approved photographers found yet.
              </div>
            )}

            {directory.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">{item.user.name || "Photographer"}</h3>
                    <p className="text-sm text-slate-500">{item.user.email}</p>
                    <p className="mt-3 text-slate-700">{item.bio || "No bio provided yet."}</p>
                    <p className="mt-2 text-sm text-slate-500">Availability: {item.availability || "Not set"}</p>
                  </div>

                  {isAuthed && (
                    <div className="w-full max-w-xs space-y-2">
                      <input
                        type="datetime-local"
                        value={bookingDateById[item.id] || ""}
                        onChange={(event) =>
                          setBookingDateById((previous) => ({ ...previous, [item.id]: event.target.value }))
                        }
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <label className="flex items-center gap-2 text-sm text-slate-700">
                        <input
                          type="checkbox"
                          checked={Boolean(paymentConfirmedById[item.id])}
                          onChange={(event) =>
                            setPaymentConfirmedById((previous) => ({ ...previous, [item.id]: event.target.checked }))
                          }
                        />
                        Payment completed
                      </label>
                      <input
                        type="text"
                        value={transactionIdById[item.id] || ""}
                        onChange={(event) =>
                          setTransactionIdById((previous) => ({ ...previous, [item.id]: event.target.value }))
                        }
                        placeholder="Transaction ID"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                      <button
                        onClick={() => handleBookingRequest(item.id)}
                        disabled={loading}
                        className="w-full rounded-lg bg-blue-600 px-3 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                      >
                        Request Booking
                      </button>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        )}

        {activeTab === "onboarding" && <PhotographerApplicationWorkflow />}

        {activeTab === "bookings" && (
          <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-black">My Booking Requests</h2>
              <div className="space-y-3">
                {myBookings.length === 0 && <p className="text-slate-500">No bookings found.</p>}
                {myBookings.map((booking) => (
                  <div key={booking.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                    <p className="font-semibold">{new Date(booking.date).toLocaleString()}</p>
                    <p className="text-sm text-slate-500">Status: {booking.status}</p>
                    {booking.status === "PENDING" && booking.user_id === authUserId ? (
                      <button
                        onClick={() => handleWithdrawBookingRequest(booking.id)}
                        disabled={loading}
                        className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-60"
                      >
                        Withdraw
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-xl font-black">Received Booking Requests</h2>
              {!canSeeReceivedBookings && <p className="text-slate-500">Become an approved photographer to manage received bookings.</p>}
              {canSeeReceivedBookings && (
                <div className="space-y-3">
                  {receivedBookings.length === 0 && <p className="text-slate-500">No received bookings.</p>}
                  {receivedBookings.map((booking) => (
                    <div key={booking.id} className="space-y-2 rounded-lg border border-slate-200 p-3">
                      <p className="font-semibold">{new Date(booking.date).toLocaleString()}</p>
                      <p className="text-sm text-slate-500">Status: {booking.status}</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, "CONFIRMED")}
                          disabled={loading}
                          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => handleUpdateBookingStatus(booking.id, "CANCELLED")}
                          disabled={loading}
                          className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
