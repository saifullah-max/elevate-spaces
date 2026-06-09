"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { submitSupportRequest } from "@/services/payment.service";

export default function SupportForm() {
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [briefDescription, setBriefDescription] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files);
  };

  const readFilesAsBase64 = async (list: FileList | null) => {
    if (!list || list.length === 0) return [] as Array<{ filename: string; content: string; type?: string }>;
    const arr = Array.from(list).slice(0, 5);
    const results: Array<{ filename: string; content: string; type?: string }> = [];
    for (const file of arr) {
      const content = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // strip data:<type>;base64, prefix
          const commaIdx = result.indexOf(",");
          const b64 = commaIdx >= 0 ? result.slice(commaIdx + 1) : result;
          resolve(b64);
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(file);
      });
      results.push({ filename: file.name, content, type: file.type });
    }
    return results;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCaseNumber(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!briefDescription.trim()) {
      setError("Please provide a brief description of your issue");
      return;
    }

    setSubmitting(true);
    try {
      const screenshots = await readFilesAsBase64(files);
      const resp = await submitSupportRequest({
        fullName: fullName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        email: email.trim(),
        briefDescription: briefDescription.trim(),
        orderNumber: orderNumber.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
        screenshots,
      });
      if (resp?.caseNumber) {
        setCaseNumber(resp.caseNumber);
      }
      setFullName("");
      setCompanyName("");
      setEmail("");
      setOrderNumber("");
      setBriefDescription("");
      setAdditionalContext("");
      setFiles(null);
    } catch (err: any) {
      setError(err?.message || "Failed to send support request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full name (optional)</label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Company name (optional)</label>
          <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Order number (optional)</label>
        <Input value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Brief description</label>
        <textarea
          value={briefDescription}
          onChange={(e) => setBriefDescription(e.target.value)}
          rows={5}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Additional context (optional)</label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={3}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Screenshots or files (optional, up to 5)</label>
        <input type="file" multiple onChange={handleFilesChange} className="text-sm" accept="image/*" />
      </div>

      {error && <div className="text-sm text-red-700">{error}</div>}
      {caseNumber && <div className="text-sm text-green-700">Submitted — case number: {caseNumber}</div>}

      <div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700" disabled={submitting}>
          {submitting ? 'Sending...' : 'Submit Support Request'}
        </button>
      </div>
    </form>
  );
}
