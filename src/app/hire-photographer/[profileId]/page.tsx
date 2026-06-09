"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { BadgeCheck, Bold, CalendarDays, ExternalLink as ExternalLinkIcon, FileText, Hash, Italic, List, ListOrdered, MapPin, MessageCircle, Paperclip, PhoneCall, Trash2 } from "lucide-react";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { showError, showSuccess } from "@/components/toastUtils";
import { publishMarketplaceUpdate } from "@/lib/marketplace-updates";
import {
  createBookingRequest,
  getPhotographerDirectoryItemById,
  type PhotographerDirectoryItem,
} from "@/services/photographer.service";

type ClientAttachment = {
  name: string;
  type: string;
  dataUrl: string;
};

async function fileToAttachment(file: File): Promise<ClientAttachment> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  return {
    name: file.name,
    type: file.type || "application/octet-stream",
    dataUrl,
  };
}

export default function HirePhotographerDetailPage() {
  const params = useParams<{ profileId: string }>();
  const router = useRouter();
  const profileId = useMemo(() => String(params?.profileId || ""), [params]);

  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [transactionId, setTransactionId] = useState("");
  const [profile, setProfile] = useState<PhotographerDirectoryItem | null>(null);
  const [clientAttachments, setClientAttachments] = useState<ClientAttachment[]>([]);
  const [currentUserId, setCurrentUserId] = useState("");

  const editor = useEditor({
    extensions: [StarterKit],
    content: "<p></p>",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "min-h-32 rounded-b-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none",
      },
    },
  });

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth?.token) {
      router.replace(`/sign-in?redirect=/hire-photographer/${profileId}`);
      return;
    }
    setCurrentUserId(auth.user?.id || "");
    setChecked(true);
  }, [profileId, router]);

  useEffect(() => {
    if (!checked || !profileId) return;

    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await getPhotographerDirectoryItemById(profileId);
        setProfile(data);
      } catch (error) {
        showError(error instanceof Error ? error.message : "Failed to load photographer profile");
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, [checked, profileId]);

  const handleBookingRequest = async () => {
    if (!profile) return;
    if (!bookingDate) {
      showError("Please select your preferred date and time");
      return;
    }
    if (!paymentConfirmed) {
      showError("Please confirm payment before sending the request.");
      return;
    }
    if (!transactionId.trim()) {
      showError("Enter the payment transaction ID.");
      return;
    }

    const noteHtml = editor?.getHTML() || "";

    setLoading(true);
    try {
      await createBookingRequest({
        photographerId: profile.id,
        date: bookingDate,
        paymentConfirmed,
        transactionId: transactionId.trim(),
        clientNoteHtml: noteHtml,
        clientNoteAttachments: clientAttachments,
      });
      showSuccess("Booking request submitted");
      setBookingDate("");
      setPaymentConfirmed(false);
      setTransactionId("");
      setClientAttachments([]);
      editor?.commands.setContent("<p></p>");
      publishMarketplaceUpdate({
        type: "booking-request-created",
        photographerId: profile.id,
        clientUserId: currentUserId,
      });
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to create booking request");
    } finally {
      setLoading(false);
    }
  };

  const handleClientAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    try {
      const attachments = await Promise.all(Array.from(files).map((file) => fileToAttachment(file)));
      setClientAttachments((previous) => [...previous, ...attachments]);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to attach files");
    }
  };

  if (!checked) return null;

  const handleCall = () => {
    if (!profile?.phone_number) {
      showError("This photographer has not provided a phone number yet.");
      return;
    }
    window.open(`tel:${profile.phone_number}`, "_self");
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <Link href="/hire-photographer" className="text-sm font-semibold text-blue-600 hover:underline">
            Back to marketplace
          </Link>
          <h1 className="mt-2 text-3xl font-black text-slate-900">Photographer Profile</h1>
        </div>

        {loading && !profile && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading profile...</div>
        )}

        {!loading && !profile && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
            Photographer not found or not publicly available.
          </div>
        )}

        {profile && (
          <>
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="bg-linear-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-8 text-white">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">Verified photographer</p>
                    <h2 className="mt-2 text-3xl font-black">{profile.user.name || "Photographer"}</h2>
                    <p className="mt-2 max-w-2xl text-sm text-slate-300">{profile.short_pitch || profile.bio || "No introduction provided yet."}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold">
                      <BadgeCheck className="h-4 w-4" /> {profile.application_status}
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold">
                      <MapPin className="h-4 w-4" /> {profile.service_area || "Multiple areas"}
                    </span>
                    <button
                      type="button"
                      onClick={handleCall}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold hover:bg-white/20"
                    >
                      <PhoneCall className="h-4 w-4" /> Call
                    </button>
                    <Link
                      href={`/messages?peerId=${profile.user.id}`}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-semibold hover:bg-white/20"
                    >
                      <MessageCircle className="h-4 w-4" /> Chat
                    </Link>
                  </div>
                </div>
              </div>

              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <Info label="Photographer type" value={profile.photographer_type} />
                  <Info label="Years of experience" value={profile.years_experience} />
                  <Info label="Availability" value={profile.availability} />
                  <Info label="Business name" value={profile.business_name} />
                  <Info label="Phone" value={profile.phone_number || null} />
                  <Info label="Price range" value={profile.price_min || profile.price_max ? `$${profile.price_min || "-"} - $${profile.price_max || "-"}` : null} />
                  <Info label="Service areas" value={Array.isArray(profile.service_areas) && profile.service_areas.length ? profile.service_areas.join(", ") : profile.service_area} />
                </div>

                <InfoBlock label="Short pitch" value={profile.short_pitch} />
                <InfoBlock label="Bio" value={profile.bio} />
                <InfoBlock label="Gear" value={profile.gear_description} />

                <div className="grid gap-4 lg:grid-cols-2">
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><Hash className="h-4 w-4" /> Keywords</h3>
                    <p className="mt-2 text-sm text-slate-700">{profile.service_keywords || "No keywords added."}</p>
                  </section>
                  <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700"><FileText className="h-4 w-4" /> Refund policy</h3>
                    <div className="mt-2 space-y-1 text-sm text-slate-700">
                      {Array.isArray(profile.refund_policy) && profile.refund_policy.length > 0 ? (
                        profile.refund_policy.map((rule, index) => (
                          <p key={`${rule.hoursBefore}-${index}`}>{rule.hoursBefore} hours before: {rule.refundPercent}% refund</p>
                        ))
                      ) : (
                        <p>No refund policy set.</p>
                      )}
                    </div>
                  </section>
                </div>

                <div className="flex flex-wrap gap-2">
                  <ExternalLink label="Portfolio" url={profile.portfolio_url} />
                  <ExternalLink label="Instagram" url={profile.instagram_url} />
                  <ExternalLink label="Facebook" url={profile.facebook_url || null} />
                  <ExternalLink label="LinkedIn" url={profile.linkedin_url || null} />
                  <ExternalLink label="X" url={profile.x_url || null} />
                  <ExternalLink label="Website" url={profile.website_url} />
                </div>

                {Array.isArray(profile.portfolio_items) && profile.portfolio_items.length > 0 ? (
                  <section>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Portfolio images</h3>
                    <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {profile.portfolio_items.map((item, index) => (
                        <div key={`${item.imageUrl}-${index}`} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                          <img src={item.imageUrl} alt={item.serviceType} className="h-48 w-full object-cover" />
                          <div className="p-3">
                            <p className="text-sm font-semibold text-slate-900">{item.serviceType || "General"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900">Request a Booking</h2>
              <p className="mt-1 text-sm text-slate-600">Payment is required when the request is submitted.</p>
              <div className="mt-4 space-y-4">
                <input
                  type="datetime-local"
                  value={bookingDate}
                  onChange={(event) => setBookingDate(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:max-w-sm"
                />

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <span className="font-semibold text-slate-700">Payment confirmation</span>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={paymentConfirmed} onChange={(event) => setPaymentConfirmed(event.target.checked)} />
                      <span className="text-slate-600">I confirm the booking payment has been completed</span>
                    </div>
                  </label>
                  <label className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                    <span className="font-semibold text-slate-700">Transaction ID</span>
                    <input
                      value={transactionId}
                      onChange={(event) => setTransactionId(event.target.value)}
                      placeholder="Payment reference"
                      className="rounded-lg border border-slate-300 px-3 py-2"
                    />
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700">Optional note for photographer</p>
                  <div className="rounded-lg border border-slate-200">
                    <div className="flex flex-wrap gap-2 border-b border-slate-200 bg-slate-50 p-2">
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBold().run()}
                        className={`rounded-md px-2 py-1 text-sm ${editor?.isActive("bold") ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                      >
                        <Bold className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleItalic().run()}
                        className={`rounded-md px-2 py-1 text-sm ${editor?.isActive("italic") ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                      >
                        <Italic className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleBulletList().run()}
                        className={`rounded-md px-2 py-1 text-sm ${editor?.isActive("bulletList") ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                      >
                        <List className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                        className={`rounded-md px-2 py-1 text-sm ${editor?.isActive("orderedList") ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                      >
                        <ListOrdered className="h-4 w-4" />
                      </button>
                    </div>
                    <EditorContent editor={editor} />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Paperclip className="h-4 w-4" /> Optional images/docs
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx,.txt"
                    onChange={(event) => void handleClientAttachments(event.target.files)}
                    className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-200 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-slate-700"
                  />

                  {clientAttachments.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {clientAttachments.map((attachment, index) => (
                        <span key={`${attachment.name}-${index}`} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700">
                          {attachment.name}
                          <button
                            type="button"
                            onClick={() => setClientAttachments((previous) => previous.filter((_, currentIndex) => currentIndex !== index))}
                            className="text-slate-500 hover:text-slate-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <button
                  onClick={handleBookingRequest}
                  disabled={loading}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
                >
                  {loading ? "Submitting..." : "Request Booking"}
                </button>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="text-slate-800">{value || "-"}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 rounded-md border border-slate-200 bg-slate-50 p-3 text-slate-800 whitespace-pre-wrap">{value || "-"}</p>
    </div>
  );
}

function ExternalLink({ label, url }: { label: string; url: string | null }) {
  if (!url) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
    >
      <span className="inline-flex items-center gap-2">
        {label}
        <ExternalLinkIcon className="h-3.5 w-3.5" />
      </span>
    </a>
  );
}
