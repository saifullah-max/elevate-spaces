export type MarketplaceUpdateEvent =
  | { type: "photographer-approved"; photographerId?: string }
  | { type: "booking-request-created"; photographerId?: string; clientUserId?: string }
  | { type: "booking-request-updated"; photographerId?: string; clientUserId?: string };

const EVENT_NAME = "elevate:marketplace-update";
const STORAGE_KEY = "elevate:marketplace-update";

export function publishMarketplaceUpdate(event: MarketplaceUpdateEvent): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new CustomEvent<MarketplaceUpdateEvent>(EVENT_NAME, { detail: event }));

  try {
    const payload = { ...event, timestamp: Date.now() };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage write errors (private mode/quota) and keep in-tab event only.
  }
}

export function subscribeMarketplaceUpdates(handler: (event: MarketplaceUpdateEvent) => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const customListener: EventListener = (incomingEvent) => {
    const typedEvent = incomingEvent as CustomEvent<MarketplaceUpdateEvent>;
    if (typedEvent.detail) {
      handler(typedEvent.detail);
    }
  };

  const storageListener = (storageEvent: StorageEvent) => {
    if (storageEvent.key !== STORAGE_KEY || !storageEvent.newValue) return;

    try {
      const parsedEvent = JSON.parse(storageEvent.newValue) as MarketplaceUpdateEvent;
      if (parsedEvent?.type) {
        handler(parsedEvent);
      }
    } catch {
      // Ignore malformed storage payloads.
    }
  };

  window.addEventListener(EVENT_NAME, customListener);
  window.addEventListener("storage", storageListener);

  return () => {
    window.removeEventListener(EVENT_NAME, customListener);
    window.removeEventListener("storage", storageListener);
  };
}
