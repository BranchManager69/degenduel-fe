import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Portfolio Preview Modal Component
 * 
 * This component displays a portfolio preview with token breakdown.
 * It was originally created for the Solana Blinks integration but moved
 * to be used in the MyPortfoliosPage instead.
 * 
 * @todo Add integration with MyPortfoliosPage including:
 * - Portfolio performance metrics
 * - Historical data visualization
 * - Export/share functionality
 */

interface PortfolioPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  source: 'ai' | 'recent';
  summary: string;
  onConfirm?: () => void; // Optional for view-only mode
  readonly?: boolean; // Set to true for view-only mode (no confirmation buttons)
  portfolioDetails?: {
    name?: string;
    created?: string;
    performance?: string;
    tokens?: Array<{
      symbol: string;
      weight: number;
      price?: number;
    }>;
  };
}

const PortfolioPreviewModal: React.FC<PortfolioPreviewModalProps> = ({
  isOpen,
  onClose,
  source,
  summary,
  onConfirm,
  readonly = false,
  portfolioDetails
}) => {
  // Close on ESC key press
  React.useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // Close modal when clicking outside
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={handleBackdropClick}
        >
          {/* Modal content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ 
              duration: 0.4,
              ease: [0.19, 1.0, 0.22, 1.0],
            }}
            className="relative w-full max-w-md overflow-hidden z-10"
          >
            {/* Outer glow effect */}
            <div className="absolute -inset-1 bg-gradient-to-br from-brand-400/30 via-transparent to-brand-400/30 blur-md rounded-xl"></div>
            
            {/* Modal with cyber styling */}
            <div className="relative bg-dark-800 backdrop-blur-sm rounded-xl overflow-hidden border border-brand-400/30 shadow-xl shadow-dark-900/50 p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 bg-dark-300/70 flex items-center justify-center text-white/70 hover:text-white transition-all z-10"
              >
                <span className="transform translate-y-[-1px]">&times;</span>
              </button>
              
              <h3 className="text-xl font-bold text-white mb-2">
                {portfolioDetails?.name || (source === 'ai' ? 'AI-Selected Portfolio' : 'Your Recent Portfolio')}
              </h3>
              
              {portfolioDetails?.created && (
                <div className="text-xs text-gray-400 mb-2">
                  Created {portfolioDetails.created}
                </div>
              )}
              
              <p className="text-gray-300 text-sm mb-4">
                {source === 'ai' 
                  ? 'Our AI has selected this portfolio based on trending tokens'
                  : 'Based on your previous contest entries'}
              </p>
              
              {/* Performance data if available */}
              {portfolioDetails?.performance && (
                <div className="px-4 py-3 bg-dark-700/50 rounded-lg mb-4 border-l-2 border-brand-400/30">
                  <div className="text-sm text-gray-300">Performance</div>
                  <div className="text-xl font-bold text-brand-400">{portfolioDetails.performance}</div>
                </div>
              )}
              
              {/* Token chips */}
              <div className="flex flex-wrap gap-2 mb-6">
                {summary.split(', ').map((item, i) => (
                  <span 
                    key={i} 
                    className="px-3 py-1.5 bg-dark-700 text-brand-300 hover:text-brand-200 text-sm rounded border-l border-brand-400/30 transition-all duration-300 transform hover:translate-x-1"
                  >
                    {item}
                  </span>
                ))}
              </div>
              
              {/* Detailed token breakdown if available */}
              {portfolioDetails?.tokens && portfolioDetails.tokens.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Token Allocation</h4>
                  <div className="space-y-2">
                    {portfolioDetails.tokens.map((token, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <span className="text-sm text-white">{token.symbol}</span>
                        </div>
                        <div className="text-sm text-gray-300">{token.weight}%</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Action buttons */}
              {!readonly && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-dark-300/80 rounded border border-dark-300 hover:border-brand-400/30 transition-all duration-300 text-white/70 hover:text-white"
                  >
                    Cancel
                  </button>
                  
                  {onConfirm && (
                    <button
                      onClick={onConfirm}
                      className="flex-1 py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-bold rounded transform hover:scale-105 transition-all duration-300 border border-white/10 shadow"
                    >
                      Confirm Portfolio
                    </button>
                  )}
                </div>
              )}
              
              {/* View-only mode footer */}
              {readonly && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={onClose}
                    className="px-6 py-3 bg-dark-300/80 rounded border border-dark-300 hover:border-brand-400/30 transition-all duration-300 text-white/70 hover:text-white"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PortfolioPreviewModal;