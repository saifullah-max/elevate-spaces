import { toast, ToastOptions } from 'react-toastify';

export function showInfo(message: string, options?: ToastOptions) {
  toast.info(message, {
    position: 'top-center',
    autoClose: 7000,
    ...options,
  });
}

export function showSuccess(message: string, options?: ToastOptions) {
  toast.success(message, {
    position: 'top-center',
    autoClose: 5000,
    ...options,
  });
}

export function showError(message: string, options?: ToastOptions) {
  toast.error(message, {
    position: 'top-center',
    autoClose: 7000,
    ...options,
  });
}
