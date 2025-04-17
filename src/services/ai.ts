/**
 * Comprehensive AI service client for DegenDuel
 * Handles interactions with backend AI services
 */

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
  private readonly API_BASE = '/api/ai';
  
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
      
      const response = await fetch(`${this.API_BASE}/chat`, {
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
  
  /* Removed fallback response mechanism as no longer needed */
  
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

// Create and export a singleton instance
export const aiService = new AIService();

// Export default for convenience
export default aiService;