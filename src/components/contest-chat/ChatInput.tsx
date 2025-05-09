import React, { useState } from 'react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, disabled }) => {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
      <div className="flex items-center bg-gray-800 rounded-lg p-1">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-grow bg-transparent text-white p-2 focus:outline-none"
          maxLength={200} // Assuming a max length based on README
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="ml-2 px-4 py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-md disabled:opacity-50 transition-colors"
        >
          Send
        </button>
      </div>
      {/* Basic character counter example, can be enhanced */}
      <div className="text-xs text-gray-500 mt-1 text-right">
        {message.length} / 200
      </div>
    </form>
  );
}; 