"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { submitContactSalesRequest } from "@/services/payment.service";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { toast } from "react-toastify";

export default function ContactSalesForm({ onClose }: { onClose?: () => void }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredContactMethod, setPreferredContactMethod] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [estimatedMonthlyCreditVolume, setEstimatedMonthlyCreditVolume] = useState("");
  const [primaryUseCase, setPrimaryUseCase] = useState("");
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (auth?.user) {
      setEmail(auth.user.email || "");
      setFullName(auth.user.name || "");
    }
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Full name is required");
      return;
    }
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      await submitContactSalesRequest({
        email: email.trim(),
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        phone: phone.trim() || undefined,
        preferredContactMethod: preferredContactMethod || undefined,
        teamSize: teamSize.trim() || undefined,
        estimatedMonthlyCreditVolume: estimatedMonthlyCreditVolume.trim() || undefined,
        primaryUseCase: primaryUseCase.trim() || undefined,
        preferredStartDate: preferredStartDate || undefined,
        message: message.trim() || undefined,
      });

      toast.success("Your enterprise inquiry was sent. We will reply by email soon.");
      if (onClose) onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to send contact sales request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Full name</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Email address</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Phone number (optional)</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Preferred contact method</label>
          <select value={preferredContactMethod} onChange={(e) => setPreferredContactMethod(e.target.value)} className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm">
            <option value="">Any</option>
            <option value="email">Email</option>
            <option value="phone">Phone</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Company name (optional)</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Team size</label>
          <Input value={teamSize} onChange={(e) => setTeamSize(e.target.value)} placeholder="e.g. 12 agents" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Estimated monthly credit volume</label>
          <Input value={estimatedMonthlyCreditVolume} onChange={(e) => setEstimatedMonthlyCreditVolume(e.target.value)} placeholder="e.g. 2000 credits" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-cream-800/80">Preferred start date</label>
          <Input type="date" value={preferredStartDate} onChange={(e) => setPreferredStartDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-cream-800/80">Primary use case</label>
        <Input value={primaryUseCase} onChange={(e) => setPrimaryUseCase(e.target.value)} placeholder="e.g. short term rentals, design" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-cream-800/80">Optional message</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} className="w-full rounded-md border border-cream-200 px-3 py-2 text-sm" placeholder="Any additional details" />
      </div>

      {error && <div className="text-sm text-red-700">{error}</div>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-600">
          {submitting ? 'Sending...' : 'Send'}
        </button>
        {onClose ? (
          <button type="button" onClick={onClose} className="text-sm text-cream-800/70 hover:underline">Cancel</button>
        ) : null}
      </div>
    </form>
  );
}
