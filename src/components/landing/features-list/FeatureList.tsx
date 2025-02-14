import React from 'react';
import { FeatureCard } from './FeatureCard';

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

export const FeatureList: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </div>
  );
};