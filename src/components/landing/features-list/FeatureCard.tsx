// src/components/landing/features-list/FeatureCard.tsx

/**
 * This component is a simplified version of the FeatureCard component.
 * It is used to display a single feature card with a minimalistic design.
 * It is used in the FeaturesList component to display a list of features.
 */

import React, { useEffect, useRef } from "react";
import {
  MeasureRender,
  usePerformanceMeasure,
} from "../../../utils/performance";

// Enable performance logging for debugging (WebGL, canvas, etc.)
const DEBUG_PERFORMANCE = true;

interface FeatureCardProps {
  title: string;
  description: string;
  icon: JSX.Element;
  gradient?: string; // Keeping this for compatibility with Features.tsx
  isUpcoming?: boolean;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  isUpcoming = false,
}) => {
  // No need to track hover state anymore

  // Generate a seed for deterministic patterns
  const seed = title
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Performance measurement for canvas operations - conditionally create based on DEBUG_PERFORMANCE
  const canvasPerf = DEBUG_PERFORMANCE
    ? usePerformanceMeasure("FeatureCard-canvas")
    : { start: () => {}, end: () => {} }; // Provide no-op functions when debugging is disabled

  // Pre-calculate candle data outside useEffect for better performance
  const calculateCandleData = (seed: number, count: number) => {
    const data: { isUp: boolean; height: number }[] = [];

    // Deterministic random function
    const random = (s: number, i: number) => {
      return (Math.sin(s + i * 100) + 1) / 2; // 0-1 value
    };

    for (let i = 0; i < count; i++) {
      const randVal = random(seed, i);
      const isUp = randVal > 0.5;

      // Calculate height - taller toward edges for visual effect
      const centerDistanceFactor = Math.abs(i / (count - 1) - 0.5) * 2; // 0 at center, 1 at edges
      const heightFactor = 0.5 + centerDistanceFactor * 0.5; // 0.5-1.0
      const height = heightFactor * (0.3 + randVal * 0.4); // Normalized height

      data.push({ isUp, height });
    }

    return data;
  };

  // Pre-calculate the data
  const CANDLE_COUNT = 5; // Very few candles for maximum performance
  const candleData = calculateCandleData(seed, CANDLE_COUNT);

  // Draw minimal, efficient red/green candles pattern with subtle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false }); // Disable alpha for performance
    if (!ctx) return;

    let animationId: number | NodeJS.Timeout;
    let startTime = performance.now();

    // Animation function
    const animate = () => {
      canvasPerf.start();

      // Constants for better performance
      const WIDTH = canvas.width;
      const HEIGHT = canvas.height;
      const CANDLE_WIDTH = WIDTH / (CANDLE_COUNT * 2);
      const CANDLE_SPACING = CANDLE_WIDTH;

      // Pre-compute colors for better performance
      const GREEN = isUpcoming ? "#3b82f6" : "#22c55e";
      const RED = isUpcoming ? "#6366f1" : "#dc2626";
      const BG_COLOR = isUpcoming ? "#1e1a42" : "#1a1333";

      // Get current time for animation
      const now = performance.now();
      const elapsed = now - startTime;

      // Clear canvas with background color (faster than clearRect + fillRect)
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Draw abstract candle representation
      for (let i = 0; i < CANDLE_COUNT; i++) {
        const { isUp, height } = candleData[i];

        // Determine candle position
        const x = i * (CANDLE_WIDTH + CANDLE_SPACING) + CANDLE_SPACING / 2;

        // Simple vertical oscillation based on time - unique for each candle
        // Small amplitude (2px) and different frequency per candle for visual interest
        const offsetY = Math.sin(elapsed / 1000 + i * 1.5) * 2;

        // Candle positioning - stagger for visual interest, with animation offset
        const yBottom = HEIGHT;
        const yTop = yBottom - height * HEIGHT + offsetY;

        // Select color based on direction
        ctx.fillStyle = isUp ? GREEN : RED;

        // Draw simplified candle without rounded corners
        ctx.fillRect(x, yTop, CANDLE_WIDTH, height * HEIGHT);
      }

      // Horizontal line with subtle wave
      ctx.strokeStyle = isUpcoming ? "#3b82f6" : "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.beginPath();

      // Wavy line with minimal calculation
      const lineY = HEIGHT * 0.4;
      ctx.moveTo(0, lineY + Math.sin(elapsed / 1000) * 1);

      // Just one control point in the middle for minimal processing
      const midX = WIDTH / 2;
      const midY = lineY + Math.sin(elapsed / 800 + 2) * 1.5;

      ctx.lineTo(midX, midY);
      ctx.lineTo(WIDTH, lineY + Math.sin(elapsed / 1000 + 4) * 1);
      ctx.stroke();

      canvasPerf.end();

      // Request next frame at a reduced rate (every 100ms) for better performance
      animationId = setTimeout(() => {
        requestAnimationFrame(animate);
      }, 100); // 10fps instead of 60fps
    };

    // Start animation
    animate();

    // Clean up
    return () => {
      if (animationId) clearTimeout(animationId);
    };
  }, [candleData, isUpcoming, canvasPerf]);

  return (
    <MeasureRender id="FeatureCard" logThreshold={5}>
      <div
        className="relative overflow-hidden rounded-xl border border-opacity-20 h-full transform transition hover:scale-102"
        style={{
          borderColor: isUpcoming ? "#3b82f6" : "#a855f7",
          backgroundColor: isUpcoming
            ? "rgba(30, 26, 66, 0.7)"
            : "rgba(26, 19, 51, 0.7)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Bottom stripe with candles visualization - minimal implementation */}
        <div className="absolute bottom-0 left-0 right-0 h-10 overflow-hidden">
          <canvas
            ref={canvasRef}
            width={250}
            height={40}
            className="w-full h-full"
          />
        </div>

        {/* Content area */}
        <div className="relative z-10 p-4 pb-12">
          {/* SOON tag - simplified */}
          {isUpcoming && (
            <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-400"></div>
          )}

          {/* Title - simplified typography */}
          <h3
            className={`
            text-lg font-bold mb-2
            ${isUpcoming ? "text-blue-100" : "text-purple-100"}
          `}
          >
            {title}
          </h3>

          {/* Description - truncated with ellipsis for very long text */}
          <p
            className={`
            text-sm line-clamp-3
            ${isUpcoming ? "text-blue-200/80" : "text-purple-200/80"}
          `}
          >
            {description}
          </p>
        </div>

        {/* Left color accent bar - static, no animation */}
        <div
          className={`
            absolute top-0 left-0 bottom-0 w-1
            ${isUpcoming ? "bg-blue-500" : "bg-green-500"}
          `}
        />
      </div>
    </MeasureRender>
  );
};
