import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const ImportantUpdate: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-dark-200/80 backdrop-blur-sm rounded-xl p-8 border border-dark-300/60 shadow-2xl"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-amber-500/20 rounded-full mb-4"
            >
              <span className="text-3xl">📢</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-3xl sm:text-4xl font-bold text-white mb-2"
            >
              Important Update from DegenDuel
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-gray-400 text-lg"
            >
              A message from our team about recent developments
            </motion.p>
          </div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="prose prose-invert max-w-none"
          >
            <div className="space-y-6 text-gray-300 leading-relaxed">
              
              {/* Apology Section */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-amber-300 mb-3 flex items-center">
                  <span className="mr-2">🙏</span>
                  Our Sincere Apology
                </h2>
                <p className="mb-4">
                  We want to acknowledge and apologize for the delays you've experienced with DegenDuel. 
                  We know how frustrating it can be when features aren't working as expected or when 
                  launches don't happen on schedule.
                </p>
                <p>
                  Your patience and continued support mean everything to us, and we're committed to 
                  making things right.
                </p>
              </div>

              {/* What Happened Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">🔍</span>
                  What Happened
                </h2>
                <p className="mb-4">
                  Building a high-stakes trading competition platform on Solana is incredibly complex. 
                  We've encountered several technical challenges:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 text-gray-400">
                  <li>Smart contract optimizations for gas efficiency</li>
                  <li>Real-time price feed integration complexities</li>
                  <li>Scalability improvements for simultaneous contests</li>
                  <li>Security audits and protocol refinements</li>
                </ul>
              </div>

              {/* Moving Forward Section */}
              <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-brand-300 mb-3 flex items-center">
                  <span className="mr-2">🚀</span>
                  Moving Forward
                </h2>
                <p className="mb-4">
                  We're implementing a new development approach with clear milestones and regular updates:
                </p>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>Enhanced testing protocols for all new features</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>Weekly progress updates in our Discord community</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>Beta testing program for early access and feedback</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>Transparent roadmap with realistic timelines</span>
                  </div>
                </div>
              </div>

              {/* What's Next Section */}
              <div>
                <h2 className="text-xl font-semibold text-white mb-3 flex items-center">
                  <span className="mr-2">📅</span>
                  What's Next
                </h2>
                <p className="mb-4">
                  Here's what you can expect in the coming weeks:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="bg-dark-300/40 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-300 mb-2">Week 1-2</h3>
                    <p className="text-sm text-gray-400">Platform stability improvements and bug fixes</p>
                  </div>
                  <div className="bg-dark-300/40 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-300 mb-2">Week 3-4</h3>
                    <p className="text-sm text-gray-400">Beta contest launches with limited participants</p>
                  </div>
                  <div className="bg-dark-300/40 rounded-lg p-4">
                    <h3 className="font-semibold text-green-300 mb-2">Month 2</h3>
                    <p className="text-sm text-gray-400">Full public launch with regular contests</p>
                  </div>
                  <div className="bg-dark-300/40 rounded-lg p-4">
                    <h3 className="font-semibold text-amber-300 mb-2">Ongoing</h3>
                    <p className="text-sm text-gray-400">New features and community-requested improvements</p>
                  </div>
                </div>
              </div>

              {/* Community Section */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-purple-300 mb-3 flex items-center">
                  <span className="mr-2">🤝</span>
                  Stay Connected
                </h2>
                <p className="mb-4">
                  Join our community for real-time updates, feedback sessions, and early access opportunities:
                </p>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://discord.gg/degenduel" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <span className="mr-2">💬</span>
                    Discord
                  </a>
                  <a 
                    href="https://twitter.com/degenduel" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                  >
                    <span className="mr-2">🐦</span>
                    Twitter
                  </a>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="text-center mt-8 pt-6 border-t border-dark-300/40"
          >
            <p className="text-gray-400 mb-4">
              Thank you for being part of the DegenDuel community. Together, we're building something amazing.
            </p>
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg hover:from-brand-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              <span className="mr-2">←</span>
              Back to DegenDuel
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};