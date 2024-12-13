import React from 'react';
import { Card, CardHeader, CardContent } from '../ui/Card';

interface ContestRulesProps {
  rules: string[];
}

export const ContestRules: React.FC<ContestRulesProps> = ({ rules }) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Contest Rules</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <li key={index} className="flex items-start space-x-3 text-gray-300">
              <span className="text-brand-400 mt-1">•</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};