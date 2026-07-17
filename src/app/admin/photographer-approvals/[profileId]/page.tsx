"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import { showError, showSuccess } from "@/components/toastUtils";
import { publishMarketplaceUpdate } from "@/lib/marketplace-updates";
import {
  getPhotographerApplicationById,
  reviewPhotographerApplication,
  type PhotographerApplication,
} from "@/services/photographer.service";

const APPLICATION_STATUSES = [
  { value: "UNDER_REVIEW", label: "Under review" },
  { value: "NEEDS_MORE_INFO", label: "Needs more info" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview scheduled" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

function formatStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

export default function PhotographerApprovalDetailPage() {
  const params = useParams<{ profileId: string }>();
  const router = useRouter();
  const profileId = useMemo(() => String(params?.profileId || ""), [params]);

  const [checked, setChecked] = useState(false);
  const [loadingApplication, setLoadingApplication] = useState(false);
  const [savingReview, setSavingReview] = useState(false);
  const [application, setApplication] = useState<PhotographerApplication | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("UNDER_REVIEW");
  const [adminFeedback, setAdminFeedback] = useState("");

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || !hasRole(auth.user.role, "ADMIN")) {
      router.replace("/");
      return;
    }
    setChecked(true);
  }, [router]);

  const loadApplication = async () => {
    if (!profileId) return;
    setLoadingApplication(true);
    try {
      const data = await getPhotographerApplicationById(profileId);
      setApplication(data);
      setSelectedStatus(data.application_status || "UNDER_REVIEW");
      setAdminFeedback(data.admin_feedback || "");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load application");
    } finally {
      setLoadingApplication(false);
    }
  };

  useEffect(() => {
    if (checked && profileId) {
      loadApplication();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, profileId]);

  const handleReview = async () => {
    if (!application) return;

    if (selectedStatus === "NEEDS_MORE_INFO" && !adminFeedback.trim()) {
      showError("Add the specific feedback you need from the photographer before marking Needs more info.");
      return;
    }

    setSavingReview(true);
    try {
      await reviewPhotographerApplication(
        application.id,
        selectedStatus,
        selectedStatus === "NEEDS_MORE_INFO" ? adminFeedback.trim() : undefined
      );

      if (selectedStatus === "APPROVED") {
        publishMarketplaceUpdate({ type: "photographer-approved", photographerId: application.id });
      }

      showSuccess(`Application updated to ${formatStatus(selectedStatus)}`);
      await loadApplication();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to update application");
    } finally {
      setSavingReview(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-cream-200 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-900">Photographer Application</h1>
            <p className="text-cream-800/70 mt-1">Review complete profile details and update status.</p>
          </div>
          <Link
            href="/admin/photographer-approvals"
            className="rounded-md border border-cream-200 px-4 py-2 text-sm font-semibold text-cream-800/80 hover:bg-cream-100"
          >
            Back to Approvals
          </Link>
        </div>
      </div>

      {loadingApplication && !application && (
        <div className="rounded-lg border border-cream-200 bg-white p-8 text-center text-cream-800/50">Loading details...</div>
      )}

      {application && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-cream-200 bg-white p-4">
              <p className="text-sm text-cream-800/50">Applicant</p>
              <p className="text-lg font-bold text-brand-900">{application.user.name || "Unnamed Photographer"}</p>
            </div>
            <div className="rounded-lg border border-cream-200 bg-white p-4">
              <p className="text-sm text-cream-800/50">Current Status</p>
              <p className="text-lg font-bold text-brand-900">{formatStatus(application.application_status)}</p>
            </div>
            <div className="rounded-lg border border-cream-200 bg-white p-4">
              <p className="text-sm text-cream-800/50">Submitted</p>
              <p className="text-lg font-bold text-brand-900">{new Date(application.created_at).toLocaleString()}</p>
            </div>
          </div>

          <div className="rounded-lg border border-cream-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-bold text-brand-900">Details</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Info label="Email" value={application.user.email} />
              <Info label="Business Name" value={application.business_name} />
              <Info label="Photographer Type" value={application.photographer_type} />
              <Info label="Years Experience" value={application.years_experience} />
              <Info label="Service Area" value={application.service_area} />
              <Info label="Availability" value={application.availability} />
              <Info label="Portfolio URL" value={application.portfolio_url} isUrl />
              <Info label="Instagram URL" value={application.instagram_url} isUrl />
              <Info label="Website URL" value={application.website_url} isUrl />
            </div>

            {application.admin_feedback && (
              <InfoBlock label="Admin Feedback" value={application.admin_feedback} />
            )}

            <InfoBlock label="Bio" value={application.bio} />
            <InfoBlock label="Short Pitch" value={application.short_pitch} />
            <InfoBlock label="Gear Description" value={application.gear_description} />

            {application.photographer_responses && application.photographer_responses.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-brand-900">Photographer Updates</h3>
                {application.photographer_responses.map((response, index) => (
                  <div key={`${response.submittedAt}-${index}`} className="rounded-md border border-cream-200 bg-cream-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Submitted {new Date(response.submittedAt).toLocaleString()}</p>
                    <div className="mt-2 rounded-md border border-cream-200 bg-white p-3 text-brand-900 whitespace-pre-wrap">
                      <div dangerouslySetInnerHTML={{ __html: response.contentHtml }} />
                    </div>
                    {response.attachments && response.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">Attachments</p>
                        <div className="flex flex-wrap gap-2">
                          {response.attachments.map((attachment, attachmentIndex) => (
                            <a
                              key={`${attachment.name}-${attachmentIndex}`}
                              href={attachment.dataUrl}
                              download={attachment.name}
                              className="rounded-full border border-cream-200 bg-white px-3 py-1 text-xs font-medium text-cream-800/80 hover:bg-cream-100"
                            >
                              {attachment.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {application.documents_url && (
              <a
                href={application.documents_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Open Uploaded Document
              </a>
            )}
          </div>

          <div className="rounded-lg border border-cream-200 bg-white p-6 space-y-4">
            <h2 className="text-xl font-bold text-brand-900">Update Application Status</h2>
            <p className="text-sm text-cream-800/70">
              Select the next status. Feedback is required when choosing Needs more info.
            </p>

            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {APPLICATION_STATUSES.map((option) => {
                const active = selectedStatus === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setSelectedStatus(option.value)}
                    className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-colors ${
                      active
                        ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                        : "border-cream-200 bg-white text-cream-800/80 hover:bg-cream-50"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>

            {selectedStatus === "NEEDS_MORE_INFO" && (
              <div className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <label className="block text-sm font-medium text-cream-800/80">
                  Add the exact information the photographer must provide
                </label>
                <textarea
                  value={adminFeedback}
                  onChange={(event) => setAdminFeedback(event.target.value)}
                  placeholder="Tell them what files, clarifications, or corrections you need..."
                  className="min-h-32 w-full rounded-md border border-cream-200 px-3 py-2 text-sm outline-none focus:border-indigo-600"
                />
              </div>
            )}

            {selectedStatus !== "NEEDS_MORE_INFO" && adminFeedback && (
              <p className="text-xs text-cream-800/50">
                Existing feedback is stored on the profile but only required for Needs more info.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReview}
                disabled={savingReview || selectedStatus === application.application_status}
                className="rounded-md bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
              >
                {savingReview ? "Saving..." : `Save ${formatStatus(selectedStatus)}`}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value, isUrl = false }: { label: string; value: string | null | undefined; isUrl?: boolean }) {
  if (isUrl && value) {
    return (
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">{label}</p>
        <a href={value} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">
          {value}
        </a>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">{label}</p>
      <p className="text-brand-900">{value || "-"}</p>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-cream-800/50">{label}</p>
      <p className="mt-1 rounded-md border border-cream-200 bg-cream-50 p-3 text-brand-900 whitespace-pre-wrap">{value || "-"}</p>
    </div>
  );
}
