// This file provides a compatibility layer for react-hot-toast API
// It adapts our custom toast implementation to match react-hot-toast's API

import { useContext } from "react";

import { ToastContext, ToastType, ToastMessage } from "./ToastContext";

// Interface to match the shape of the context
interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

// Extended toast options interface
interface ToastOptions {
  title?: string;
  duration?: number;
  id?: string;
}

// Get the context directly
const getToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Create a toast API that matches react-hot-toast
const createToast = (type: ToastType, message: string, options?: ToastOptions) => {
  const context = getToastContext() as ToastContextType;
  context.addToast(type, message, options?.title);
  return options?.id || message; // Return id or message as ID for consistency with react-hot-toast
};

// Basic toast function that matches react-hot-toast API
export const toast = {
  // Success toast
  success: (message: string, options?: ToastOptions) => {
    return createToast("success", message, options);
  },

  // Error toast
  error: (message: string, options?: ToastOptions) => {
    return createToast("error", message, options);
  },

  // Warning toast
  warning: (message: string, options?: ToastOptions) => {
    return createToast("warning", message, options);
  },

  // Info toast
  info: (message: string, options?: ToastOptions) => {
    return createToast("info", message, options);
  },

  // Basic toast (fallback to info)
  custom: (message: string, options?: ToastOptions & { type?: ToastType }) => {
    const type = options?.type || "info";
    return createToast(type, message, options);
  },

  // Default toast (alias for info)
  default: function (message: string, options?: ToastOptions) {
    return this.info(message, options);
  },
};

// Export the hook version too for components that need it
export function useToast() {
  return toast;
}

// Since we're using direct toast import in WebSocketManager,
// we don't need to add toast to the store anymore.
// This was causing TypeScript errors anyway since the store
// type definition doesn't include a showToast method.

// Export a more specific interface for toast options
export interface ToastExtendedOptions {
  title?: string;
  duration?: number;
  id?: string;
}
