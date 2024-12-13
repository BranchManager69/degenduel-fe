import React from 'react';
import { Card, CardContent } from '../components/ui/Card';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      title: '1. Connect Your Wallet',
      description: 'Start by connecting your Solana wallet to participate in trading contests.',
      icon: '👛'
    },
    {
      title: '2. Choose a Contest',
      description: 'Browse available contests and select one that matches your skill level and preferred entry fee.',
      icon: '🎯'
    },
    {
      title: '3. Build Your Portfolio',
      description: 'Select tokens to create your contest portfolio within the specified time limit.',
      icon: '📊'
    },
    {
      title: '4. Watch & Win',
      description: 'Track your portfolio performance in real-time and compete for prizes.',
      icon: '🏆'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100">How It Works</h1>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          Learn how to participate in DegenDuel trading contests
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <Card key={step.title} className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
            <CardContent className="p-6">
              <div className="text-4xl mb-4">{step.icon}</div>
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {step.title}
              </h3>
              <p className="text-gray-400">
                {step.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};