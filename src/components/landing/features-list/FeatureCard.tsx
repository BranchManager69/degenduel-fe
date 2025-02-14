import React from 'react';
import { Card, CardContent } from '../../ui/Card';

interface FeatureCardProps {
  title: string;
  description: string;
  icon: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon }) => {
  return (
    <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300 transform transition-all hover:scale-105">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="text-3xl">{icon}</div>
          <div>
            <h3 className="text-lg font-semibold text-gray-100 mb-2">
              {title}
            </h3>
            <p className="text-gray-400 text-sm">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};