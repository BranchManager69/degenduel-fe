import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "destructive" | "gold" | "success" | "warning" | "error";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variantClasses = {
    default: "bg-brand-500 text-white",
    secondary: "bg-cyber-500 text-white",
    destructive: "bg-red-500 text-white",
    gold: "bg-yellow-400 text-dark-300",
    success: "bg-green-500 text-dark-300",
    warning: "bg-yellow-500 text-dark-300",
    error: "bg-red-500 text-dark-300",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
