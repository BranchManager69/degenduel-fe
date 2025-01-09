import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Contest, type ContestStatus } from "../types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, precision: number = 0): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(precision)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(precision)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(precision)}K`;
  }
  return `$${amount.toFixed(precision)}`;
}

export function formatMarketCap(marketCap: number): string {
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(1)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `$${Math.floor(marketCap / 1_000_000)}M`;
  }
  return `$${Math.floor(marketCap / 1_000)}K`;
}

export function formatAddress(address: string): string {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function calculatePortfolioValue(holdings: any[], prices: any): number {
  return holdings.reduce((total, holding) => {
    return total + holding.amount * (prices[holding.token] || 0);
  }, 0);
}

export function isContestLive(contest: { status: ContestStatus }): boolean {
  return (
    contest.status === "active" ||
    contest.status === "in-progress" ||
    contest.status === "in_progress"
  ); // Too lazy to remove 'in-progress' with hyphen from everywhere.
}

export function getStatusDisplay(status: ContestStatus): string {
  if (status === "active" || status === "in_progress") return "live";
  if (status === "completed") return "ended";
  if (status === "cancelled") return "cancelled";
  return "upcoming";
}

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

export const mapContestStatus = (
  status: Contest["status"]
): "upcoming" | "live" | "completed" => {
  if (status === "pending") return "upcoming";
  if (
    status === "active" ||
    status === "in_progress" ||
    status === "in-progress"
  )
    return "live";
  return "completed";
};
