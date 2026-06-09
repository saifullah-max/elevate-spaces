"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BadgeCheck, FileText, Loader2, Lock, Paperclip, Plus, RefreshCw, Send, Sparkles, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { showError, showSuccess } from "@/components/toastUtils";
import {
  getMyPhotographerProfile,
  submitPhotographerApplication,
  submitPhotographerResponse,
  type PhotographerDirectoryItem,
} from "@/services/photographer.service";

type ApplicationMode = "new" | "rejected" | "locked" | "needs_more_info";

type ApplicationFormState = {
  bio: string;
  availability: string;
  photographerType: string;
  yearsExperience: string;
  serviceAreas: string[];
  portfolioUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  linkedinUrl: string;
  xUrl: string;
  websiteUrl: string;
  phoneNumber: string;
  serviceKeywords: string[];
  priceMin: string;
  priceMax: string;
  gearDescription: string;
  businessName: string;
  shortPitch: string;
};

type ResponseAttachment = {
  name: string;
  type: string;
  dataUrl: string;
};

type RefundRule = {
  hoursBefore: string;
  refundPercent: string;
};

type PortfolioDraftItem = {
  file: File;
  serviceType: string;
};

const EMPTY_FORM: ApplicationFormState = {
  bio: "",
  availability: "",
  photographerType: "",
  yearsExperience: "",
  serviceAreas: [""],
  portfolioUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  linkedinUrl: "",
  xUrl: "",
  websiteUrl: "",
  phoneNumber: "",
  serviceKeywords: [""],
  priceMin: "",
  priceMax: "",
  gearDescription: "",
  businessName: "",
  shortPitch: "",
};

