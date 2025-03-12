// src/pages/other/Maintenance.tsx

import React, { useEffect, useState } from "react";

import { ddApi } from "../../../services/dd-api";

const DEFAULT_DURATION = 15; // 15 minutes

export const Maintenance: React.FC = () => {
  const [estimatedEndTime, setEstimatedEndTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      try {
        // First check if maintenance is actually active using public endpoint
        const statusResponse = await ddApi.fetch("/api/status");
        if (statusResponse.status !== 503) {
          // If we don't get a 503, maintenance is not active
          window.location.href = "/";
          return;
        }

        // Get maintenance settings from public endpoint
        const response = await ddApi.fetch("/api/status/maintenance");
        if (!response.ok) {
          throw new Error("Failed to fetch maintenance settings");
        }
        const settings = await response.json();

        // Calculate end time
        const startTimeUTC = new Date(settings.start_time);
        const durationMinutes = settings.estimated_duration || DEFAULT_DURATION;

        // Calculate raw end time
        const rawEndTime = new Date(
          startTimeUTC.getTime() + durationMinutes * 60000,
        );

        // Only extend time if we've passed the current estimated end time
        const now = new Date();
        if (now > rawEndTime) {
          // If we've passed the end time, add 15 minutes from now and round up
          const extendedEnd = new Date(
            now.getTime() + DEFAULT_DURATION * 60000,
          );
          const minutes = extendedEnd.getMinutes();
          const remainder = minutes % 5;
          if (remainder > 0) {
            extendedEnd.setMinutes(minutes + (5 - remainder));
            extendedEnd.setSeconds(0);
            extendedEnd.setMilliseconds(0);
          }
          setEstimatedEndTime(extendedEnd);
        } else {
          // Otherwise, just round the original end time if needed
          const roundedEndTime = new Date(rawEndTime);
          const minutes = roundedEndTime.getMinutes();
          const remainder = minutes % 5;
          if (remainder > 0) {
            roundedEndTime.setMinutes(minutes + (5 - remainder));
            roundedEndTime.setSeconds(0);
            roundedEndTime.setMilliseconds(0);
          }
          setEstimatedEndTime(roundedEndTime);
        }
      } catch (err) {
        console.error("Failed to fetch maintenance settings:", err);
        // Only show error for non-503 failures
        if (
          err instanceof Error &&
          !err.message.includes("under maintenance")
        ) {
          setError("Unable to fetch maintenance duration");
        }

        if (!estimatedEndTime) {
          // Only set fallback if we don't already have an end time
          const fallbackEnd = new Date(Date.now() + DEFAULT_DURATION * 60000);
          const minutes = fallbackEnd.getMinutes();
          const remainder = minutes % 5;
          if (remainder > 0) {
            fallbackEnd.setMinutes(minutes + (5 - remainder));
            fallbackEnd.setSeconds(0);
            fallbackEnd.setMilliseconds(0);
          }
          setEstimatedEndTime(fallbackEnd);
        }
      }
    };

    fetchMaintenanceSettings();

    // Check every minute
    const interval = setInterval(fetchMaintenanceSettings, 60000);

    return () => clearInterval(interval);
  }, [estimatedEndTime]); // Add estimatedEndTime to dependencies

  const formatExpectedTime = (date: Date | null) => {
    if (!date) return "Calculating...";

    // Format time in user's timezone
    const timeString = date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    });

    // If the date is tomorrow, add that info
    const now = new Date();
    if (
      date.getDate() !== now.getDate() ||
      date.getMonth() !== now.getMonth() ||
      date.getFullYear() !== now.getFullYear()
    ) {
      return `${date.toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
      })} at ${timeString}`;
    }

    return timeString;
  };

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="max-w-2xl mx-auto bg-dark-200/50 backdrop-blur-lg p-8 rounded-lg border border-brand-500/50 shadow-lg">
        {error ? (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        ) : null}

        <div className="mb-6">
          <div className="text-brand-500 text-6xl mb-4">🔧</div>
          <h1 className="text-4xl font-heading text-brand-500 mb-4">
            SYSTEM UPGRADE
          </h1>
          <div className="font-mono text-sm text-brand-400 mb-6 animate-pulse">
            STATUS: MAINTENANCE_IN_PROGRESS
          </div>
        </div>

        <div className="space-y-4 text-gray-300">
          <p className="text-lg">
            DegenDuel is currently undergoing scheduled maintenance.
          </p>
          <p className="text-sm text-gray-400">
            We're upgrading our systems to provide you with an even better
            trading experience.
          </p>
        </div>

        <div className="mt-8">
          <div className="inline-block px-8 py-4 bg-dark-300/50 rounded-lg border border-brand-500/20">
            <div className="text-sm text-gray-400 mb-2">
              Expected Completion
            </div>
            <div className="font-mono text-2xl text-brand-400">
              {formatExpectedTime(estimatedEndTime)}
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          <div className="text-sm text-gray-400">
            For real-time updates, follow us on:
          </div>
          <div className="flex justify-center space-x-4">
            <a
              href="https://twitter.com/degenduel"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 
                       border border-brand-500/50 rounded-lg transition-all duration-300"
            >
              Twitter
            </a>
            <a
              href="https://discord.gg/degenduel"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-brand-500/20 hover:bg-brand-500/30 text-brand-400 
                       border border-brand-500/50 rounded-lg transition-all duration-300"
            >
              Discord
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-brand-500/20">
          <button
            onClick={() => window.location.reload()}
            className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
          >
            ↻ Check if we're back online
          </button>
        </div>
      </div>
    </div>
  );
};
