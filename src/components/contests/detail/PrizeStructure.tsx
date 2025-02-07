import React from "react";
import { formatCurrency } from "../../../lib/utils";
import { Card, CardContent, CardHeader } from "../../ui/Card";

interface PrizeStructureProps {
  prizePool: number;
}

export const PrizeStructure: React.FC<PrizeStructureProps> = ({
  prizePool,
}) => {
  const prizes = [
    { place: "1st", percentage: 50 },
    { place: "2nd", percentage: 30 },
    { place: "3rd", percentage: 20 },
  ];

  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Prize Structure</h3>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {prizes.map(({ place, percentage }) => (
            <div
              key={place}
              className="flex items-center justify-between p-2 rounded bg-dark-300/50"
            >
              <span className="text-gray-300">{place}</span>
              <div className="flex flex-col items-end">
                <span className="text-brand-400 font-medium">
                  {formatCurrency((prizePool * percentage) / 100)}
                </span>
                <span className="text-xs text-gray-400">{percentage}%</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
