import React, { useCallback, useState, createContext, useContext } from "react";
export type ToastType = "success" | "error" | "warning" | "info";
export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}
interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (type: ToastType, message: string, title?: string) => void;
  removeToast: (id: string) => void;
}
const ToastContext = createContext<ToastContextType | undefined>(undefined);
export const ToastProvider: React.FC<{
  children: React.ReactNode;
}> = ({
  children
}) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((type: ToastType, message: string, title?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(currentToasts => [...currentToasts, {
      id,
      type,
      message,
      title
    }]);
    // Extended to 15 seconds (from 5)
    setTimeout(() => {
      setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
    }, 15000);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts(currentToasts => currentToasts.filter(toast => toast.id !== id));
  }, []);
  return <ToastContext.Provider value={{
    toasts,
    addToast,
    removeToast
  }}>
      {children}
    </ToastContext.Provider>;
};
export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};