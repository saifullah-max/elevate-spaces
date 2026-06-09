"use client";

import React, { useMemo, useState } from "react";
import { CheckCircle2, Loader2, Paperclip, Upload, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { submitSupportRequest } from "@/services/payment.service";

interface SupportRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultFullName?: string;
  defaultEmail?: string;
}

type ScreenshotAttachment = {
  file: File;
  previewUrl: string;
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      const base64 = result.includes(",") ? result.split(",")[1] : result;
      resolve(base64);
    };
    reader.onerror = () => reject(new Error("Failed to read screenshot file"));
    reader.readAsDataURL(file);
  });
}

export function SupportRequestDialog({ open, onOpenChange, defaultFullName = "", defaultEmail = "" }: SupportRequestDialogProps) {
  const [fullName, setFullName] = useState(defaultFullName);
  const [email, setEmail] = useState(defaultEmail);
  const [briefDescription, setBriefDescription] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");
  const [screenshots, setScreenshots] = useState<ScreenshotAttachment[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseNumber, setCaseNumber] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return fullName.trim() && email.trim() && briefDescription.trim() && !submitting;
  }, [fullName, email, briefDescription, submitting]);

  const resetForm = () => {
    setFullName(defaultFullName);
    setEmail(defaultEmail);
    setBriefDescription("");
    setOrderNumber("");
    setAdditionalContext("");
    setScreenshots([]);
    setError(null);
    setCaseNumber(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
    }
    onOpenChange(nextOpen);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const allowed = Math.max(0, 3 - screenshots.length);
    const sliced = files.slice(0, allowed).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setScreenshots((previous) => [...previous, ...sliced]);
    event.target.value = "";
  };

  const removeScreenshot = (index: number) => {
    setScreenshots((previous) => {
      const next = previous.filter((_, currentIndex) => currentIndex !== index);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError("Please fill in your full name, email, and a brief description.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const attachments = await Promise.all(
        screenshots.map(async ({ file }) => ({
          filename: file.name,
          content: await fileToBase64(file),
          type: file.type || "application/octet-stream",
        }))
      );

      const response = await submitSupportRequest({
        fullName: fullName.trim(),
        email: email.trim(),
        briefDescription: briefDescription.trim(),
        orderNumber: orderNumber.trim() || undefined,
        additionalContext: additionalContext.trim() || undefined,
        screenshots: attachments,
      });

      setCaseNumber(response.caseNumber);
    } catch (submitError: any) {
      setError(submitError?.message || "Failed to send support request");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Support Request</DialogTitle>
          <DialogDescription>
            Share the details below and we’ll reply by email with a case number.
          </DialogDescription>
        </DialogHeader>

        {caseNumber ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold text-emerald-900">Request submitted</p>
                <p className="text-sm text-emerald-800">Your case number is <span className="font-semibold">{caseNumber}</span>.</p>
                <p className="mt-1 text-sm text-emerald-800">Please keep this for follow-up.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {error ? (
              <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {error}
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
                <Input value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Email address</label>
                <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Brief description</label>
              <textarea
                value={briefDescription}
                onChange={(event) => setBriefDescription(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Briefly describe your request or issue"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Order number</label>
              <Input value={orderNumber} onChange={(event) => setOrderNumber(event.target.value)} placeholder="Order number or invoice ID" />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Additional context</label>
              <textarea
                value={additionalContext}
                onChange={(event) => setAdditionalContext(event.target.value)}
                rows={4}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                placeholder="Add any extra details, screenshots, or context here"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Screenshots</label>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3">
                <Upload className="h-4 w-4 text-slate-500" />
                <div className="flex-1">
                  <p className="text-sm text-slate-700">Attach screenshots if available</p>
                  <p className="text-xs text-slate-500">Up to 3 images. PNG/JPG preferred.</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                  <Paperclip className="h-4 w-4" />
                  Add files
                  <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileChange} />
                </label>
              </div>

              {screenshots.length > 0 && (
                <div className="mt-3 space-y-2">
                  {screenshots.map((attachment, index) => (
                    <div key={`${attachment.file.name}-${index}`} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-800">{attachment.file.name}</p>
                        <p className="text-xs text-slate-500">{Math.round(attachment.file.size / 1024)} KB</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeScreenshot(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {caseNumber ? (
            <Button type="button" onClick={() => handleClose(false)}>
              Close
            </Button>
          ) : (
            <>
              <Button type="button" variant="outline" onClick={() => handleClose(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Submit Support Request"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}