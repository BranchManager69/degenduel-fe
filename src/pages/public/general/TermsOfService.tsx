import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";

export const TermsOfService: React.FC = () => {
  const sections = [
    {
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using DegenDuel, you accept and agree to be bound by the terms and provision of this agreement.",
      icon: "📋",
    },
    {
      title: "2. Use License",
      content:
        "Permission is granted to temporarily use DegenDuel for personal, non-commercial transitory viewing only.",
      icon: "📜",
    },
    {
      title: "3. User Accounts",
      content:
        "You are responsible for safeguarding your account and wallet. DegenDuel cannot recover lost wallets or private keys.",
      icon: "👤",
    },
    {
      title: "4. Trading Contests",
      content:
        "Contest participation involves risk. Past performance does not guarantee future results. Trade responsibly.",
      icon: "⚠️",
    },
    {
      title: "5. Prohibited Uses",
      content:
        "You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.",
      icon: "🚫",
    },
    {
      title: "6. Disclaimers",
      content:
        "DegenDuel is provided 'as is'. We make no warranties, expressed or implied, and hereby disclaim all warranties.",
      icon: "⚖️",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">

      {/* Content Section */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12 relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            <h1 className="text-4xl font-bold text-gray-100 group-hover:animate-glitch relative">
              Terms of Service
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </h1>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto group-hover:animate-cyber-pulse">
              Please read these terms carefully before using DegenDuel
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section, index) => (
              <Card
                key={section.title}
                className="bg-dark-200/50 backdrop-blur-sm border-dark-300 hover:border-brand-400/20 transition-colors group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-brand-400/10 via-transparent to-brand-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div
                  className="absolute inset-0 bg-gradient-to-r from-dark-300/0 via-dark-300/20 to-dark-300/0 animate-data-stream-responsive opacity-0 group-hover:opacity-100"
                  style={{
                    animationDelay: `${index * 150}ms`,
                  }}
                />
                <CardContent className="p-6 relative">
                  <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform group-hover:animate-cyber-pulse">
                    {section.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 mb-2 group-hover:animate-glitch">
                    {section.title}
                  </h3>
                  <p className="text-gray-400 group-hover:text-brand-400 transition-colors">
                    {section.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Additional Terms Section */}
          <div className="mt-16">
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-100 mb-6">Additional Terms</h2>
                <div className="space-y-4 text-gray-400">
                  <p>
                    <strong className="text-gray-200">Limitation of Liability:</strong> In no event shall DegenDuel be liable for any indirect, incidental, special, consequential, or punitive damages.
                  </p>
                  <p>
                    <strong className="text-gray-200">Governing Law:</strong> These terms shall be governed by and construed in accordance with applicable laws.
                  </p>
                  <p>
                    <strong className="text-gray-200">Changes to Terms:</strong> We reserve the right to modify these terms at any time. Continued use constitutes acceptance of modified terms.
                  </p>
                  <p>
                    <strong className="text-gray-200">Contact:</strong> For questions about these terms, please contact our support team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Call to Action */}
          <div className="mt-16 text-center relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            <h2 className="text-2xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
              Questions About Our Terms?
            </h2>
            <a
              href="/contact"
              className="inline-flex items-center px-6 py-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/20 via-brand-500/20 to-brand-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-data-stream-responsive" />
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
      </div>
    </div>
  );
}; 