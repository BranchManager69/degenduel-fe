/**
 * OpenAI API utility functions for the Terminal component
 * 
 * @deprecated This file is deprecated. Use the aiService from '../../services/ai' instead.
 * This file is kept for backward compatibility and will be removed in a future update.
 */

import { aiService, AIMessage } from '../services/ai';

interface Message {
  role: string;
  content: string;
}

/**
 * Calls the OpenAI API to get a chat response
 * @param messages Array of chat messages with role and content
 * @returns Promise with the AI response text
 * @deprecated Use aiService.chat() instead
 */
export const getChatResponse = async (messages: Message[]): Promise<string> => {
  try {
    console.warn(
      'Using deprecated getChatResponse from utils/openai.ts. ' +
      'Please update to use aiService.chat() from services/ai.ts instead.'
    );
    
    // Convert to AIMessage[] to ensure type safety
    const aiMessages = messages.map(msg => ({
      role: msg.role as AIMessage['role'],
      content: msg.content
    }));
    
    // Use the new AI service
    const response = await aiService.chat(aiMessages, {
      temperature: 0.7,
      maxTokens: 150
    });
    
    return response.content;
  } catch (error) {
    console.error('Error calling AI service:', error);
    return "Sorry, I'm degenning right now. Check with me again later.";
  }
};

/**
 * Returns a fallback response when the OpenAI API call fails
 * @returns A simple error message
 * @deprecated Use direct error handling instead
 */
export const getFallbackResponse = (): string => {
  console.warn(
    'Using deprecated getFallbackResponse from utils/openai.ts. ' +
    'Use direct error handling instead.'
  );
  
  return "Sorry, I'm degenning right now. Check with me again later.";
};