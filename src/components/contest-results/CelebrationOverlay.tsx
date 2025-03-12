import confetti from "canvas-confetti";
import React, { useEffect, useState, useRef } from "react";

interface CelebrationOverlayProps {
  finalValue: number;
  initialValue: number;
}

export const CelebrationOverlay: React.FC<CelebrationOverlayProps> = ({
  finalValue,
  initialValue,
}) => {
  const [show, setShow] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const percentageChange = ((finalValue - initialValue) / initialValue) * 100;
  const isWinner = percentageChange > 0;
  const isBreakEven = Math.abs(percentageChange) < 0.01;

  useEffect(() => {
    if (isBreakEven) return;

    if (overlayRef.current && contentRef.current) {
      // Initial animation
      overlayRef.current.style.opacity = "0";
      contentRef.current.style.transform = "scale(0.5)";

      requestAnimationFrame(() => {
        if (overlayRef.current && contentRef.current) {
          overlayRef.current.style.opacity = "1";
          overlayRef.current.style.transition = "opacity 0.5s ease-out";
          contentRef.current.style.transform = "scale(1)";
          contentRef.current.style.transition =
            "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)";
        }
      });

      if (isWinner) {
        const colors = ["#c084fc", "#a855f7", "#9333ea", "#7e22ce"];
        const end = Date.now() + 4000;

        const frame = () => {
          const now = Date.now();
          if (now > end) return;

          // Left side
          confetti({
            particleCount: 4,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.6 },
            colors: colors,
            startVelocity: 45,
            gravity: 1,
            drift: 0,
            ticks: 300,
          });

          // Right side
          confetti({
            particleCount: 4,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.6 },
            colors: colors,
            startVelocity: 45,
            gravity: 1,
            drift: 0,
            ticks: 300,
          });

          requestAnimationFrame(frame);
        };

        frame();
      }
    }

    const timer = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(timer);
  }, [isWinner, isBreakEven]);

  if (!show || isBreakEven) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
    >
      <div
        ref={contentRef}
        className={`relative p-12 rounded-2xl shadow-2xl ${
          isWinner
            ? "bg-gradient-to-br from-dark-200/95 to-dark-300/95 border-2 border-brand-500/50"
            : "bg-gradient-to-br from-dark-200/95 to-dark-300/95 border-2 border-red-500/50"
        }`}
      >
        <div className="text-center space-y-6">
          {isWinner ? (
            <>
              <div className="text-6xl font-black bg-gradient-to-r from-brand-400 to-brand-600 text-transparent bg-clip-text animate-pulse">
                WHAT A CHAD!
              </div>
              <div className="text-2xl text-gray-100">
                You crushed it with a{" "}
                <span className="text-green-400">
                  +{percentageChange.toFixed(1)}%
                </span>{" "}
                return!
              </div>
              <div className="text-4xl animate-bounce">🚀💎🔥</div>
            </>
          ) : (
            <>
              <div className="text-6xl font-black bg-gradient-to-r from-red-400 to-orange-600 text-transparent bg-clip-text animate-pulse">
                YOU SUCK AT TRADING!
              </div>
              <div className="text-2xl text-gray-100">
                Down bad with a{" "}
                <span className="text-red-400">
                  {percentageChange.toFixed(1)}%
                </span>{" "}
                loss...
              </div>
              <div className="text-4xl animate-bounce">📉💸😭</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
