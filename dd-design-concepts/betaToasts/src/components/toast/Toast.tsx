import React, { useEffect, useState, useRef } from "react";
import { CheckCircleIcon, XCircleIcon, AlertCircleIcon, InfoIcon, XIcon } from "lucide-react";
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
    icon: CheckCircleIcon,
    gradient: "from-emerald-500 to-teal-600",
    text: "text-emerald-200",
    background: "rgba(6, 37, 30, 0.95)",
    borderColor: "rgba(16, 185, 129, 0.2)"
  },
  error: {
    icon: XCircleIcon,
    gradient: "from-red-500 to-rose-600",
    text: "text-red-200",
    background: "rgba(51, 17, 17, 0.98)",
    borderColor: "rgba(239, 68, 68, 0.2)"
  },
  warning: {
    icon: AlertCircleIcon,
    gradient: "from-amber-500 to-orange-600",
    text: "text-amber-200",
    background: "rgba(45, 26, 3, 0.97)",
    borderColor: "rgba(245, 158, 11, 0.2)"
  },
  info: {
    icon: InfoIcon,
    gradient: "from-[#9933ff] to-[#6600cc]",
    text: "text-purple-200",
    background: "rgba(26, 19, 51, 0.93)",
    borderColor: "rgba(153, 51, 255, 0.2)"
  }
};
export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  title,
  onClose,
  isStacked = false
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const config = typeConfig[type];
  const Icon = config.icon;
  useEffect(() => {
    const startTime = Date.now();
    const duration = 14700;
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
    return () => timerRef.current && clearTimeout(timerRef.current);
  }, [isPaused]);
  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => onClose(id), 300);
  };
  return <div className={`
      transform-gpu transition-all duration-300
      ${isExiting ? "animate-toast-exit" : "animate-toast-enter"}
      ${isStacked ? "pointer-events-none" : "pointer-events-auto"}
    `}>
      <div className="relative group mx-4 md:mx-0" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
        <div className="relative">
          <div className="relative flex border-t border-b" style={{
          background: config.background,
          borderColor: config.borderColor
        }}>
            <div className={`
              flex-shrink-0 flex items-center px-4 py-4 border-r border-white/10 
              ${config.text}
            `}>
              <Icon className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0 p-4 pr-12">
              {title && <h4 className={`${config.text} font-semibold mb-1`}>{title}</h4>}
              <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
            </div>
            <button onClick={handleClose} className="absolute top-3 right-3 p-1.5 text-gray-400 hover:text-gray-200">
              <XIcon className="w-4 h-4" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[rgba(255,255,255,0.1)]">
            <div className={`h-full bg-gradient-to-r ${config.gradient}`} style={{
            width: isPaused ? "inherit" : "0%",
            transition: isPaused ? "none" : "width 15s linear",
            animationPlayState: isPaused ? "paused" : "running"
          }} />
          </div>
        </div>
      </div>
    </div>;
};