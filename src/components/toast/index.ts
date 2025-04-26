// Export components from ToastContext
export { ToastProvider } from "./ToastContext";
export type { ToastType, ToastMessage } from "./ToastContext";

// Export components
export * from "./Toast";
export * from "./ToastContainer";
export * from "./ToastListener";

// Export compat layer with its useToast
export * from "./compat";

// Re-export the original useToast as our preferred hook
export { useToast as useCustomToast } from "./ToastContext";
