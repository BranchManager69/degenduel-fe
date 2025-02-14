import React from "react";
import { formatCurrency } from "../../lib/utils";
import { Card, CardContent, CardHeader } from "../ui/Card";

interface PrizeStructureProps {
  prizePool: number;
}

export const PrizeStructure: React.FC<PrizeStructureProps> = ({
  prizePool,
}) => {
  const prizes = [
    { place: "1st", percentage: 69, color: "from-brand-400 to-brand-500" },
    { place: "2nd", percentage: 20, color: "from-brand-500 to-brand-600" },
    { place: "3rd", percentage: 11, color: "from-brand-600 to-brand-700" },
  ];

  // Calculate the rotation for each pie slice
  const calculateRotation = (index: number) => {
    const previousPercentages = prizes
      .slice(0, index)
      .reduce((sum, prize) => sum + prize.percentage, 0);
    return previousPercentages * 3.6; // Convert percentage to degrees (360/100 = 3.6)
  };

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 overflow-hidden">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Prize Structure</h3>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-6">
          {/* Pie Chart */}
          <div className="relative w-32 h-32">
            {prizes.map((prize, index) => {
              const rotation = calculateRotation(index);
              const nextRotation = rotation + prize.percentage * 3.6;

              return (
                <div
                  key={prize.place}
                  className="absolute inset-0"
                  style={{
                    background: `conic-gradient(transparent ${rotation}deg, bg-gradient-to-r ${prize.color} ${rotation}deg ${nextRotation}deg, transparent ${nextRotation}deg)`,
                  }}
                />
              );
            })}
            <div className="absolute inset-4 bg-dark-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-gray-400">
                Total Pool
              </span>
            </div>
          </div>

          {/* Total Prize Pool */}
          <div className="text-right">
            <span className="text-sm text-gray-400">Total Prize Pool</span>
            <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-brand-500 to-brand-600">
              {formatCurrency(prizePool)}
            </div>
          </div>
        </div>

        {/* Prize Distribution */}
        <div className="space-y-3">
          {prizes.map(({ place, percentage }) => {
            const prizeAmount = (prizePool * percentage) / 100;
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
