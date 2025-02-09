// src/pages/other/Maintenance.tsx

import React, { useEffect, useState } from "react";
import { ddApi } from "../../../services/dd-api";

const DEFAULT_DURATION = 15; // 15 minutes

export const Maintenance: React.FC = () => {
  const [estimatedDuration, setEstimatedDuration] = useState<number | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    const fetchMaintenanceSettings = async () => {
      try {
        const response = await ddApi.fetch("/api/system/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch maintenance settings");
        }
        const settings = await response.json();

        // Get maintenance start time
        const maintenanceStartTime = settings.find(
          (s: any) => s.key === "maintenance_start_time"
        )?.value;

        if (maintenanceStartTime) {
          setStartTime(new Date(maintenanceStartTime));
        } else {
          setStartTime(new Date());
          // Set start time if not exists
          await ddApi.fetch("/api/system/settings", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              key: "maintenance_start_time",
              value: new Date().toISOString(),
              description: "Time when maintenance mode was enabled",
            }),
          });
        }

        // Get duration
        const duration = settings.find(
          (s: any) => s.key === "maintenance_estimated_duration"
        )?.value;

        setEstimatedDuration(duration ? parseInt(duration) : DEFAULT_DURATION);
      } catch (err) {
        console.error("Failed to fetch maintenance settings:", err);
        setError("Unable to fetch maintenance duration");
        setEstimatedDuration(DEFAULT_DURATION);
      }
    };

    fetchMaintenanceSettings();

    // Check and extend duration if needed every minute
    const interval = setInterval(async () => {
      if (startTime && estimatedDuration) {
        const endTime = new Date(
          startTime.getTime() + estimatedDuration * 60000
        );
        if (new Date() > endTime) {
          // Auto-extend by 15 minutes
          try {
            const response = await ddApi.fetch("/api/system/settings", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                key: "maintenance_estimated_duration",
                value: (estimatedDuration + DEFAULT_DURATION).toString(),
                description: "Estimated maintenance duration in minutes",
              }),
            });

            if (response.ok) {
              setEstimatedDuration((prev) => (prev || 0) + DEFAULT_DURATION);
            }
          } catch (err) {
            console.error("Failed to extend maintenance duration:", err);
          }
        }
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [startTime, estimatedDuration]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${remainingMinutes
      .toString()
      .padStart(2, "0")}:00`;
  };

  const getTimeRemaining = () => {
    if (!startTime || !estimatedDuration) return "00:00:00";

    const endTime = new Date(startTime.getTime() + estimatedDuration * 60000);
    const remaining = endTime.getTime() - new Date().getTime();

    if (remaining <= 0) return formatDuration(DEFAULT_DURATION);

    const minutes = Math.ceil(remaining / 60000);
    return formatDuration(minutes);
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
              Estimated Time Remaining
            </div>
            <div className="font-mono text-2xl text-brand-400">
              {getTimeRemaining()}
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
