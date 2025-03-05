import React from 'react';
import { FeatureCard } from './FeatureCard';

const features = [
  {
    title: 'Real-Time Trading',
    description: 'Experience the thrill of live token trading competitions with real-time price updates and portfolio tracking.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 20H21M5 20V12M9 20V8M13 20V4M17 20V10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Prize Pools',
    description: 'Compete for substantial prize pools distributed among top performers in each contest.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 15C15.866 15 19 11.866 19 8V3H5V8C5 11.866 8.13401 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M8.5 21H15.5M12 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Fair Competition',
    description: 'All participants start with equal resources, ensuring a level playing field for everyone.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3V21M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <rect x="6" y="6" width="12" height="12" stroke="currentColor" strokeWidth="2"/>
      </svg>
    ),
  },
  {
    title: 'Performance Analytics',
    description: 'Track your trading performance with detailed analytics and historical data.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M21 21H3M21 3H3M21 16.5H3M21 9.5H3M16.5 3V21M9.5 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Community Rankings',
    description: 'Climb the global leaderboard and establish yourself as a top trader.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M6 18L6 9L2 9L2 18L6 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 18L14 3L10 3L10 18L14 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M22 18L22 7L18 7L18 18L22 18Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 22L22 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    title: 'Instant Rewards',
    description: 'Automatically receive your winnings as soon as contests end.',
    icon: (
      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
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