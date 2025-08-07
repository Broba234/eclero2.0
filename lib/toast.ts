// Simple toast utility that can be replaced with a more sophisticated toast library later
// For now, this uses browser alert, but can be enhanced with proper toast UI

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  type: ToastType;
  duration?: number; // Duration in milliseconds (not used for alerts)
}

/**
 * Shows a toast notification
 * Currently uses browser alert, but can be enhanced with proper toast UI
 */
export const showToast = (options: ToastOptions) => {
  const { title, message, type } = options;
  
  // Format the message with type and optional title
  let fullMessage = '';
  
  switch (type) {
    case 'success':
      fullMessage = `✅ ${title ? `${title}: ` : ''}${message}`;
      break;
    case 'error':
      fullMessage = `❌ ${title ? `${title}: ` : ''}${message}`;
      break;
    case 'warning':
      fullMessage = `⚠️ ${title ? `${title}: ` : ''}${message}`;
      break;
    case 'info':
      fullMessage = `ℹ️ ${title ? `${title}: ` : ''}${message}`;
      break;
    default:
      fullMessage = `${title ? `${title}: ` : ''}${message}`;
  }
  
  // Use alert for now - this can be replaced with proper toast library
  alert(fullMessage);
  
  // Also log to console for debugging
  console.log(`Toast [${type.toUpperCase()}]:`, fullMessage);
};

/**
 * Convenience methods for different toast types
 */
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
