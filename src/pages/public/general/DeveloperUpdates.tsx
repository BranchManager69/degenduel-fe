import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { getDeveloperUpdates, type DeveloperUpdate } from '../../../utils/developerUpdates';

export const DeveloperUpdates: React.FC = () => {
  const [updates, setUpdates] = useState<DeveloperUpdate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load default updates only (no localStorage dependency)
    const loadUpdates = () => {
      setUpdates(getDeveloperUpdates());
      setLoading(false);
    };

    // Brief loading for UX
    setTimeout(loadUpdates, 300);
  }, []);

  const filteredUpdates = selectedCategory === 'all' 
    ? updates 
    : updates.filter(update => update.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'feature': return 'from-green-500 to-emerald-500';
      case 'bugfix': return 'from-red-500 to-rose-500';
      case 'announcement': return 'from-blue-500 to-cyan-500';
      case 'technical': return 'from-purple-500 to-violet-500';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'feature': return '✨';
      case 'bugfix': return '🔧';
      case 'announcement': return '📢';
      case 'technical': return '⚙️';
      default: return '📝';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-100 via-dark-200 to-dark-300 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(153,51,255,0.1) 0%, transparent 50%)`
        }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Professional Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-block mb-6">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-400/20 to-purple-500/20 rounded-full flex items-center justify-center border border-brand-400/30 backdrop-blur-sm">
              <span className="text-3xl">🚀</span>
            </div>
          </div>
          
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Developer Updates
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-brand-400 to-purple-500 mx-auto mb-6"></div>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Stay up to date with the latest developments, features, and improvements to DegenDuel
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-12"
        >
          <div className="bg-dark-200/60 backdrop-blur-sm rounded-xl p-6 border border-dark-300/40">
            <div className="flex flex-wrap justify-center gap-3">
              {['all', 'feature', 'bugfix', 'announcement', 'technical'].map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedCategory === category
                      ? 'bg-brand-500 text-white shadow-lg'
                      : 'bg-dark-300/60 text-gray-400 hover:bg-dark-300 hover:text-gray-300'
                  }`}
                >
                  {category === 'all' ? 'All Updates' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Updates List */}
        <div className="space-y-8">
          {filteredUpdates.map((update, index) => (
            <motion.article
              key={update.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              <div className={`absolute -inset-4 bg-gradient-to-r ${getCategoryColor(update.category)}/5 rounded-2xl`}></div>
              <div className="relative bg-dark-200/60 backdrop-blur-sm rounded-xl p-8 border border-dark-300/40 hover:border-dark-300/60 transition-all duration-300">
                
                {/* Update Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${getCategoryColor(update.category)}/20 rounded-full flex items-center justify-center flex-shrink-0 border border-current/20`}>
                      <span className="text-xl">{getCategoryIcon(update.category)}</span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white mb-2">{update.title}</h2>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>By {update.author}</span>
                        <span>•</span>
                        <span>{formatDate(update.date)}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${getCategoryColor(update.category)}/20 text-white`}>
                          {update.category}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Update Content */}
                <div className="prose prose-invert max-w-none">
                  <div className="text-gray-300 leading-relaxed whitespace-pre-line">
                    {update.content}
                  </div>
                </div>

                {/* Tags */}
                {update.tags && update.tags.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-dark-300/20">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">Tags:</span>
                      {update.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-dark-300/40 text-gray-400 text-xs rounded-md"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>

        {/* Empty State */}
        {filteredUpdates.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto bg-dark-300/40 rounded-full flex items-center justify-center mb-6">
              <span className="text-3xl text-gray-500">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No updates found</h3>
            <p className="text-gray-500">No updates match the selected category.</p>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="text-center mt-16 pt-8 border-t border-dark-300/20"
        >
          <p className="text-gray-400 mb-6 text-lg">
            Stay connected for the latest updates and developments
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              to="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-brand-500 to-purple-600 text-white rounded-lg hover:from-brand-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 font-medium"
            >
              <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to DegenDuel
            </Link>
            <a
              href="https://discord.gg/degenduel"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-all duration-300 transform hover:scale-105 font-medium"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.195.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
              </svg>
              Join Discord
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
};