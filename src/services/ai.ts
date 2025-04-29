// src/services/ai.ts

/**
 * AI Service
 * 
 * Comprehensive AI service client for DegenDuel
 * Handles interactions with backend AI services
 * 
 * @author BranchManager69
 * @version 1.9.0
 * @created 2025-04-28
 * @updated 2025-04-28
 */

// Config
import { API_URL } from '../config/config';
const API_URL_BASE = API_URL; // Base URL for DegenDuel API; used by the AI Service

// Messages have standard OpenAI-compatible format
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
export interface ChatOptions extends AIBaseOptions {
  // Custom conversation ID for tracking conversations
  conversationId?: string;
  // Conversation context (determines system prompt)
  context?: 'default' | 'trading';
}

// Image generation options (future use)
export interface ImageOptions extends AIBaseOptions {
  // Size of generated image
  size?: '256x256' | '512x512' | '1024x1024';
  // Number of images to generate
  n?: number;
  // Image generation quality
  quality?: 'standard' | 'hd';
}

// Voice options (future use)
export interface VoiceOptions extends AIBaseOptions {
  // Voice type to use
  voice?: string;
  // Speech speed (0.25-4.0)
  speed?: number;
}

// Response from AI chat service
export interface ChatResponse {
  // The text response
  content: string;
  // Usage statistics when available
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  // Conversation tracking ID
  conversationId?: string;
}

// AI service error types
export enum AIErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  SERVER = 'server',
  INVALID_REQUEST = 'invalid_request',
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

/**
 * AI Service implementation
 */
class AIService {
  // TODO: Are we positive that this is the correct AI Service API URL?
  //       For websocket, we actually use the api/v69/ws path.
  private readonly API_AI_SVC_REST_URL = `${API_URL_BASE}/api/ai`;
  private readonly API_AI_SVC_WS_URL = `${API_URL_BASE}/api/v69/ws`;

  /**
   * Get a chat completion from the AI
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  async chat(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      if (options.debug) {
        console.log('AI Chat Request:', { messages, options });
      }

      // Filter out system messages as they're handled by the backend
      const filteredMessages = messages.filter(msg => msg.role !== 'system');
      
      // Create the DegenDuel AI Service API URL
      const responseUrl = `${this.API_AI_SVC_REST_URL}/chat`;
      const response = await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: filteredMessages,
          context: options.context || 'default',
          conversationId: options.conversationId
        }),
      });
      
      if (!response.ok) {
        throw this.handleErrorResponse(response);
      }
      
      const data = await response.json();
      
      if (options.debug) {
        console.log('AI Chat Response:', data);
      }
      
      return {
        content: data.content || data.response || data.message || '',
        usage: data.usage || undefined,
        conversationId: data.conversationId || options.conversationId
      };
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
   * Get a chat completion from the AI via WebSocket
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  async chatWebSocket(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      // Create the WebSocket connection
      const ws = new WebSocket(this.API_AI_SVC_WS_URL);

      // Return a promise that resolves when the WebSocket connection is closed
      return new Promise((resolve, reject) => {
        // Handle WebSocket connection events
        ws.onopen = () => {
          console.log('AI Chat WebSocket connected');
          
          // Send the messages to the AI service
          ws.send(JSON.stringify({
            messages: messages,
            context: options.context || 'default',
            conversationId: options.conversationId
          }));
        };

        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          console.log('AI Chat WebSocket message:', data);
        };

        ws.onclose = () => {
          console.log('AI Chat WebSocket closed');
          resolve({
            content: '',
            usage: undefined,
            conversationId: options.conversationId
          });
        };

        // Handle WebSocket connection errors
        ws.onerror = (error) => {
          console.error('AI Chat WebSocket error:', error);
          reject(new AIServiceError(
            'Failed to get AI response. Please try again later.',
            AIErrorType.UNKNOWN
          ));
        };
      });
    } catch (error) {
      console.error('AI Chat WebSocket Error:', error);
      throw new AIServiceError(
        'Failed to get AI response. Please try again later.',
        AIErrorType.UNKNOWN
      );
    }
  } 

  /**
   * Process API error responses
   * @param response The fetch response object
   * @returns A properly typed AIServiceError
   */
  private handleErrorResponse(response: Response): AIServiceError {
    const statusCode = response.status;
    
    switch (statusCode) {
      case 401:
      case 403:
        return new AIServiceError(
          'Authentication error with AI service.',
          AIErrorType.AUTHENTICATION,
          statusCode
        );
      case 429:
        return new AIServiceError(
          'Rate limit exceeded for AI service.',
          AIErrorType.RATE_LIMIT,
          statusCode
        );
      case 400:
        return new AIServiceError(
          'Invalid request to AI service.',
          AIErrorType.INVALID_REQUEST,
          statusCode
        );
      case 500:
      case 502:
      case 503:
      case 504:
        return new AIServiceError(
          'AI service is currently unavailable.',
          AIErrorType.SERVER,
          statusCode
        );
      default:
        return new AIServiceError(
          `AI service error (${statusCode}).`,
          AIErrorType.UNKNOWN,
          statusCode
        );
    }
  }
  
  // Image generation - future implementation
  async generateImage(_prompt: string, _options: ImageOptions = {}): Promise<any> {
    throw new AIServiceError('Image generation not yet implemented', AIErrorType.INVALID_REQUEST);
  }
  
  // Voice synthesis - future implementation
  async synthesizeSpeech(_text: string, _options: VoiceOptions = {}): Promise<any> {
    throw new AIServiceError('Voice synthesis not yet implemented', AIErrorType.INVALID_REQUEST);
  }
}

// Create and export a singleton AI Service instance
export const aiService = new AIService();
// Export default for convenience
export default aiService;