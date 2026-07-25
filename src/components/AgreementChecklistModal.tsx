"use client";
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface AgreementItem {
  id: string;
  label: React.ReactNode;
  required?: boolean;
}

interface AgreementChecklistModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  agreements: AgreementItem[];
  values: Record<string, boolean>;
  onToggle: (id: string, value: boolean) => void;
  onConfirm: () => void;
  confirmLabel: string;
  confirmDisabled?: boolean;
  error?: string | null;
}

export function AgreementChecklistModal({
  open,
  onOpenChange,
  title,
  description,
  agreements,
  values,
  onToggle,
  onConfirm,
  confirmLabel,
  confirmDisabled,
  error,
}: AgreementChecklistModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? <DialogDescription>{description}</DialogDescription> : null}
        </DialogHeader>
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          <div className="space-y-4">
            {agreements.map((agreement) => (
              <label key={agreement.id} className="flex items-start gap-3 text-sm text-cream-800/80">
                <input
                  type="checkbox"
                  checked={Boolean(values[agreement.id])}
                  onChange={(event) => onToggle(agreement.id, event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-cream-200 text-brand-500 focus:ring-brand-500"
                />
                <span>
                  {agreement.label}
                  {agreement.required ? (
                    <span className="ml-1 text-red-600">*</span>
                  ) : (
                    <span className="ml-2 text-xs text-cream-800/40 bg-cream-100 px-2 py-0.5 rounded-full">Optional</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        </div>
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button onClick={onConfirm} disabled={Boolean(confirmDisabled)}>{confirmLabel}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
