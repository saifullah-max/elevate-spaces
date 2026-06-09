"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { hasRole } from "@/lib/role.helpers";
import { showError } from "@/components/toastUtils";
import {
  getPendingPhotographerApplications,
  type PhotographerApplication,
} from "@/services/photographer.service";

function toTitleStatus(status: string) {
  return status.replace(/_/g, " ").toLowerCase();
}

const STATUS_GROUPS = [
  {
    title: "New submissions",
    subtitle: "Fresh applications waiting for the first review pass.",
    statuses: ["SUBMITTED"],
  },
  {
    title: "Under review",
    subtitle: "Applications the admin team is actively evaluating.",
    statuses: ["UNDER_REVIEW"],
  },
  {
    title: "Waiting on photographer",
    subtitle: "Admin requested more information and is waiting for a response.",
    statuses: ["NEEDS_MORE_INFO"],
  },
  {
    title: "Finalized decisions",
    subtitle: "Interview scheduled, approved, or rejected applications.",
    statuses: ["INTERVIEW_SCHEDULED", "APPROVED", "REJECTED"],
  },
] as const;

export default function PhotographerApprovalsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applications, setApplications] = useState<PhotographerApplication[]>([]);

  const groupedApplications = useMemo(
    () =>
      STATUS_GROUPS.map((group) => ({
        ...group,
        applications: applications.filter((application) => (group.statuses as readonly string[]).includes(application.application_status)),
      })),
    [applications]
  );

  const totalPendingCount = useMemo(
    () => groupedApplications.slice(0, 3).reduce((total, group) => total + group.applications.length, 0),
    [groupedApplications]
  );

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth || !auth.user || !hasRole(auth.user.role, "ADMIN")) {
      router.replace("/");
      return;
    }
    setChecked(true);
  }, [router]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const rows = await getPendingPhotographerApplications();
      setApplications(rows);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (checked) {
      loadApplications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  if (!checked) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h1 className="text-3xl font-bold text-slate-900">Photographer Approvals</h1>
        <p className="text-slate-600 mt-1">
          Review new submissions and follow-up updates separately from finalized decisions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Pending review</p>
          <p className="text-2xl font-black text-slate-900">{totalPendingCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Finalized</p>
          <p className="text-2xl font-black text-slate-900">{groupedApplications[3]?.applications.length || 0}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-sm text-slate-500">Refresh</p>
          <button
            onClick={loadApplications}
            disabled={loading}
            className="mt-1 rounded-md bg-slate-900 text-white px-3 py-1.5 text-sm font-semibold disabled:opacity-60"
          >
            {loading ? "Loading..." : "Reload"}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {groupedApplications.map((group) => (
          <ApplicationTable
            key={group.title}
            title={group.title}
            subtitle={group.subtitle}
            applications={group.applications}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}

function ApplicationTable({
  title,
  subtitle,
  applications,
  loading,
}: {
  title: string;
  subtitle: string;
  applications: PhotographerApplication[];
  loading: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      <div className="border-b border-slate-200 p-4">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
      </div>

      {applications.length === 0 && !loading && <div className="p-8 text-center text-slate-500">No applications in this section.</div>}

      {applications.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                <th className="text-left font-semibold px-4 py-3">Photographer</th>
                <th className="text-left font-semibold px-4 py-3">Email</th>
                <th className="text-left font-semibold px-4 py-3">Type</th>
                <th className="text-left font-semibold px-4 py-3">Service Area</th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-left font-semibold px-4 py-3">New Update</th>
                <th className="text-left font-semibold px-4 py-3">Submitted</th>
                <th className="text-left font-semibold px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">{application.user.name || "Unnamed Photographer"}</td>
                  <td className="px-4 py-3 text-slate-700">{application.user.email}</td>
                  <td className="px-4 py-3 text-slate-700">{application.photographer_type || "-"}</td>
                  <td className="px-4 py-3 text-slate-700">{application.service_area || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-800">
                      {toTitleStatus(application.application_status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {application.has_new_photographer_response ? (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                        Photographer replied
                      </span>
                    ) : (
                      <span className="text-slate-400">None</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{new Date(application.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/photographer-approvals/${application.id}`}
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
                    >
                      Open Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
