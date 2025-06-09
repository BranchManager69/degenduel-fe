import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const ImportantUpdate: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(153,51,255,0.1) 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-20">
        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-amber-400/20 to-orange-500/20 rounded-full flex items-center justify-center border border-amber-400/30 backdrop-blur-sm">
              <span className="text-3xl">📢</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            An Important Message
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-400 to-orange-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We want to address recent delays and share our path forward
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="space-y-12">
          
          {/* Acknowledgment Section */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl"></div>
            <div className="relative bg-dark-200/60 backdrop-blur-sm rounded-xl p-8 border border-amber-500/20">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🙏</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-amber-300 mb-4">Our Commitment to You</h2>
                  <div className="space-y-4 text-gray-300 text-lg leading-relaxed">
                    <p>
                      We want to acknowledge the delays you've experienced with DegenDuel and take full responsibility. 
                      We understand how frustrating it can be when anticipated features don't launch on schedule.
                    </p>
                    <p>
                      Your patience and continued support are what drive us forward, and we're committed to 
                      delivering the exceptional trading competition platform you deserve.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Technical Challenges */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl p-8 border border-dark-300/40">
              <div className="flex items-start space-x-4 mb-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🔧</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">The Technical Reality</h2>
                  <p className="text-gray-300 text-lg">
                    Building a high-stakes, real-time trading competition platform on Solana presents unique challenges.
                  </p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Smart contract optimization for gas efficiency</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Real-time price feed integration</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Scalability for simultaneous contests</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <span className="text-gray-300">Comprehensive security audits</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Our New Approach */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-brand-500/5 to-purple-500/5 rounded-2xl"></div>
            <div className="relative bg-dark-200/60 backdrop-blur-sm rounded-xl p-8 border border-brand-500/20">
              <div className="flex items-start space-x-4 mb-8">
                <div className="w-12 h-12 bg-brand-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-xl">🚀</span>
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-brand-300 mb-2">Our Enhanced Development Strategy</h2>
                  <p className="text-gray-300 text-lg">
                    We've implemented a new approach focused on transparency, quality, and community feedback.
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Rigorous Testing Protocols</h3>
                      <p className="text-gray-400 text-sm">Comprehensive testing for every feature before release</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Community Beta Program</h3>
                      <p className="text-gray-400 text-sm">Early access for feedback and refinement</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Weekly Progress Updates</h3>
                      <p className="text-gray-400 text-sm">Regular communication in our Discord community</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <span className="text-green-400 text-sm font-bold">✓</span>
                    </div>
                    <div>
                      <h3 className="text-white font-medium mb-1">Transparent Roadmap</h3>
                      <p className="text-gray-400 text-sm">Clear milestones with realistic timelines</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl p-8 border border-dark-300/40">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-white mb-2">What's Next</h2>
                <p className="text-gray-300">Our roadmap for the coming months</p>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-green-500"></div>
                
                <div className="space-y-8">
                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30 relative z-10">
                      <span className="text-blue-400 font-bold">1-2</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <h3 className="text-white font-semibold mb-1">Weeks 1-2</h3>
                      <p className="text-gray-400">Platform stability improvements and critical bug fixes</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center border border-purple-500/30 relative z-10">
                      <span className="text-purple-400 font-bold">3-4</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <h3 className="text-white font-semibold mb-1">Weeks 3-4</h3>
                      <p className="text-gray-400">Limited beta contest launches with select participants</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-6">
                    <div className="w-16 h-16 bg-green-500/20 rounded-xl flex items-center justify-center border border-green-500/30 relative z-10">
                      <span className="text-green-400 font-bold">M2</span>
                    </div>
                    <div className="flex-1 pt-3">
                      <h3 className="text-white font-semibold mb-1">Month 2+</h3>
                      <p className="text-gray-400">Full public launch with regular contest schedule</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          {/* Community CTA */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="text-center"
          >
            <div className="bg-gradient-to-r from-purple-500/10 to-brand-500/10 rounded-xl p-8 border border-purple-500/20">
              <h2 className="text-2xl font-semibold text-white mb-4">Stay Connected</h2>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Join our community for real-time updates, early access opportunities, and direct feedback with our development team.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="https://discord.gg/degenduel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.195.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                  </svg>
                  Join Discord
                </a>
                
                <a 
                  href="https://twitter.com/degenduel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 transform hover:scale-105 font-medium"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                  Follow Updates
                </a>
              </div>
            </div>
          </motion.section>
        </div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="text-center mt-16 pt-8 border-t border-dark-300/20"
        >
          <p className="text-gray-400 mb-6 text-lg">
            Thank you for being part of the DegenDuel community.<br />
            Together, we're building the future of competitive trading.
          </p>
          <Link
            to="/"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg hover:from-brand-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium text-lg shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Return to DegenDuel
          </Link>
        </motion.div>
      </div>
    </div>
  );
};