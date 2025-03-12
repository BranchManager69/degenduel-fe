import React from "react";

import { Card, CardContent, CardHeader } from "../ui/Card";

interface Rule {
  id: string;
  title: string;
  description: string;
}

interface ContestRulesProps {
  rules: Rule[];
}

export const ContestRules: React.FC<ContestRulesProps> = ({ rules }) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-100">Contest Rules</h3>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {rules.map((rule) => (
            <li key={rule.id} className="space-y-1">
              <h4 className="text-brand-400 font-medium">{rule.title}</h4>
              <p className="text-gray-300 text-sm">{rule.description}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
