import React, { useEffect, useRef, useState } from "react";

import { ToastBackground } from "./ToastBackground";
import { ToastType } from "./ToastContext";

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
  onClose: (id: string) => void;
  isStacked?: boolean;
}

const typeConfig = {
  success: {
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-200",
    background: "rgba(6, 37, 30, 0.95)",
    borderColor: "rgba(16, 185, 129, 0.2)",
    color: "#10b981", // Emerald color for particle effects
  },
  error: {
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    gradient: "from-red-500 to-rose-600",
    text: "text-red-200",
    background: "rgba(51, 17, 17, 0.98)",
    borderColor: "rgba(239, 68, 68, 0.2)",
    color: "#ef4444", // Red color for particle effects
  },
  warning: {
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-200",
    background: "rgba(45, 26, 3, 0.97)",
    borderColor: "rgba(245, 158, 11, 0.2)",
    color: "#f59e0b", // Amber color for particle effects
  },
  info: {
    icon: () => (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    gradient: "from-[#9933ff] to-[#6600cc]",
    text: "text-purple-200",
    background: "rgba(26, 19, 51, 0.93)",
    borderColor: "rgba(153, 51, 255, 0.2)",
    color: "#9933ff", // Purple color for particle effects
  },
};

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  title,
  onClose,
  isStacked = false,
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const config = typeConfig[type];
  const Icon = config.icon;

  useEffect(() => {
    const startTime = Date.now();
    const duration = 14700; // Slightly less than the 15000ms timeout to ensure animation completes

    const tick = () => {
      if (isPaused) return;

      const elapsed = Date.now() - startTime;
      const remaining = duration - elapsed;

      if (remaining <= 0) {
        handleClose();
      } else {
        timerRef.current = setTimeout(tick, 10);
      }
    };

    timerRef.current = setTimeout(tick, 10);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isPaused]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };

  return (
    <div
      className={`
        transform-gpu transition-all duration-300
        ${isExiting ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}
        ${isStacked ? "pointer-events-none" : "pointer-events-auto"}
      `}
    >
      <div
        className="relative group mx-4 md:mx-0"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="relative overflow-hidden">
          {/* ThreeJS Particle Background */}
          <ToastBackground color={config.color} type={type} />

          <div
            className="relative flex border-t border-b backdrop-blur-sm"
            style={{
              background: config.background,
              borderColor: config.borderColor,
            }}
          >
            <div
              className={`
                flex-shrink-0 flex items-center px-4 py-4 border-r border-white/10 
                ${config.text}
              `}
            >
              <Icon />
            </div>
            <div className="flex-1 min-w-0 p-4 pr-12">
              {title && (
                <h4 className={`${config.text} font-semibold mb-1`}>{title}</h4>
              )}
              <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
            </div>
            <button
              onClick={handleClose}
              className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[rgba(255,255,255,0.1)] z-10">
            <div
              className={`h-full bg-gradient-to-r ${config.gradient}`}
              style={{
                width: isPaused ? "inherit" : "0%",
                transition: isPaused ? "none" : "width 15s linear",
                animationPlayState: isPaused ? "paused" : "running",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
