// src/services/ai.ts

/**
 * AI Service
 *
 * @description Comprehensive AI service client for DegenDuel; supports both REST and WebSocket communication
 * 
 * NEW FEATURES:
 * - WebSocket support for STREAMING responses
 * - Support for STRUCTURED OUTPUT
 * - Automatic conversation history tracking
 * - Improved error handling and retry logic
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-04-28
 * @updated 2025-05-03
 */

// Config
import { API_URL } from '../config/config';
const API_URL_BASE = API_URL; // Base URL for DegenDuel API; used by the AI Service

// Import auth and unified websocket services
import { authService } from './index';

// AI Message
export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
// Base options that apply to all AI services
export interface AIBaseOptions {
  // Debug flag to log operations
  debug?: boolean;
}

// Chat-specific options
// TODO: THESE ARE TOTALLY OUTDATED!!!!!!!!!!!!!!!!
export interface ChatOptions extends AIBaseOptions {
  // Custom conversation ID for tracking conversations
  // WHAT?????????????????
  conversationId?: string;
  // Conversation context (determines system prompt)
  context?: 'default' | 'trading' | 'terminal';
  // Whether to use streaming responses
  streaming?: boolean;
  // Callback for handling streaming chunks
  onChunk?: (chunk: string) => void;
}

// Image generation options (future use)
// TODO: THESE ARE TOTALLY OUTDATED!!!!!!!!!!!!!!!!
export interface ImageOptions extends AIBaseOptions {
  // Size of generated image
  size?: '256x256' | '512x512' | '1024x1024';
  // Number of images to generate
  n?: number;
  // Image generation quality
  quality?: 'standard' | 'hd';
}

// Response from AI chat service
export interface ChatResponse {
  // The text response
  content: string;
  // Function that was called, if any
  functionCalled?: string;
  // Conversation tracking ID
  conversationId: string;
}

// Token data interface
export interface TokenData {
  symbol: string;
  name: string;
  address: string;
  price?: string;
  price_change_24h?: string;
  market_cap?: string;
  volume_24h?: string;
  social_links?: {
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
  };
  tags?: string[];
  is_monitored?: boolean;
}

// AI service error types
export enum AIErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  INVALID_REQUEST = 'invalid_request',
  NOT_FOUND = 'not_found',
  UNKNOWN = 'unknown'
}

// Error class for AI service errors
export class AIServiceError extends Error {
  type: AIErrorType;
  statusCode?: number;
  
  constructor(message: string, type: AIErrorType = AIErrorType.UNKNOWN, statusCode?: number) {
    super(message);
    this.name = 'AIServiceError';
    this.type = type;
    this.statusCode = statusCode;
  }
}

// No global state needed - using simple REST API approach

/**
 * AI Service implementation
 * 
 * Provides an API client for the DegenDuel AI service
 * Uses REST API for all functionality
 *
 * NOTE: Previously contained a custom WebSocket implementation that has been
 * removed in favor of the UnifiedWebSocketContext system.
 */
class AIService {
  private readonly API_AI_SVC_REST_URL = `${API_URL_BASE}/api/ai`;
  
  // Cache for conversations to enable history tracking without repeated server calls
  private conversationCache = new Map<string, AIMessage[]>();
  
  constructor() {
    // No initialization needed - we use REST API exclusively
  }
  
  // No WebSocket methods needed - using REST API only
  
