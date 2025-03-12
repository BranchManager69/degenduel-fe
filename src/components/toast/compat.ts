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

// Get the context directly
const getToastContext = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

// Create a toast API that matches react-hot-toast
const createToast = (type: ToastType, message: string, title?: string) => {
  const context = getToastContext() as ToastContextType;
  context.addToast(type, message, title);
  return message; // Return message as ID for consistency with react-hot-toast
};

// Basic toast function that matches react-hot-toast API
export const toast = {
  // Success toast
  success: (message: string, options?: any) => {
    return createToast("success", message, options?.title);
  },

  // Error toast
  error: (message: string, options?: any) => {
    return createToast("error", message, options?.title);
  },

  // Warning toast
  warning: (message: string, options?: any) => {
    return createToast("warning", message, options?.title);
  },

  // Info toast
  info: (message: string, options?: any) => {
    return createToast("info", message, options?.title);
  },

  // Basic toast (fallback to info)
  custom: (message: string, options?: any) => {
    const type = (options?.type as ToastType) || "info";
    return createToast(type, message, options?.title);
  },

  // Default toast (alias for info)
  default: function (message: string, options?: any) {
    return this.info(message, options);
  },
};

// Export the hook version too for components that need it
export function useToast() {
  return toast;
}
