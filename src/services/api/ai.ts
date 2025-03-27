/**
 * API module for AI services
 * Handles communication with backend AI endpoints
 */

import { API_URL } from "../../config/config";
import { AIMessage, AIErrorType, AIServiceError, ChatResponse } from "../../services/ai";

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
      model?: string;
      temperature?: number;
      maxTokens?: number;
      conversationId?: string;
    } = {}
  ): Promise<ChatResponse> => {
    try {
      const response = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          messages,
          model: options.model,
          temperature: options.temperature,
          maxTokens: options.maxTokens,
          conversationId: options.conversationId
        }),
      });

      // Note: API client will throw if non-200 status is received
      const data = await response.json();
      
      return {
        content: data.content || data.response || data.message || "",
        usage: data.usage || undefined,
        conversationId: data.conversationId || options.conversationId
      };
    } catch (error: any) {
      // Log the error with additional context
      console.error("[AI API] Chat error:", {
        error,
        errorType: error instanceof Error ? error.constructor.name : "Unknown",
        message: error instanceof Error ? error.message : String(error),
        status: error.status,
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