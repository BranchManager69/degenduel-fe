/**
 * @fileoverview
 * Terminal input component (Refactored for simplicity)
 *
 * @description
 * Handles user input in the terminal with a cleaner, more maintainable structure.
 *
 * @author Branch Manager
 */
import React from 'react';
import { useAuth } from '../../../contexts/UnifiedAuthContext';
import { TerminalInputProps } from '../types';
import { VoiceInput } from './VoiceInput';

export const TerminalInput: React.FC<TerminalInputProps> = ({
  userInput,
  setUserInput,
  onEnter,
  glitchActive = false,
  size = 'middle',
  mode = 'ai',
}) => {
  const inputRef = React.useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const hasVoiceAccess = user?.is_admin || user?.is_superadmin;
  const isContracted = size === 'contracted';

  const handleSendCommand = () => {
    if (!userInput.trim()) return;
    const command = userInput.trim();
    onEnter(command);
    // Clear input after calling onEnter to ensure proper state update
    setTimeout(() => setUserInput(''), 0);
  };

  // Auto-resize textarea based on content
  React.useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      const scrollHeight = inputRef.current.scrollHeight;
      const lineHeight = isContracted ? 20 : 24;
      const maxLines = isContracted ? 3 : 4;
      const maxHeight = lineHeight * maxLines;
      inputRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [userInput, isContracted]);
  
  // Focus input on mount for better UX on desktop
  React.useEffect(() => {
    if (window.innerWidth > 768) { // Avoid popping up mobile keyboard
        inputRef.current?.focus();
    }
  }, []);

  const hasInput = userInput.trim().length > 0;

  return (
    <div className="relative border-t border-mauve/30 bg-black/40 pt-3">
      {/* Input Group */}
      <div className="flex items-center w-full px-2">
        {/* Prompt */}
        <span className="text-mauve-light font-bold mr-2 select-none">&gt;_</span>

        {/* Text Area */}
        <textarea
          ref={inputRef}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendCommand();
            }
          }}
          placeholder={mode === 'ai' ? "Ask Didi anything..." : "Type a message..."}
          className="w-full resize-none bg-transparent text-white/90 placeholder-mauve-dark/50 outline-none focus:ring-0"
          rows={1}
          style={{
            lineHeight: isContracted ? '20px' : '24px',
            minHeight: isContracted ? '20px' : '24px',
            maxHeight: isContracted ? '60px' : '96px',
            fontSize: '16px', // Prevents iOS zoom
            caretColor: 'rgb(157, 78, 221)',
            textShadow: glitchActive
              ? '0 0 8px rgba(255, 50, 50, 0.8)'
              : 'none',
          }}
        />

        {/* Action Buttons */}
        <div className="flex items-center">
            {/* Send Button */}
            <button
                onClick={handleSendCommand}
                disabled={!hasInput}
                className={`
                  flex-shrink-0 rounded-full border-2 flex items-center justify-center transition-all duration-200 transform hover:scale-105 active:scale-95
                  ${isContracted ? 'h-8 w-8 ml-2' : 'h-10 w-10 ml-3'}
                  ${hasInput ? 'bg-mauve border-mauve-dark text-white' : 'bg-darkGrey border-darkGrey-light text-grey-light'}
                `}
                title="Send message"
            >
                <svg
                  width={isContracted ? '14' : '16'}
                  height={isContracted ? '14' : '16'}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M9 18L15 12L9 6" />
                </svg>
            </button>

            {/* Voice Input Button */}
            {hasVoiceAccess && (
                <div className={`${isContracted ? 'transform scale-75' : ''} ml-1`}>
                    <VoiceInput
                        onTranscript={(transcript) => setUserInput(transcript)}
                        onAudioResponse={() => console.log('[TerminalInput] Received audio response')}
                    />
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TerminalInput;