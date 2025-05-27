import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminWallet } from '../../pages/admin/AdminWalletDashboard';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: AdminWallet[];
  onSelectWallets: (walletIds: string[]) => void;
}

interface Command {
  id: string;
  label: string;
  description: string;
  execute: (wallets: AdminWallet[]) => AdminWallet[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  wallets,
  onSelectWallets
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Hard-coded command set
  const commands: Command[] = useMemo(() => [
    {
      id: 'select-gt-002',
      label: 'select > 0.02 SOL',
      description: 'Select wallets with more than 0.02 SOL',
      execute: (wallets) => wallets.filter(w => (w.balance_sol || 0) > 0.02)
    },
    {
      id: 'select-lt-002',
      label: 'select < 0.02 SOL',
      description: 'Select dust wallets (less than 0.02 SOL)',
      execute: (wallets) => wallets.filter(w => (w.balance_sol || 0) < 0.02)
    },
    {
      id: 'select-empty',
      label: 'select empty',
      description: 'Select wallets with zero balance',
      execute: (wallets) => wallets.filter(w => (w.balance_sol || 0) === 0)
    },
    {
      id: 'select-richest-10',
      label: 'select richest 10',
      description: 'Select top 10 wallets by balance',
      execute: (wallets) => wallets
        .sort((a, b) => (b.balance_sol || 0) - (a.balance_sol || 0))
        .slice(0, 10)
    },
    {
      id: 'select-poorest-50',
      label: 'select poorest 50',
      description: 'Select bottom 50 wallets by balance',
      execute: (wallets) => wallets
        .sort((a, b) => (a.balance_sol || 0) - (b.balance_sol || 0))
        .slice(0, 50)
    },
    {
      id: 'select-all',
      label: 'select all',
      description: 'Select all wallets',
      execute: (wallets) => wallets
    },
    {
      id: 'select-none',
      label: 'select none',
      description: 'Clear selection',
      execute: () => []
    },
    {
      id: 'deselect-all',
      label: 'deselect all',
      description: 'Clear selection',
      execute: () => []
    },
    {
      id: 'select-random-10',
      label: 'select random 10',
      description: 'Select 10 random wallets',
      execute: (wallets) => {
        const shuffled = [...wallets].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 10);
      }
    },
    {
      id: 'select-with-tokens',
      label: 'select with tokens',
      description: 'Select wallets that have tokens',
      execute: (wallets) => wallets.filter(w => (w.token_count || 0) > 0)
    },
    {
      id: 'select-no-tokens',
      label: 'select no tokens',
      description: 'Select SOL-only wallets',
      execute: (wallets) => wallets.filter(w => (w.token_count || 0) === 0)
    }
  ], []);

  // Filter commands based on search
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;
    
    const query = searchQuery.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(query) ||
      cmd.description.toLowerCase().includes(query)
    );
  }, [commands, searchQuery]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  const executeCommand = useCallback((command: Command) => {
    const selectedWallets = command.execute(wallets);
    onSelectWallets(selectedWallets.map(w => w.id));
    onClose();
    setSearchQuery('');
  }, [wallets, onSelectWallets, onClose]);

  const handleCommandClick = useCallback((command: Command) => {
    executeCommand(command);
  }, [executeCommand]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className="bg-dark-200/95 backdrop-blur-lg border border-brand-500/40 rounded-lg shadow-2xl w-full max-w-lg mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="border-b border-gray-600/40 p-4">
            <div className="flex items-center gap-3">
              <div className="text-brand-400 text-lg">⌘</div>
              <input
                type="text"
                placeholder="Type a command..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-gray-100 placeholder-gray-400 outline-none font-mono"
                autoFocus
              />
              <div className="text-xs text-gray-500 font-mono">ESC to close</div>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="p-4 text-center text-gray-400 font-mono">
                No commands found for "{searchQuery}"
              </div>
            ) : (
              filteredCommands.map((command, index) => (
                <motion.div
                  key={command.id}
                  className={`
                    p-4 cursor-pointer border-b border-gray-600/20 last:border-b-0
                    ${index === selectedIndex 
                      ? 'bg-brand-500/20 border-brand-500/40' 
                      : 'hover:bg-gray-700/30'
                    }
                    transition-colors duration-150
                  `}
                  onClick={() => handleCommandClick(command)}
                  whileHover={{ x: 4 }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-gray-100 font-mono text-sm">
                        {command.label}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        {command.description}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <div className="text-brand-400 text-sm font-mono">↵</div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-600/40 p-3 text-xs text-gray-500 font-mono text-center">
            Use ↑↓ to navigate, ↵ to execute, ESC to close
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;