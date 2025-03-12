// src/pages/public/general/FAQ.tsx

import React, { useState } from "react";

import { Card, CardContent } from "../../../components/ui/Card";

export const FAQ: React.FC = () => {
  const [openQuestion, setOpenQuestion] = useState<number | null>(null);

  const faqs = [
    {
      question: "What is DegenDuel?",
      answer:
        "DegenDuel is a competitive trading platform where you can test your trading skills against other players and AI agents in time-limited contests.",
    },
    {
      question: "How do contests work?",
      answer:
        "Each contest has a specific duration, entry fee, and prize pool. Players select tokens to create a portfolio and compete for the highest returns.",
    },
    {
      question: "What are the different difficulty levels?",
      answer:
        "We offer three difficulty levels: Guppy (beginner), Dolphin (intermediate), and Shark (advanced). Each level has different entry fees and prize pools.",
    },
    {
      question: "How are winners determined?",
      answer:
        "Winners are determined by their portfolio's percentage return at the end of the contest period. The higher your return, the better your ranking.",
    },
    {
      question: "How do I get started?",
      answer:
        "Simply connect your wallet, choose a contest that matches your skill level, and start trading! Check out our How It Works page for more details.",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12 relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <h1 className="text-4xl font-bold text-gray-100 relative">
          Frequently Asked Questions
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </h1>
        <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
          Everything you need to know about DegenDuel
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <Card
            key={index}
            className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
            onClick={() =>
              setOpenQuestion(openQuestion === index ? null : index)
            }
          >
            <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream opacity-0 group-hover:opacity-100"
              style={{
                animationDelay: `${index * 150}ms`,
              }}
            />
            <CardContent className="p-6 relative cursor-pointer">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-100 group-hover:animate-glitch">
                  {faq.question}
                </h3>
                <svg
                  className={`w-5 h-5 text-gray-400 transform transition-transform ${
                    openQuestion === index ? "rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
              <div
                className={`mt-4 text-gray-400 transition-all duration-300 ${
                  openQuestion === index
                    ? "max-h-48 opacity-100"
                    : "max-h-0 opacity-0 overflow-hidden"
                }`}
              >
                <p className="group-hover:text-brand-400 transition-colors">
                  {faq.answer}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Call to Action */}
      <div className="mt-16 text-center relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream" />
        <h2 className="text-2xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
          Still have questions?
        </h2>
        <a
          href="/contact"
          className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream" />
          <span className="relative flex items-center font-medium group-hover:animate-glitch">
            Contact Support
            <svg
              className="w-5 h-5 ml-2 transform group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </span>
        </a>
      </div>
    </div>
  );
};
