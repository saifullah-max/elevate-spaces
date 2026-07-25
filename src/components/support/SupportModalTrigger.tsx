"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import SupportForm from "@/components/support/SupportForm";

type SupportModalTriggerProps = {
  children: React.ReactNode;
  className?: string;
};

export default function SupportModalTrigger({ children, className }: SupportModalTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Submit your issue and we’ll reply by email with a case number.
            </DialogDescription>
          </DialogHeader>

          <SupportForm />
        </DialogContent>
      </Dialog>
    </>
  );
}