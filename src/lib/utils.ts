// src/lib/utils.ts

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Contest, type ContestStatus } from "../types/index";

// Helper: Merge classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Helper: Format currency
export const formatCurrency = (amount: number | string): string => {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${num.toFixed(2)} SOL`;
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

// Helper: Is contest live?
export function isContestLive(contest: { status: ContestStatus }): boolean {
  return contest.status === "active";
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
  status: Contest["status"]
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
