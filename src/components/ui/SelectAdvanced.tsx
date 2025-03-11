import React from "react";
import { cn } from "../../lib/utils";

// SelectRoot
interface SelectProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
  onValueChange: (value: string) => void; 
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("relative", className)} {...props}>
        {children}
      </div>
    );
  }
);

// SelectTrigger
interface SelectTriggerProps extends React.ComponentPropsWithoutRef<"button"> {}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "flex items-center justify-between w-full px-3 py-2 text-sm rounded-md",
          "border border-dark-300 bg-dark-200/80 text-gray-200",
          "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent",
          className
        )}
        {...props}
      >
        {children}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-4 w-4 ml-2 text-gray-400" 
          viewBox="0 0 20 20" 
          fill="currentColor"
        >
          <path 
            fillRule="evenodd" 
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
            clipRule="evenodd" 
          />
        </svg>
      </button>
    );
  }
);

// SelectValue
interface SelectValueProps extends React.ComponentPropsWithoutRef<"span"> {
  placeholder?: string;
}

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ className, placeholder, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn("flex-grow truncate", className)}
        {...props}
      >
        {children || placeholder}
      </span>
    );
  }
);

// SelectContent
interface SelectContentProps extends React.ComponentPropsWithoutRef<"div"> {}

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "absolute z-50 min-w-[8rem] w-full overflow-hidden rounded-md mt-1",
          "border border-dark-300 bg-dark-100 shadow-lg",
          className
        )}
        {...props}
      >
        <div className="py-1">{children}</div>
      </div>
    );
  }
);

// SelectItem
interface SelectItemProps extends React.ComponentPropsWithoutRef<"div"> {
  value: string;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center px-3 py-2",
          "text-sm text-gray-300 hover:bg-dark-200 hover:text-white",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);