  /**
   * Generate a chat completion using REST API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  async chat(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      if (options.debug) {
        console.log('AI Chat Request:', { messages, options });
      }
      
      // Determine if we should use streaming
      const useStreaming = !!options.streaming;
      
      // Build conversation history if we have a conversation ID
      let conversationHistory = [...messages];
      if (options.conversationId && this.conversationCache.has(options.conversationId)) {
        const cachedMessages = this.conversationCache.get(options.conversationId) || [];
        
        // Only include the latest user message from the input
        const latestUserMessage = messages[messages.length - 1];
        if (latestUserMessage && latestUserMessage.role === 'user') {
          conversationHistory = [...cachedMessages, latestUserMessage];
        } else {
          conversationHistory = cachedMessages;
        }
      }
      
      // Filter out system messages as they're handled by the backend
      const filteredMessages = conversationHistory.filter(msg => msg.role !== 'system');
      
      // Use appropriate REST API endpoint based on streaming preference
      if (useStreaming) {
        return this.chatStreaming(filteredMessages, options);
      } else {
        return this.chatRest(filteredMessages, options);
      }
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      console.error('AI Chat Error:', error);
      throw new AIServiceError(
        'Failed to get AI response. Please try again later.',
        AIErrorType.UNKNOWN
      );
    }
  }
  
  /**
   * Generate a chat completion using the REST API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  private async chatRest(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      // Get auth token for the request
      const token = await authService.getToken();
      
      // Create the DegenDuel AI Service API URL
      const responseUrl = `${this.API_AI_SVC_REST_URL}/response`;
      
      const response = await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages,
          conversationId: options.conversationId,
          context: options.context || 'terminal'
        }),
      });
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      
      if (options.debug) {
        console.log('AI Chat Response:', data);
      }
      
      // Update conversation cache
      if (data.conversationId) {
        // Add the assistant response to the conversation history
        const updatedHistory = [
          ...messages,
          { role: 'assistant' as const, content: data.content }
        ];
        this.conversationCache.set(data.conversationId, updatedHistory);
      }
      
      return {
        content: data.content || '',
        functionCalled: data.functionCalled,
        conversationId: data.conversationId || options.conversationId || ''
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      console.error('AI REST API Error:', error);
      throw new AIServiceError(
        'Failed to get AI response via REST API.',
        AIErrorType.NETWORK
      );
    }
  }
  
  /**
   * Generate a streaming chat completion using the stream API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  private async chatStreaming(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      // Get auth token for the request
      const token = await authService.getToken();
      
      // Create the DegenDuel AI Service API URL
      const streamUrl = `${this.API_AI_SVC_REST_URL}/stream`;
      
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          messages,
          conversationId: options.conversationId,
          context: options.context || 'terminal'
        }),
      });
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      // Process the streaming response
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let responseConversationId = options.conversationId || '';
      
      // Read and process the stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        
        // Process the chunk
        try {
          // Try to parse as JSON - the stream might have complete JSON chunks or partial text
          const jsonChunk = JSON.parse(chunk);
          
          if (jsonChunk.conversationId) {
            responseConversationId = jsonChunk.conversationId;
          }
          
          if (jsonChunk.content) {
            fullContent += jsonChunk.content;
            if (options.onChunk) {
              options.onChunk(jsonChunk.content);
            }
          }
        } catch (e) {
          // Not valid JSON, treat as raw content
          fullContent += chunk;
          if (options.onChunk) {
            options.onChunk(chunk);
          }
        }
      }
      
      // Update conversation cache
      if (responseConversationId) {
        // Add the assistant response to the conversation history
        const updatedHistory = [
          ...messages,
          { role: 'assistant' as const, content: fullContent }
        ];
        this.conversationCache.set(responseConversationId, updatedHistory);
      }
      
      return {
        content: fullContent,
        conversationId: responseConversationId
      };
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      console.error('AI Streaming Error:', error);
      throw new AIServiceError(
        'Failed to get streaming AI response.',
        AIErrorType.NETWORK
      );
    }
  }
  
  // WebSocket methods have been removed in favor of REST API only
  
  /**
   * Get token data directly without using natural language
   * 
   * @param tokenAddressOrSymbol Token address or symbol
   * @returns Promise with token data
   */
  async getTokenData(tokenAddressOrSymbol: string): Promise<TokenData> {
    try {
      const response = await fetch(`${this.API_AI_SVC_REST_URL}/data/${tokenAddressOrSymbol}`);
      
      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      
      console.error('Token Data Error:', error);
      throw new AIServiceError(
        'Failed to get token data',
        AIErrorType.NETWORK
      );
    }
  }
  
  /**
   * Get the WebSocket connection status
   * 
   * @deprecated WebSocket functionality has been removed in favor of the unified WebSocket system
   * @returns Always returns false since WebSocket is no longer managed by this service
   */
  isWebSocketConnected(): boolean {
    return false;
  }
  
  /**
   * Clear conversation history
   * 
   * @param conversationId Optional conversation ID to clear specific conversation
   */
  clearConversation(conversationId?: string): void {
    if (conversationId) {
      this.conversationCache.delete(conversationId);
    } else {
      this.conversationCache.clear();
    }
  }
  
  /**
   * Process API error responses
   * 
   * @param response The fetch response object
   * @returns A properly typed AIServiceError
   */
  private async handleErrorResponse(response: Response): Promise<AIServiceError> {
    const statusCode = response.status;
    let errorMessage = 'AI service error';
    let errorType = AIErrorType.UNKNOWN;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || errorData.message || errorMessage;
      errorType = this.getErrorType(statusCode, errorData.type);
    } catch (e) {
      // If we can't parse the error as JSON, use default error message
    }
    
    return new AIServiceError(errorMessage, errorType, statusCode);
  }
  
  /**
   * Map status codes to error types
   * 
   * @param status HTTP status code
   * @param errorType Optional error type from server
   * @returns Mapped AIErrorType
   */
  private getErrorType(status: number, errorType?: string): AIErrorType {
    if (errorType) {
      switch (errorType) {
        case 'invalid_request': return AIErrorType.INVALID_REQUEST;
        case 'authentication': return AIErrorType.AUTHENTICATION;
        case 'rate_limit': return AIErrorType.RATE_LIMIT;
        case 'server': return AIErrorType.SERVER;
        case 'not_found': return AIErrorType.NOT_FOUND;
        case 'network': return AIErrorType.NETWORK;
      }
    }
    
    // Map status code to error type
    switch (status) {
      case 400: return AIErrorType.INVALID_REQUEST;
      case 401: case 403: return AIErrorType.AUTHENTICATION;
      case 404: return AIErrorType.NOT_FOUND;
      case 429: return AIErrorType.RATE_LIMIT;
      case 500: case 502: case 503: case 504: return AIErrorType.SERVER;
      default: return AIErrorType.UNKNOWN;
    }
  }
}

/**
 * Create and export a singleton AI Service instance
 * 
 * This service now exclusively uses REST API for all operations
 * WebSocket functionality was previously removed in favor of the unified WebSocket system
 */
export const aiService = new AIService();

// Export default for convenience
export default aiService;