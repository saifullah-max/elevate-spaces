// Module-level in-memory buffer for files that the Home page picked but
// which should be consumed by the Studio page after navigation.
// File objects are not JSON-serializable, so a module singleton is the
// simplest way to hand them off in a client-side navigation.
let pending: File[] = [];

export function setPendingUploadFiles(files: File[]) {
  pending = files.slice(0, 15);
}

export function consumePendingUploadFiles(): File[] {
  const out = pending;
  pending = [];
  return out;
}

export function peekPendingUploadFiles(): File[] {
  return pending;
}
