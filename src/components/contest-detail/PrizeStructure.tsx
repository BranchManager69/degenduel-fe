import React, { useState } from "react";

import { formatCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface PrizeStructureProps {
  prizePool: number;
  entryFee?: number;
  maxParticipants?: number;
  currentParticipants?: number;
  platformFeePercentage?: number;
}

export const PrizeStructure: React.FC<PrizeStructureProps> = ({
  prizePool,
  entryFee = 0,
  maxParticipants = 0,
  currentParticipants = 0,
  platformFeePercentage = 5, // Default 5% fee
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Prize distribution
  const prizes = [
    { place: "1st", percentage: 69, color: "from-brand-400 to-brand-500" },
    { place: "2nd", percentage: 20, color: "from-brand-500 to-brand-600" },
    { place: "3rd", percentage: 11, color: "from-brand-600 to-brand-700" },
  ];

  // Calculate estimated prize pool based on current participants
  const calculateEstimatedPrizePool = () => {
    if (currentParticipants <= 0 || entryFee <= 0) return prizePool;
    return entryFee * currentParticipants * (1 - platformFeePercentage / 100);
  };

  // Calculate max potential prize pool
  const calculateMaxPotentialPrizePool = () => {
    if (maxParticipants <= 0 || entryFee <= 0) return prizePool;
    return entryFee * maxParticipants * (1 - platformFeePercentage / 100);
  };

  // Get actual values for display
  const estimatedPrizePool = calculateEstimatedPrizePool();
  const maxPotentialPrizePool = calculateMaxPotentialPrizePool();
  const participationPercentage =
    maxParticipants > 0 ? (currentParticipants / maxParticipants) * 100 : 0;

  // Calculate the rotation for each pie slice
  const calculateRotation = (index: number) => {
    const previousPercentages = prizes
      .slice(0, index)
      .reduce((sum, prize) => sum + prize.percentage, 0);
    return previousPercentages * 3.6; // Convert percentage to degrees (360/100 = 3.6)
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Prize Structure</h3>

        {/* Info button with tooltip */}
        <div className="relative">
          <button
            className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-sm border border-brand-500/30 hover:bg-brand-500/30 transition-colors"
            onClick={() => setShowTooltip(!showTooltip)}
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            ?
          </button>

          {showTooltip && (
            <div className="absolute z-50 right-0 mt-2 w-64 p-3 rounded-lg bg-dark-100/95 border border-brand-500/30 text-xs text-gray-300 shadow-xl">
              <div className="space-y-2">
                <p>Prize distribution breakdown:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>
                    <span className="text-brand-400 font-medium">
                      1st place:
                    </span>{" "}
                    69% of prize pool
                  </li>
                  <li>
                    <span className="text-brand-400 font-medium">
                      2nd place:
                    </span>{" "}
                    20% of prize pool
                  </li>
                  <li>
                    <span className="text-brand-400 font-medium">
                      3rd place:
                    </span>{" "}
                    11% of prize pool
                  </li>
                </ul>
                <p className="pt-1 border-t border-dark-300">
                  <span className="text-brand-400 font-medium">Note:</span>{" "}
                  Final prize pool depends on total participants.
                </p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          {/* Pie Chart */}
          <div className="relative w-32 h-32 rounded-full overflow-hidden">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {prizes.map((prize, index) => {
                const startAngle = calculateRotation(index);
                const endAngle = startAngle + prize.percentage * 3.6;
                const startAngleRad = (startAngle * Math.PI) / 180;
                const endAngleRad = (endAngle * Math.PI) / 180;
                
                const radius = 40;
                const centerX = 50;
                const centerY = 50;
                
                const x1 = centerX + radius * Math.cos(startAngleRad);
                const y1 = centerY + radius * Math.sin(startAngleRad);
                const x2 = centerX + radius * Math.cos(endAngleRad);
                const y2 = centerY + radius * Math.sin(endAngleRad);
                
                const largeArcFlag = prize.percentage > 50 ? 1 : 0;
                
                const pathData = [
                  `M ${centerX} ${centerY}`,
                  `L ${x1} ${y1}`,
                  `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                  'Z'
                ].join(' ');
                
                const colorMap: { [key: string]: string } = {
                  'from-brand-400 to-brand-500': '#9933ff',
                  'from-brand-500 to-brand-600': '#7f00ff',
                  'from-brand-600 to-brand-700': '#6600cc'
                };
                
                return (
                  <path
                    key={prize.place}
                    d={pathData}
                    fill={colorMap[prize.color] || '#9933ff'}
                    opacity={0.8}
                  />
                );
              })}
            </svg>
            <div className="absolute inset-4 bg-dark-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-400">
                Prize Pool
              </span>
            </div>
          </div>

          {/* Prize Pool Information */}
          <div className="text-right space-y-1">
            <div>
              <span className="text-sm text-gray-400">Current Prize Pool</span>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600">
                {formatCurrency(estimatedPrizePool)}
              </div>
            </div>

            {maxPotentialPrizePool > estimatedPrizePool && (
              <div>
                <span className="text-xs text-gray-400">
                  Max Potential Pool
                </span>
                <div className="text-sm font-medium text-gray-300">
                  {formatCurrency(maxPotentialPrizePool)}
                </div>

                {/* Participation progress bar */}
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-24 h-1.5 bg-dark-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
                      style={{ width: `${participationPercentage}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400">
                    {currentParticipants}/{maxParticipants}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="space-y-3">
          {prizes.map(({ place, percentage }) => {
            const prizeAmount = (estimatedPrizePool * percentage) / 100;
            const maxPrizeAmount = (maxPotentialPrizePool * percentage) / 100;

            return (
              <div
                key={place}
                className="group relative overflow-hidden p-3 rounded-lg bg-dark-300/50 hover:bg-dark-300/70 transition-colors"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-400/10 via-brand-500/10 to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center border border-brand-500/30">
                      <span className="text-sm font-bold text-brand-400">
                        {place}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-brand-400 font-medium">
                        {formatCurrency(prizeAmount)}
                      </span>
                      {maxPrizeAmount > prizeAmount && (
                        <span className="text-xs text-gray-500">
                          Up to {formatCurrency(maxPrizeAmount)}
                        </span>
                      )}
                      <span className="text-xs text-gray-400">
                        {percentage}% of pool
                      </span>
                    </div>
                  </div>
                  <div className="w-24 h-1 bg-dark-300 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
