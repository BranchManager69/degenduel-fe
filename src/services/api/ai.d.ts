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
      model?: string;
      temperature?: number;
      maxTokens?: number;
      conversationId?: string;
    }
  ): Promise<ChatResponse>;

  /**
   * Legacy v69 chat API for backward compatibility
   * @param messages Array of messages with role and content
   * @returns Promise with the AI response text
   */
  legacyChat(
    messages: AIMessage[]
  ): Promise<string>;
}