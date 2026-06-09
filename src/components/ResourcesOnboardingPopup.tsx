'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

const RESOURCES_ONBOARDING_FLAG = 'elevate_spaces_show_resources_onboarding';
const SIGNUP_AT_KEY = 'elevate_spaces_signup_at';
const RESOURCES_VISIBILITY_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function ResourcesOnboardingPopup() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const signupAtRaw = localStorage.getItem(SIGNUP_AT_KEY);
    const signupAt = signupAtRaw ? Number(signupAtRaw) : null;
    const now = Date.now();
    const withinWindow = Boolean(signupAt && Number.isFinite(signupAt) && now - signupAt <= RESOURCES_VISIBILITY_WINDOW_MS);

    if (!withinWindow) {
      localStorage.removeItem(RESOURCES_ONBOARDING_FLAG);
      setReady(true);
      return;
    }

    const shouldShow = localStorage.getItem(RESOURCES_ONBOARDING_FLAG) === 'true';

    if (shouldShow) {
      setOpen(true);
      localStorage.removeItem(RESOURCES_ONBOARDING_FLAG);
    }

    setReady(true);
  }, []);

  const handleGoToResources = () => {
    setOpen(false);
    router.push('/resources');
  };

  if (!ready) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
        <DialogTitle>New to the platform?</DialogTitle>
          <DialogDescription>
            Resources are in process right now, but you can still open the resources area when it becomes available.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Maybe later
          </Button>
          <Button onClick={handleGoToResources} className="bg-indigo-600 hover:bg-indigo-700">
            Open resources
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
