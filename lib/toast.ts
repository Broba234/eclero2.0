import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export const showToast = (options: ToastOptions) => {
  const { title, message, type, duration } = options;

  const opts = { description: title ? message : undefined, duration };
  const text = title ?? message;

  switch (type) {
    case 'success':
      sonnerToast.success(text, opts);
      break;
    case 'error':
      sonnerToast.error(text, opts);
      break;
    case 'warning':
      sonnerToast.warning(text, opts);
      break;
    case 'info':
      sonnerToast.info(text, opts);
      break;
    default:
      sonnerToast(text, opts);
  }
};

export const toast = {
  success: (message: string, title?: string) =>
    showToast({ type: 'success', message, title }),

  error: (message: string, title?: string) =>
    showToast({ type: 'error', message, title }),

  warning: (message: string, title?: string) =>
    showToast({ type: 'warning', message, title }),

  info: (message: string, title?: string) =>
    showToast({ type: 'info', message, title }),
};
