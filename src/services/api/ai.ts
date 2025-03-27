/**
 * API module for AI services
 * Handles communication with backend AI endpoints
 */

import { API_URL } from "../../config/config";
import { AIMessage, AIErrorType, AIServiceError, ChatResponse } from "../../services/ai";

// Log AI service initialization
console.log("AI Service configuration in use:", {
  apiUrl: `${API_URL}/ai`,
  initialized: new Date().toISOString(),
  capabilities: ['chat', 'trading']
});

/**
 * AI API service
 */
export const ai = {
  /**
   * Get a chat completion from the AI
   * @param messages Array of messages in the conversation
   * @param options Optional configuration (model, temperature, etc.)
   * @returns Promise with the AI response
   */
  chat: async (
    messages: AIMessage[], 
    options: {
      conversationId?: string;
      context?: 'default' | 'trading';
    } = {}
  ): Promise<ChatResponse> => {
    try {
      console.log(`[AI Service] Chat request initiated with context: ${options.context || 'default'}`, {
        messageCount: messages.length,
        conversationId: options.conversationId || 'new-conversation',
        timestamp: new Date().toISOString()
      });

      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          messages: messages.filter(msg => msg.role !== 'system'), // Filter out system messages
          context: options.context || 'default',
          conversationId: options.conversationId
        }),
      });

      // Note: API client will throw if non-200 status is received
      const data = await response.json();
      
      console.log(`[AI Service] Chat response received`, {
        success: true,
        conversationId: data.conversationId || options.conversationId || 'new-conversation',
        usageStats: data.usage || 'not provided',
        responseTime: new Date().toISOString()
      });
      
      return {
        content: data.content || data.response || data.message || "",
        usage: data.usage || undefined,
        conversationId: data.conversationId || options.conversationId
      };
    } catch (error: any) {
      // Log the error with additional context
      console.error("[AI Service] Chat error:", {
        error,
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        status: error.status,
        context: options.context || 'default',
        conversationId: options.conversationId || 'new-conversation',
        timestamp: new Date().toISOString(),
      });

      // Convert to AIServiceError if it's not already
      if (!(error instanceof AIServiceError)) {
        // Determine error type based on status code if available
        let errorType = AIErrorType.UNKNOWN;
        if (error.status) {
          switch (error.status) {
            case 401:
            case 403:
              errorType = AIErrorType.AUTHENTICATION;
              break;
            case 429:
              errorType = AIErrorType.RATE_LIMIT;
              break;
            case 400:
              errorType = AIErrorType.INVALID_REQUEST;
              break;
            case 500:
            case 502:
            case 503:
            case 504:
              errorType = AIErrorType.SERVER;
              break;
          }
        } else if (error.message && error.message.includes("network")) {
          errorType = AIErrorType.NETWORK;
        }

        throw new AIServiceError(
          error.message || "AI service error",
          errorType,
          error.status
        );
      }
      
      throw error;
    }
  }
};