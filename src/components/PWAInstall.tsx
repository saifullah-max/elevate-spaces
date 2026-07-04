'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MoreVertical, Download } from 'lucide-react';

const INSTALL_DISMISSED_KEY = 'elevate_spaces_pwa_install_dismissed';
const INSTALL_INSTALLED_KEY = 'elevate_spaces_pwa_installed';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
}

export function PWAInstall() {
  const [isClientReady, setIsClientReady] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isMac, setIsMac] = useState(false);
  const [isWindows, setIsWindows] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  useEffect(() => {
    // In development, remove any existing SW/caches so UI updates are immediate.
    if (process.env.NODE_ENV !== 'production') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
      }

      if ('caches' in window) {
        caches.keys().then((cacheNames) => {
          cacheNames.forEach((cacheName) => {
            if (cacheName.startsWith('elevate-spaces-')) {
              caches.delete(cacheName);
            }
          });
        });
      }
    }

    const userAgent = navigator.userAgent;
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isAndroidDevice = /Android/i.test(userAgent);
    const isMacDevice = /Macintosh|Mac OS X/i.test(userAgent) && !isIOSDevice;
    const isWindowsDevice = /Windows/i.test(userAgent);

    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);
    setIsMac(isMacDevice);
    setIsWindows(isWindowsDevice);

    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY) === 'true';
    const previouslyInstalled = localStorage.getItem(INSTALL_INSTALLED_KEY) === 'true';
    setIsBannerDismissed(dismissed);

    const checkInstalled = () => {
      const standaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      const fullscreenMode = window.matchMedia('(display-mode: fullscreen)').matches;
      const iosStandalone = Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
      const installed = previouslyInstalled || standaloneMode || fullscreenMode || iosStandalone;

      setIsInstalled(installed);

      if (installed) {
        localStorage.setItem(INSTALL_INSTALLED_KEY, 'true');
        localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
      }
    };

    checkInstalled();

    const handleBeforeInstallPrompt = (e: Event) => {
      const installEvent = e as BeforeInstallPromptEvent;
      e.preventDefault();
      setDeferredPrompt(installEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setIsBannerDismissed(true);
      localStorage.setItem(INSTALL_INSTALLED_KEY, 'true');
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((registration) => {
        })
        .catch((error) => {
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismissBanner = () => {
    setIsBannerDismissed(true);
    localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
  };

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsBannerDismissed(true);
      localStorage.setItem(INSTALL_INSTALLED_KEY, 'true');
      localStorage.setItem(INSTALL_DISMISSED_KEY, 'true');
      return;
    }

    dismissBanner();
  };

  const shouldShowInstallBanner = !isInstalled && !isBannerDismissed && (Boolean(deferredPrompt) || isIOS);

  if (!isClientReady) {
    return null;
  }

  return (
    <>
      {shouldShowInstallBanner && (
        <div className="fixed bottom-3 left-3 right-3 z-50 rounded-xl bg-indigo-600 p-4 text-white shadow-lg sm:bottom-4 sm:left-4 sm:right-4 md:left-auto md:w-full md:max-w-md">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="font-semibold">Install Elevate Spaces</p>
              <p className="mt-1 text-sm opacity-90">
                {isIOS
                  ? 'Install from Safari: tap Share, then Add to Home Screen.'
                  : 'Get faster access and an app-like experience on your device.'}
              </p>
            </div>
            <button
              onClick={dismissBanner}
              className="self-start rounded bg-white/15 px-2 py-1 text-xs font-semibold hover:bg-white/25 sm:self-auto"
            >
              Dismiss
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {!isIOS && deferredPrompt && (
              <button
                onClick={handleInstall}
                className="w-full rounded bg-white px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-gray-100 sm:w-auto"
              >
                Install now
              </button>
            )}
            <button
              onClick={() => setIsGuideOpen(true)}
              className="w-full rounded border border-white/30 px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 sm:w-auto"
            >
              Installation guide
            </button>
          </div>
        </div>
      )}

      {!shouldShowInstallBanner && !isInstalled && (
        <button
          onClick={() => setIsGuideOpen(true)}
          aria-label="Installation guide"
          title="Installation guide"
          className="fixed bottom-6 right-6 z-60 flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl ring-1 ring-indigo-300 hover:bg-indigo-700"
        >
          <Download className="h-5 w-5" />
        </button>
      )}

      <Dialog open={isGuideOpen} onOpenChange={setIsGuideOpen}>
        <DialogContent className="max-h-[85vh] w-[calc(100vw-1rem)] max-w-2xl overflow-y-auto p-4 sm:w-full sm:p-6">
          <DialogHeader>
            <DialogTitle>Install Elevate Spaces</DialogTitle>
            <DialogDescription>
              Follow the steps for your device. If you dismissed the browser prompt, you can still install manually from your browser menu.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-sm text-slate-700">
            {(isWindows || isMac) && (
              <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-3 sm:p-4">
                <p className="font-semibold text-indigo-900">Recommended for this device</p>
                <p className="mt-1 text-indigo-800">
                  {isWindows ? 'Windows desktop detected.' : 'Mac desktop detected.'}
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-3 sm:p-4">
                <h3 className="font-semibold text-slate-900">Windows</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Open Elevate Spaces in Chrome, Edge, or another Chromium browser.</li>
                  <li>Click the install icon in the address bar, or open the browser menu.</li>
                  <li>Select Install App or Apps &gt; Install this site as an app.</li>
                  <li>Confirm the install to add it to Start and taskbar.</li>
                  <li>If you can’t see any of these options, open the browser menu → <b>Cast, save, and share</b> → <b>Install page as app</b>.</li>
                </ol>
              </div>

              <div className="rounded-lg border p-3 sm:p-4">
                <h3 className="font-semibold text-slate-900">Mac</h3>

                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Open Elevate Spaces in Chrome or Edge on macOS.</li>

                  <li>
                    If you see an install icon in the address bar, click it and confirm
                    installation.
                  </li>

                  <li>
                    Alternatively, click the
                    <MoreVertical className="mx-1 inline h-4 w-4" />
                    menu (3 dots) at the top right.
                  </li>

                  <li>
                    Click <span className="font-medium">Cast, Save &amp; Share</span>
                    {" "}(it might be near the bottom).
                  </li>

                  <li>
                    Click <span className="font-medium">Install Page as App</span>.
                  </li>

                  <li>
                    Confirm to add it to your Applications folder and Dock.
                  </li>
                </ol>
              </div>

              <div className="rounded-lg border p-3 sm:p-4">
                <h3 className="font-semibold text-slate-900">Android</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Open Elevate Spaces in Chrome on Android.</li>
                  <li>If the browser prompt appears, tap Install.</li>
                  <li>If not, tap the three-dot menu and choose Install app or Add to Home screen.</li>
                  <li>Confirm to place the app on your home screen.</li>
                </ol>
              </div>

              <div className="rounded-lg border p-3 sm:p-4">
                <h3 className="font-semibold text-slate-900">iPhone / iPad</h3>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  <li>Open Elevate Spaces in Safari.</li>
                  <li>Tap the Share button at the bottom or top of the screen.</li>
                  <li>Select Add to Home Screen.</li>
                  <li>Tap Add to install it on your home screen.</li>
                </ol>
              </div>
            </div>

            {!isIOS && deferredPrompt && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 sm:p-4">
                <p className="font-semibold text-emerald-900">Quick install available</p>
                <p className="mt-1 text-emerald-800">Your browser supports direct install right now.</p>
                <button
                  onClick={handleInstall}
                  className="mt-3 w-full rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 sm:w-auto"
                >
                  Install now
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
