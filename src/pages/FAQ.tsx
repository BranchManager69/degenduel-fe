import React from 'react';
import { Card, CardContent } from '../components/ui/Card';

export const FAQ: React.FC = () => {
  const faqs = [
    {
      question: 'What is DegenDuel?',
      answer: 'DegenDuel is a competitive trading platform where users can participate in token trading contests on Solana.'
    },
    {
      question: 'How do contests work?',
      answer: 'Users enter contests by paying an entry fee, select tokens for their portfolio, and compete for prizes based on portfolio performance.'
    },
    {
      question: 'How are winners determined?',
      answer: "Winners are determined by their portfolio's performance over the contest duration. The highest-performing portfolios win prizes."
    },
    {
      question: 'How do I receive winnings?',
      answer: 'Winnings are automatically distributed to your connected wallet after contest completion.'
    },
    {
      question: 'What are difficulty levels?',
      answer: 'Difficulty levels (Guppy to Whale) indicate the contest complexity, entry fees, and prize structure.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-100">Frequently Asked Questions</h1>
      </div>

      <div className="space-y-6">
        {faqs.map((faq) => (
          <Card key={faq.question} className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-2">
                {faq.question}
              </h3>
              <p className="text-gray-400">
                {faq.answer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};