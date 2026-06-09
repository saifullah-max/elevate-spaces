import { toast, ToastOptions } from 'react-toastify';
import { ReactNode } from 'react';

function withSafeAutoDismiss(
  createToast: (message: string | ReactNode, opts: ToastOptions) => any,
  message: string | ReactNode,
  baseOptions: ToastOptions,
  options?: ToastOptions
) {
  const mergedOptions: ToastOptions = {
    closeOnClick: true,
    pauseOnHover: true,
    pauseOnFocusLoss: true,
    draggable: true,
    ...baseOptions,
    ...options,
  };

  const toastId = createToast(message, mergedOptions);
  const autoCloseMs = typeof mergedOptions.autoClose === 'number' ? mergedOptions.autoClose : 0;

  if (autoCloseMs > 0) {
    window.setTimeout(() => {
      toast.dismiss(toastId);
    }, autoCloseMs + 500);
  }

  return toastId;
}

export function showInfo(message: string | ReactNode, options?: ToastOptions) {
  return withSafeAutoDismiss(toast.info, message, {
    position: 'top-center',
    autoClose: 7000,
  }, options);
}

export function showSuccess(message: string | ReactNode, options?: ToastOptions) {
  return withSafeAutoDismiss(toast.success, message, {
    position: 'top-center',
    autoClose: 5000,
  }, options);
}

export function showError(message: string | ReactNode, options?: ToastOptions) {
  return withSafeAutoDismiss(toast.error, message, {
    position: 'top-center',
    autoClose: 7000,
  }, options);
}