function getMode(profile: PhotographerDirectoryItem | null): ApplicationMode {
  if (!profile) return "new";
  if (profile.application_status === "REJECTED") return "rejected";
  if (profile.application_status === "NEEDS_MORE_INFO") return "needs_more_info";
  return "locked";
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function plainToHtml(text: string): string {
  return `<p>${escapeHtml(text).replaceAll("\n", "<br/>")}</p>`;
}

async function fileToAttachment(file: File): Promise<ResponseAttachment> {
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

function getResponseSummary(profile: PhotographerDirectoryItem | null) {
  if (!profile?.photographer_responses || profile.photographer_responses.length === 0) {
    return null;
  }
  return profile.photographer_responses.slice().reverse();
}

export function PhotographerApplicationWorkflow() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingApplication, setSavingApplication] = useState(false);
  const [savingResponse, setSavingResponse] = useState(false);
  const [profile, setProfile] = useState<PhotographerDirectoryItem | null>(null);
  const [applicationForm, setApplicationForm] = useState<ApplicationFormState>(EMPTY_FORM);
  const [drivingLicenseFile, setDrivingLicenseFile] = useState<File | null>(null);
  const [utilityBillFile, setUtilityBillFile] = useState<File | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<PortfolioDraftItem[]>([]);
  const [refundRules, setRefundRules] = useState<RefundRule[]>([{ hoursBefore: "24", refundPercent: "100" }]);
  const [responseText, setResponseText] = useState("");
  const [responseAttachments, setResponseAttachments] = useState<ResponseAttachment[]>([]);

  const mode = useMemo(() => getMode(profile), [profile]);
  const isApplicationEditable = mode === "new" || mode === "rejected";
  const canSendResponse = mode === "needs_more_info";
  const responseHistory = useMemo(() => getResponseSummary(profile), [profile]);

  useEffect(() => {
    const auth = getAuthFromStorage();
    setIsAuthed(Boolean(auth?.token));
  }, []);

  const loadProfile = async () => {
    if (!isAuthed) {
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    try {
      const data = await getMyPhotographerProfile();
      setProfile(data);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load photographer profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    if (!isAuthed) {
      setLoadingProfile(false);
      setProfile(null);
      return;
    }
    void loadProfile();
  }, [isAuthed]);

  useEffect(() => {
    if (profile) {
      setApplicationForm({
        bio: profile.bio || "",
        availability: profile.availability || "",
        photographerType: profile.photographer_type || "",
        yearsExperience: profile.years_experience || "",
        serviceAreas:
          Array.isArray(profile.service_areas) && profile.service_areas.length
            ? profile.service_areas.map((entry) => String(entry || ""))
            : [profile.service_area || ""],
        portfolioUrl: profile.portfolio_url || "",
        instagramUrl: profile.instagram_url || "",
        facebookUrl: profile.facebook_url || "",
        linkedinUrl: profile.linkedin_url || "",
        xUrl: profile.x_url || "",
        websiteUrl: profile.website_url || "",
        phoneNumber: profile.phone_number || "",
        serviceKeywords:
          profile.service_keywords
            ? String(profile.service_keywords)
                .split(",")
                .map((entry) => entry.trim())
                .filter(Boolean)
            : [""],
        priceMin: typeof profile.price_min === "number" ? String(profile.price_min) : "",
        priceMax: typeof profile.price_max === "number" ? String(profile.price_max) : "",
        gearDescription: profile.gear_description || "",
        businessName: profile.business_name || "",
        shortPitch: profile.short_pitch || "",
      });

      if (Array.isArray(profile.refund_policy) && profile.refund_policy.length > 0) {
        setRefundRules(
          profile.refund_policy.map((rule) => ({
            hoursBefore: String(rule?.hoursBefore ?? ""),
            refundPercent: String(rule?.refundPercent ?? ""),
          }))
        );
      } else {
        setRefundRules([{ hoursBefore: "24", refundPercent: "100" }]);
      }
    } else {
      setApplicationForm(EMPTY_FORM);
      setRefundRules([{ hoursBefore: "24", refundPercent: "100" }]);
    }
  }, [profile?.id, profile?.application_status]);

  const handleApplicationChange = (field: keyof ApplicationFormState, value: string) => {
    setApplicationForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const updateStringArrayField = (field: "serviceAreas" | "serviceKeywords", index: number, value: string) => {
    setApplicationForm((previous) => {
      const nextArray = [...previous[field]];
      nextArray[index] = value;
      return {
        ...previous,
        [field]: nextArray,
      };
    });
  };

  const addStringArrayField = (field: "serviceAreas" | "serviceKeywords") => {
    setApplicationForm((previous) => ({
      ...previous,
      [field]: [...previous[field], ""],
    }));
  };

  const removeStringArrayField = (field: "serviceAreas" | "serviceKeywords", index: number) => {
    setApplicationForm((previous) => {
      const filtered = previous[field].filter((_, currentIndex) => currentIndex !== index);
      return {
        ...previous,
        [field]: filtered.length ? filtered : [""],
      };
    });
  };

  const updateRefundRule = (index: number, key: keyof RefundRule, value: string) => {
    setRefundRules((previous) =>
      previous.map((rule, currentIndex) =>
        currentIndex === index
          ? {
              ...rule,
              [key]: value,
            }
          : rule
      )
    );
  };

  const addRefundRule = () => {
    setRefundRules((previous) => [...previous, { hoursBefore: "", refundPercent: "" }]);
  };

  const removeRefundRule = (index: number) => {
    setRefundRules((previous) => {
      const filtered = previous.filter((_, currentIndex) => currentIndex !== index);
      return filtered.length ? filtered : [{ hoursBefore: "", refundPercent: "" }];
    });
  };

  const handlePortfolioSelection = (files: FileList | null) => {
    if (!files) return;
    setPortfolioItems((previous) => {
      const next = [...previous];
      for (const file of Array.from(files)) {
        if (next.length >= 5) break;
        next.push({ file, serviceType: "General" });
      }
      return next;
    });
  };

  const updatePortfolioServiceType = (index: number, value: string) => {
    setPortfolioItems((previous) =>
      previous.map((item, currentIndex) =>
        currentIndex === index
          ? {
              ...item,
              serviceType: value,
            }
          : item
      )
    );
  };

  const removePortfolioItem = (index: number) => {
    setPortfolioItems((previous) => previous.filter((_, currentIndex) => currentIndex !== index));
  };

  const handleSubmitApplication = async () => {
    if (!isAuthed) {
      showError("Sign in first to apply as a photographer.");
      return;
    }

    if (!applicationForm.bio.trim()) {
      showError("Please add a short professional bio before applying.");
      return;
    }

    const normalizedServiceAreas = applicationForm.serviceAreas.map((entry) => entry.trim()).filter(Boolean);
    if (normalizedServiceAreas.length === 0) {
      showError("Please add at least one service area or zip code.");
      return;
    }

    const normalizedKeywords = applicationForm.serviceKeywords.map((entry) => entry.trim()).filter(Boolean);
    const normalizedRefundPolicy = refundRules
      .map((rule) => ({
        hoursBefore: Number(rule.hoursBefore),
        refundPercent: Number(rule.refundPercent),
      }))
      .filter((rule) => Number.isFinite(rule.hoursBefore) && Number.isFinite(rule.refundPercent));

    if (normalizedRefundPolicy.length === 0) {
      showError("Please define at least one refund policy rule.");
      return;
    }

    if (portfolioItems.length > 0 && portfolioItems.length < 3) {
      showError("Please upload at least 3 portfolio images, or none for now.");
      return;
    }

    setSavingApplication(true);
    try {
      await submitPhotographerApplication({
        bio: applicationForm.bio.trim(),
        availability: applicationForm.availability.trim() || undefined,
        photographerType: applicationForm.photographerType.trim() || undefined,
        yearsExperience: applicationForm.yearsExperience.trim() || undefined,
        serviceArea: normalizedServiceAreas[0] || undefined,
        serviceAreas: normalizedServiceAreas,
        portfolioUrl: applicationForm.portfolioUrl.trim() || undefined,
        instagramUrl: applicationForm.instagramUrl.trim() || undefined,
        facebookUrl: applicationForm.facebookUrl.trim() || undefined,
        linkedinUrl: applicationForm.linkedinUrl.trim() || undefined,
        xUrl: applicationForm.xUrl.trim() || undefined,
        websiteUrl: applicationForm.websiteUrl.trim() || undefined,
        phoneNumber: applicationForm.phoneNumber.trim() || undefined,
        serviceKeywords: normalizedKeywords,
        priceMin: applicationForm.priceMin ? Number(applicationForm.priceMin) : undefined,
        priceMax: applicationForm.priceMax ? Number(applicationForm.priceMax) : undefined,
        refundPolicy: normalizedRefundPolicy,
        portfolioServiceTypes: portfolioItems.map((item) => item.serviceType.trim() || "General"),
        gearDescription: applicationForm.gearDescription.trim() || undefined,
        businessName: applicationForm.businessName.trim() || undefined,
        shortPitch: applicationForm.shortPitch.trim() || undefined,
        drivingLicense: drivingLicenseFile,
        utilityBill: utilityBillFile,
        portfolioImages: portfolioItems.map((item) => item.file),
      });

      showSuccess(profile?.application_status === "REJECTED" ? "Application resubmitted for review." : "Application submitted for review.");
      setDrivingLicenseFile(null);
      setUtilityBillFile(null);
      setPortfolioItems([]);
      await loadProfile();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to submit photographer application");
    } finally {
      setSavingApplication(false);
    }
  };

  const handleResponseAttachments = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    try {
      const attachments = await Promise.all(Array.from(files).map((file) => fileToAttachment(file)));
      setResponseAttachments((previous) => [...previous, ...attachments]);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to attach files");
    }
  };

  const handleSubmitResponse = async () => {
    const text = responseText.trim();
    if (!text) {
      showError("Add your response before sending it back to admin.");
      return;
    }

    setSavingResponse(true);
    try {
      await submitPhotographerResponse({
        responseContent: plainToHtml(text),
        attachments: responseAttachments,
      });

      showSuccess("Your update was sent to admin for review.");
      setResponseText("");
      setResponseAttachments([]);
      await loadProfile();
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to submit photographer response");
    } finally {
      setSavingResponse(false);
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthed) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 p-3 text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-slate-900">Sign in to apply as a photographer</h3>
            <p className="text-sm text-slate-600">You need an account before submitting your photographer profile.</p>
            <Link href="/sign-in" className="inline-flex text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline">
              Go to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Photographer application</h2>
            <p className="mt-1 text-sm text-slate-600">Add service areas, social links, documents, portfolio, pricing, and refund policy.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadProfile()}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Refresh status
          </button>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <StatusBadge mode={mode} />
          {profile?.submission_count ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">Submission #{profile.submission_count}</span> : null}
        </div>

        {mode === "rejected" && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
            <div className="flex items-center gap-2 font-semibold">
              <Unlock className="h-4 w-4" /> Rejected applications can be edited and resubmitted.
            </div>
          </div>
        )}

        {mode === "locked" && profile?.application_status !== "APPROVED" && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold">
              <Lock className="h-4 w-4 text-slate-500" /> Your application is currently locked.
            </div>
          </div>
        )}

        {mode === "needs_more_info" && profile?.admin_feedback ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
            <div className="flex items-center gap-2 font-semibold">
              <BadgeCheck className="h-4 w-4 text-amber-700" /> Admin requested more information
            </div>
            <p className="mt-2 whitespace-pre-wrap text-amber-950/90">{profile.admin_feedback}</p>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.85fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldInput label="Business name" value={applicationForm.businessName} onChange={(value) => handleApplicationChange("businessName", value)} disabled={!isApplicationEditable} placeholder="Your business or studio name" />
            <FieldInput label="Photographer type" value={applicationForm.photographerType} onChange={(value) => handleApplicationChange("photographerType", value)} disabled={!isApplicationEditable} placeholder="Events, interiors, drone" />
            <FieldInput label="Years experience" value={applicationForm.yearsExperience} onChange={(value) => handleApplicationChange("yearsExperience", value)} disabled={!isApplicationEditable} placeholder="How long have you been shooting?" />
            <FieldInput label="Availability" value={applicationForm.availability} onChange={(value) => handleApplicationChange("availability", value)} disabled={!isApplicationEditable} placeholder="Tomorrow, weekends, evenings" />
            <FieldInput label="Portfolio URL" value={applicationForm.portfolioUrl} onChange={(value) => handleApplicationChange("portfolioUrl", value)} disabled={!isApplicationEditable} placeholder="https://..." />
            <FieldInput label="Website URL" value={applicationForm.websiteUrl} onChange={(value) => handleApplicationChange("websiteUrl", value)} disabled={!isApplicationEditable} placeholder="https://..." />
            <FieldInput label="Instagram URL" value={applicationForm.instagramUrl} onChange={(value) => handleApplicationChange("instagramUrl", value)} disabled={!isApplicationEditable} placeholder="https://instagram.com/..." />
            <FieldInput label="Facebook URL" value={applicationForm.facebookUrl} onChange={(value) => handleApplicationChange("facebookUrl", value)} disabled={!isApplicationEditable} placeholder="https://facebook.com/..." />
            <FieldInput label="LinkedIn URL" value={applicationForm.linkedinUrl} onChange={(value) => handleApplicationChange("linkedinUrl", value)} disabled={!isApplicationEditable} placeholder="https://linkedin.com/in/..." />
            <FieldInput label="X URL" value={applicationForm.xUrl} onChange={(value) => handleApplicationChange("xUrl", value)} disabled={!isApplicationEditable} placeholder="https://x.com/..." />
            <FieldInput label="Price min (event)" value={applicationForm.priceMin} onChange={(value) => handleApplicationChange("priceMin", value)} disabled={!isApplicationEditable} placeholder="100" />
            <FieldInput label="Price max (event)" value={applicationForm.priceMax} onChange={(value) => handleApplicationChange("priceMax", value)} disabled={!isApplicationEditable} placeholder="500" />
            <FieldInput label="Phone number" value={applicationForm.phoneNumber} onChange={(value) => handleApplicationChange("phoneNumber", value)} disabled={!isApplicationEditable} placeholder="+1 555 123 4567" />
          </div>

          <ArrayField
            title="Service areas / zip codes"
            values={applicationForm.serviceAreas}
            onAdd={() => addStringArrayField("serviceAreas")}
            onRemove={(index) => removeStringArrayField("serviceAreas", index)}
            onChange={(index, value) => updateStringArrayField("serviceAreas", index, value)}
            placeholder="City / area / zip"
            disabled={!isApplicationEditable}
          />

          <ArrayField
            title="Service keywords"
            values={applicationForm.serviceKeywords}
            onAdd={() => addStringArrayField("serviceKeywords")}
            onRemove={(index) => removeStringArrayField("serviceKeywords", index)}
            onChange={(index, value) => updateStringArrayField("serviceKeywords", index, value)}
            placeholder="drone, wedding, 3d tour"
            disabled={!isApplicationEditable}
          />

          <RefundPolicyField
            rules={refundRules}
            onAdd={addRefundRule}
            onRemove={removeRefundRule}
            onChange={updateRefundRule}
            disabled={!isApplicationEditable}
          />

          <FieldTextarea label="Professional bio" value={applicationForm.bio} onChange={(value) => handleApplicationChange("bio", value)} disabled={!isApplicationEditable} placeholder="Tell clients about your experience" />
          <FieldTextarea label="Short pitch" value={applicationForm.shortPitch} onChange={(value) => handleApplicationChange("shortPitch", value)} disabled={!isApplicationEditable} placeholder="Why should clients hire you?" />
          <FieldTextarea label="Gear description" value={applicationForm.gearDescription} onChange={(value) => handleApplicationChange("gearDescription", value)} disabled={!isApplicationEditable} placeholder="Cameras, lenses, lighting" />

          <FileField title="Driving license document" hint="Required unless already uploaded." file={drivingLicenseFile} onChange={setDrivingLicenseFile} disabled={!isApplicationEditable} />
          <FileField title="Latest utility bill / payment proof" hint="Required unless already uploaded." file={utilityBillFile} onChange={setUtilityBillFile} disabled={!isApplicationEditable} />

          <PortfolioField
            items={portfolioItems}
            disabled={!isApplicationEditable}
            onSelect={handlePortfolioSelection}
            onChangeType={updatePortfolioServiceType}
            onRemove={removePortfolioItem}
          />

          {isApplicationEditable ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Button onClick={handleSubmitApplication} disabled={savingApplication} className="bg-indigo-600 hover:bg-indigo-700">
                {savingApplication ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                {mode === "rejected" ? "Resubmit application" : "Submit application"}
              </Button>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          {canSendResponse ? (
            <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-amber-950">Admin requested more info</h3>
              <textarea
                value={responseText}
                onChange={(event) => setResponseText(event.target.value)}
                className="mt-3 min-h-36 w-full rounded-lg border border-amber-200 bg-white px-3 py-2 text-sm"
                placeholder="Write your response to admin"
              />

              <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Paperclip className="h-4 w-4 text-amber-700" /> Attach images or docs
                </label>
                <input
                  type="file"
                  multiple
                  accept="application/pdf,image/jpeg,image/png,image/webp,.doc,.docx,.txt"
                  onChange={(event) => void handleResponseAttachments(event.target.files)}
                  className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-amber-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-amber-800"
                />
              </div>

              <div className="mt-5 flex justify-end">
                <Button onClick={handleSubmitResponse} disabled={savingResponse} className="bg-amber-600 hover:bg-amber-700 text-white">
                  {savingResponse ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Send response to admin
                </Button>
              </div>
            </section>
          ) : null}

          {responseHistory && responseHistory.length > 0 ? (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Your previous responses</h4>
              <div className="mt-4 space-y-4">
                {responseHistory.map((response, index) => (
                  <div key={`${response.submittedAt}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Submitted {new Date(response.submittedAt).toLocaleString()}</p>
                    <div className="prose prose-slate mt-3 max-w-none text-sm" dangerouslySetInnerHTML={{ __html: response.contentHtml }} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function FieldTextarea({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="min-h-28 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
      />
    </label>
  );
}

function ArrayField({
  title,
  values,
  onAdd,
  onRemove,
  onChange,
  placeholder,
  disabled,
}: {
  title: string;
  values: string[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, value: string) => void;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">{title}</label>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {values.map((entry, index) => (
          <div key={`${title}-${index}`} className="flex gap-2">
            <input
              value={entry}
              onChange={(event) => onChange(index, event.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled || values.length === 1}
              className="rounded-md border border-slate-300 px-2 text-sm text-slate-600 disabled:opacity-50"
            >
              -
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefundPolicyField({
  rules,
  onAdd,
  onRemove,
  onChange,
  disabled,
}: {
  rules: RefundRule[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onChange: (index: number, key: keyof RefundRule, value: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700">Refund policy rules</label>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-semibold text-slate-700 disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      </div>
      <div className="space-y-2">
        {rules.map((rule, index) => (
          <div key={`refund-${index}`} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <input
              value={rule.hoursBefore}
              onChange={(event) => onChange(index, "hoursBefore", event.target.value)}
              disabled={disabled}
              placeholder="Hours before event"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <input
              value={rule.refundPercent}
              onChange={(event) => onChange(index, "refundPercent", event.target.value)}
              disabled={disabled}
              placeholder="Refund %"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled || rules.length === 1}
              className="rounded-md border border-slate-300 px-2 text-sm text-slate-600 disabled:opacity-50"
            >
              -
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FileField({
  title,
  hint,
  file,
  onChange,
  disabled,
}: {
  title: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="block text-sm font-semibold text-slate-700">{title}</label>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        onChange={(event) => onChange(event.target.files?.[0] || null)}
        disabled={disabled}
        className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 disabled:opacity-60"
      />
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
      {file ? <p className="mt-2 text-xs font-medium text-slate-700">Selected: {file.name}</p> : null}
    </div>
  );
}

function PortfolioField({
  items,
  disabled,
  onSelect,
  onChangeType,
  onRemove,
}: {
  items: PortfolioDraftItem[];
  disabled?: boolean;
  onSelect: (files: FileList | null) => void;
  onChangeType: (index: number, value: string) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <label className="block text-sm font-semibold text-slate-700">Portfolio images (3 to 5)</label>
      <input
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => onSelect(event.target.files)}
        disabled={disabled || items.length >= 5}
        className="mt-2 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 disabled:opacity-60"
      />
      <div className="mt-3 space-y-2">
        {items.map((item, index) => (
          <div key={`${item.file.name}-${index}`} className="grid grid-cols-[1.3fr_1fr_auto] gap-2">
            <input value={item.file.name} readOnly className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700" />
            <input
              value={item.serviceType}
              onChange={(event) => onChangeType(index, event.target.value)}
              disabled={disabled}
              placeholder="Service type"
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => onRemove(index)}
              disabled={disabled}
              className="rounded-md border border-slate-300 px-2 text-sm text-slate-600 disabled:opacity-50"
            >
              -
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ mode }: { mode: ApplicationMode }) {
  const styles: Record<ApplicationMode, { label: string; className: string }> = {
    new: {
      label: "Ready to submit",
      className: "bg-emerald-100 text-emerald-800",
    },
    rejected: {
      label: "Rejected - editable",
      className: "bg-rose-100 text-rose-800",
    },
    locked: {
      label: "Locked for review",
      className: "bg-slate-100 text-slate-700",
    },
    needs_more_info: {
      label: "Needs more info",
      className: "bg-amber-100 text-amber-800",
    },
  };

  const entry = styles[mode];
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${entry.className}`}>{entry.label}</span>;
}
