// src/utils/performance.tsx

/**
 * This file contains the MeasureRender component and the usePerformanceMeasure hook.
 * It is used to measure the performance of the application.
 * It is used to identify performance bottlenecks.
 * It is used to debug the performance of the application.
 *
 */

import React, { useEffect, useRef } from "react";
import { NODE_ENV } from "../config/config";

// Config
const LOG_THRESHOLD = 16.67 * 2; // 30 FPS

/**
 * Wrapper component to measure render performance
 *
 * Logs the rendering time and count for the wrapped component to help
 * identify performance bottlenecks
 */
export const MeasureRender = ({
  id,
  children,
  logToConsole = true,
  logThreshold = LOG_THRESHOLD, // Only log renders that take longer than this threshold (in ms)
}: {
  id: string;
  children: React.ReactNode;
  logToConsole?: boolean;
  logThreshold?: number;
}) => {
  const renderCount = useRef(0);
  const lastRender = useRef(performance.now());
  const renderTimes = useRef<number[]>([]);

  useEffect(() => {
    const now = performance.now();
    const timeSinceLastRender = now - lastRender.current;
    renderCount.current += 1;
    renderTimes.current.push(timeSinceLastRender);

    if (NODE_ENV === "development") {
      // Only log if the render time exceeds the threshold
      if (logToConsole && timeSinceLastRender > logThreshold) {
        console.log(`
          %c[${id}] Render #${
            renderCount.current
          }: ${timeSinceLastRender.toFixed(2)}ms`,
          timeSinceLastRender > 16.67
            ? "color:red;font-weight:bold"
            : "color:green"
        );
      }
    }

    // Add performance mark and measure for DevTools analysis
    performance.mark(`${id}-render-start`);
    performance.mark(`${id}-render-end`);
    performance.measure(
      `${id}-render-time`,
      `${id}-render-start`,
      `${id}-render-end`
    );

    lastRender.current = now;

    // Log statistics every 10 renders
    if (renderCount.current % 10 === 0 && logToConsole) {
      const times = renderTimes.current;
      const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
      const max = Math.max(...times);
      const min = Math.min(...times);
      console.log(
        `%c[${id}] Stats after ${renderCount.current} renders: 
        Avg: ${avg.toFixed(2)}ms, Min: ${min.toFixed(2)}ms, Max: ${max.toFixed(
          2
        )}ms`,
        "color:blue;font-weight:bold"
      );
    }

    return () => {
      // Clean up performance measures to avoid memory leaks
      performance.clearMarks(`${id}-render-start`);
      performance.clearMarks(`${id}-render-end`);
      performance.clearMeasures(`${id}-render-time`);
    };
  });

  return <>{children}</>;
};

/**
 * Hook to measure the performance of specific operations
 *
 * @returns An object with start and end functions to measure performance
 */
export const usePerformanceMeasure = (id: string) => {
  const startMark = `${id}-start`;
  const endMark = `${id}-end`;

  return {
    start: () => performance.mark(startMark),
    end: () => {
      performance.mark(endMark);
      performance.measure(id, startMark, endMark);
      const entries = performance.getEntriesByName(id);
      const latestEntry = entries[entries.length - 1];

      console.log(
        `%c[${id}] Operation took: ${latestEntry.duration.toFixed(2)}ms`,
        latestEntry.duration > 16.67
          ? "color:red;font-weight:bold"
          : "color:green"
      );

      // Clean up
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(id);
    },
  };
};
