import * as ToastPrimitive from "@radix-ui/react-toast";
import React from "react";

import { cn } from "../../lib/utils";

interface ToastProps {
  title: string;
  description?: string;
  variant?: "default" | "success" | "error";
}

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:flex-col md:max-w-[420px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & ToastProps
>(({ className, variant = "default", title, description, ...props }, ref) => {
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
        {
          "bg-dark-300 border-dark-200": variant === "default",
          "bg-green-900/50 border-green-800": variant === "success",
          "bg-red-900/50 border-red-800": variant === "error",
        },
        className,
      )}
      {...props}
    >
      <div className="flex flex-col gap-1">
        <ToastPrimitive.Title className="text-sm font-semibold text-gray-100">
          {title}
        </ToastPrimitive.Title>
        {description && (
          <ToastPrimitive.Description className="text-sm text-gray-400">
            {description}
          </ToastPrimitive.Description>
        )}
      </div>
      <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-gray-400 opacity-0 transition-opacity hover:text-gray-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
        <span className="sr-only">Close</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

export const useToast = () => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const toast = ({ title, description, variant }: ToastProps) => {
    setToasts((prev) => [...prev, { title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
  };

  return { toast, toasts };
};
