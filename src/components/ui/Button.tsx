import React from "react";
import { cn } from "../../lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "gradient";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", size = "md", children, ...props },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center clip-edges font-cyber transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-500/50",
          "disabled:opacity-50 disabled:cursor-not-allowed relative group overflow-hidden",
          {
            "bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 text-white":
              variant === "primary",
            "bg-dark-200/40 backdrop-blur-sm border border-gray-700/50 text-gray-300 hover:bg-dark-200/60 hover:border-gray-600/50":
              variant === "secondary",
            "border border-brand-500/20 bg-dark-200/40 backdrop-blur-sm hover:bg-dark-200/60 hover:border-brand-400/30 text-brand-400 hover:text-brand-300":
              variant === "outline",
            "bg-gradient-to-r from-brand-500 to-purple-600 text-white hover:from-brand-400 hover:to-purple-500":
              variant === "gradient",
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-base": size === "md",
            "px-6 py-3 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      >
        <span className="relative z-10 flex items-center justify-center">
          {children}
        </span>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
      </button>
    );
  }
);
