import React from "react";
import { Card, CardContent } from "../../../components/ui/Card";

export const PrivacyPolicy: React.FC = () => {
  const sections = [
    {
      title: "1. Information We Collect",
      content:
        "We collect wallet addresses, transaction data, and basic usage analytics to provide our trading contest services.",
      icon: "📊",
    },
    {
      title: "2. How We Use Data",
      content:
        "Your data is used to facilitate contests, track performance, and improve our platform. We never sell personal information.",
      icon: "🔧",
    },
    {
      title: "3. Data Security",
      content:
        "We implement industry-standard security measures to protect your data. However, no system is 100% secure.",
      icon: "🔒",
    },
    {
      title: "4. Wallet Privacy",
      content:
        "Wallet addresses and transactions are public on the blockchain. We don't control this blockchain visibility.",
      icon: "👛",
    },
    {
      title: "5. Cookies & Tracking",
      content:
        "We use essential cookies for functionality and analytics cookies to improve user experience.",
      icon: "🍪",
    },
    {
      title: "6. Third Parties",
      content:
        "We may share data with service providers who help us operate DegenDuel, under strict confidentiality agreements.",
      icon: "🤝",
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
              Privacy Policy
              <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </h1>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto group-hover:animate-cyber-pulse">
              Learn how we protect and handle your data on DegenDuel
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

          {/* Additional Privacy Information */}
          <div className="mt-16">
            <Card className="bg-dark-200/50 backdrop-blur-sm border-dark-300">
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold text-gray-100 mb-6">Your Privacy Rights</h2>
                <div className="space-y-4 text-gray-400">
                  <p>
                    <strong className="text-gray-200">Data Access:</strong> You can request access to the personal data we hold about you at any time.
                  </p>
                  <p>
                    <strong className="text-gray-200">Data Deletion:</strong> You may request deletion of your account and associated data, subject to legal requirements.
                  </p>
                  <p>
                    <strong className="text-gray-200">Data Portability:</strong> You can request a copy of your data in a machine-readable format.
                  </p>
                  <p>
                    <strong className="text-gray-200">Updates:</strong> We may update this privacy policy from time to time. We'll notify users of significant changes.
                  </p>
                  <p>
                    <strong className="text-gray-200">Contact:</strong> For privacy-related questions or requests, please contact our support team.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Call to Action */}
          <div className="mt-16 text-center relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400/0 via-brand-400/5 to-brand-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-data-stream-responsive" />
            <h2 className="text-2xl font-bold text-gray-100 mb-4 group-hover:animate-glitch">
              Privacy Questions?
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