import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/24/solid";
import React from "react";

import { formatCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface PlatformStatsProps {
  totalUsers: number;
  activeContests: number;
  totalVolume: number;
  totalPrizesPaid: number;
  dailyActiveUsers: number;
  userGrowth: number;
  volumeGrowth: number;
}

export const PlatformStats: React.FC<PlatformStatsProps> = ({
  totalUsers,
  activeContests,
  totalVolume,
  totalPrizesPaid,
  dailyActiveUsers,
  userGrowth,
  volumeGrowth,
}) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">
          Platform Overview
        </h3>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Total Users</div>
              <div
                className={`flex items-center text-sm ${
                  userGrowth >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {userGrowth >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(userGrowth)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-100 mt-2">
              {totalUsers.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Active Contests</div>
            <div className="text-2xl font-bold text-gray-100 mt-2">
              {activeContests}
            </div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-400">Total Volume</div>
              <div
                className={`flex items-center text-sm ${
                  volumeGrowth >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {volumeGrowth >= 0 ? (
                  <ArrowUpIcon className="w-4 h-4 mr-1" />
                ) : (
                  <ArrowDownIcon className="w-4 h-4 mr-1" />
                )}
                {Math.abs(volumeGrowth)}%
              </div>
            </div>
            <div className="text-2xl font-bold text-brand-400 mt-2">
              {formatCurrency(totalVolume)}
            </div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Daily Active Users</div>
            <div className="text-2xl font-bold text-gray-100 mt-2">
              {dailyActiveUsers.toLocaleString()}
            </div>
          </div>
          <div className="p-4 bg-dark-300/50 rounded-lg">
            <div className="text-sm text-gray-400">Total Prizes Paid</div>
            <div className="text-2xl font-bold text-brand-400 mt-2">
              {formatCurrency(totalPrizesPaid)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
