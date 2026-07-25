// Cross-page in-memory buffer for files that the Home page picked but
// which should be consumed by the Studio page after navigation.
// File objects are not JSON-serializable, so we cannot use sessionStorage
// or localStorage here - we need to hand off the actual File objects.
//
// IMPORTANT: this buffer is attached directly to `window` rather than kept
// as a plain module-level variable. Next.js (particularly with Turbopack)
// can sometimes load a given module as more than one separate instance
// across different route chunks. If that happens with a plain module-level
// variable, the Home page and the Studio page end up reading and writing
// to two different copies of `pending`, and the handoff silently fails.
// Attaching the buffer to `window` guarantees both pages always share the
// exact same storage, regardless of how the code gets bundled.

declare global {
  interface Window {
    __pendingUploadFiles__?: File[];
  }
}

function getStore(): File[] {
  if (typeof window === "undefined") return [];
  if (!window.__pendingUploadFiles__) {
    window.__pendingUploadFiles__ = [];
  }
  return window.__pendingUploadFiles__;
}

export function setPendingUploadFiles(files: File[]) {
  if (typeof window === "undefined") return;
  window.__pendingUploadFiles__ = files.slice(0, 15);
}

export function consumePendingUploadFiles(): File[] {
  if (typeof window === "undefined") return [];
  const out = getStore();
  window.__pendingUploadFiles__ = [];
  return out;
}

export function peekPendingUploadFiles(): File[] {
  return getStore();
}
