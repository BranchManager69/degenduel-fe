// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

import { Contest, type ContestStatus } from "../types/index";

// Helper: Merge classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper: Format currency
export const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return "0 SOL";

  // For very small amounts (less than 0.01), show all decimal places up to 9
  if (num < 0.01) {
    return `${num.toFixed(9).replace(/\.?0+$/, "")} SOL`;
  }

  // For amounts between 0.01 and 1, show 3 decimal places
  if (num < 1) {
    return `${num.toFixed(3).replace(/\.?0+$/, "")} SOL`;
  }

  // For larger amounts, show 2 decimal places
  return `${num.toFixed(2).replace(/\.?0+$/, "")} SOL`;
};

// Helper: Format market cap
export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `$${Math.floor(marketCap / 1_000_000)}M`;
  }
  return `$${Math.floor(marketCap / 1_000)}K`;
}

// Helper: Format market cap in short format (2-3 digits with 1 decimal and K/M/B)
export function formatMarketCapShort(marketCap: number | string): string {
  const num = typeof marketCap === "string" ? parseFloat(marketCap) : marketCap;

  if (isNaN(num) || num <= 0) {
    return "$0";
  }

  if (num >= 1_000_000_000) {
    // Billions: show 2-3 digits with 1 decimal
    const billions = num / 1_000_000_000;
    if (billions >= 100) {
      return `$${billions.toFixed(0)}B`; // 100B+
    } else if (billions >= 10) {
      return `$${billions.toFixed(1)}B`; // 10.0B - 99.9B
    } else {
      return `$${billions.toFixed(1)}B`; // 1.0B - 9.9B
    }
  }

  if (num >= 1_000_000) {
    // Millions: show 2-3 digits with 1 decimal
    const millions = num / 1_000_000;
    if (millions >= 100) {
      return `$${millions.toFixed(0)}M`; // 100M+
    } else if (millions >= 10) {
      return `$${millions.toFixed(1)}M`; // 10.0M - 99.9M
    } else {
      return `$${millions.toFixed(1)}M`; // 1.0M - 9.9M
    }
  }

  if (num >= 1_000) {
    // Thousands: show 2-3 digits with 1 decimal
    const thousands = num / 1_000;
    if (thousands >= 100) {
      return `$${thousands.toFixed(0)}K`; // 100K+
    } else if (thousands >= 10) {
      return `$${thousands.toFixed(1)}K`; // 10.0K - 99.9K
    } else {
      return `$${thousands.toFixed(1)}K`; // 1.0K - 9.9K
    }
  }

  // Less than 1K
  return `$${num.toFixed(0)}`;
}

// Helper: Format address
export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Helper: Calculate portfolio value
export function calculatePortfolioValue(holdings: any[], prices: any): number {
  return holdings.reduce((total, holding) => {
    return total + holding.amount * (prices[holding.token] || 0);
  }, 0);
}

// Helper: Is contest currently underway? (active)
export function isContestCurrentlyUnderway(contest: { status: ContestStatus }): boolean {
  return contest.status === "active";
}

// Helper: Is contest joinable? (pending)
export function isContestJoinable(contest: { status: ContestStatus }): boolean {
  return contest.status === "pending";
}

// Helper: Is contest cancelled? (cancelled)
export function isContestCancelled(contest: { status: ContestStatus }): boolean {
  return contest.status === "cancelled";
}

// Helper: Is contest completed? (completed and winner(s) resolved)
export function isContestCompleted(contest: { status: ContestStatus }): boolean {
  return contest.status === "completed";
}

// Helper: Get contest status
export function getStatusDisplay(status: ContestStatus): string {
  switch (status) {
    case "active":
      return "live";
    case "completed":
      return "ended";
    case "cancelled":
      return "cancelled";
    case "pending":
    default:
      return "upcoming";
  }
}

// Helper: Format date
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};

// Contest statuses
export const mapContestStatus = (
  status: Contest["status"],
): "upcoming" | "live" | "completed" => {
  switch (status) {
    case "pending":
      return "upcoming";
    case "active":
      return "live";
    case "completed":
    case "cancelled":
    default:
      return "completed";
  }
};
