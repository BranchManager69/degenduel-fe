import React from 'react';
import { Card, CardContent } from '../ui/Card';

const features = [
  {
    title: 'Real-Time Trading',
    description: 'Experience the thrill of live token trading competitions with real-time price updates and portfolio tracking.',
    icon: '📊',
  },
  {
    title: 'Prize Pools',
    description: 'Compete for substantial prize pools distributed among top performers in each contest.',
    icon: '💰',
  },
  {
    title: 'Fair Competition',
    description: 'All participants start with equal resources, ensuring a level playing field for everyone.',
    icon: '⚖️',
  },
  {
    title: 'Performance Analytics',
    description: 'Track your trading performance with detailed analytics and historical data.',
    icon: '📈',
  },
  {
    title: 'Community Rankings',
    description: 'Climb the global leaderboard and establish yourself as a top trader.',
    icon: '🏆',
  },
  {
    title: 'Instant Rewards',
    description: 'Automatically receive your winnings as soon as contests end.',
    icon: '⚡',
  },
];

export const Features: React.FC = () => {
  return (
    <div className="py-16">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-100">Features</h2>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          Experience the future of competitive token trading with our innovative platform
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature) => (
          <Card key={feature.title} className="bg-dark-200/50 backdrop-blur-sm border-dark-300 transform transition-all hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="text-3xl">{feature.icon}</div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};