import { AIMessage, ChatResponse } from '../ai';

/**
 * AI API service interface
 */
export interface AIApi {
  /**
   * Get a chat completion from the AI
   * @param messages Array of messages in the conversation
   * @param options Optional configuration (model, temperature, etc.)
   * @returns Promise with the AI response
   */
  chat(
    messages: AIMessage[], 
    options?: {
      conversationId?: string;
      context?: 'default' | 'trading';
    }
  ): Promise<ChatResponse>;
}