// src/services/ai.ts

/**
 * AI Service
 *
 * @description Comprehensive AI service client for DegenDuel; uses REST API.
 *
 * AI Service uses only REST by design; no WebSocket.
 *  
 * FEATURES:
 * - Support for Streaming REST responses
 * - Support for Structured Output (via OpenAI functions/tools or response_format)
 * - Automatic conversation history tracking (client-side cache)
 * - Improved error handling and retry logic
 * 
 * @author BranchManager69
 * @version 2.0.2 // Version bump
 * @created 2025-04-28
 * @updated 2025-05-08 // Refined Options interfaces based on OpenAI API
 */

// Config
import { API_URL } from '../config/config';
const API_URL_BASE = API_URL;

// Import auth service
import { authService } from './index';

// --- Core Interfaces ---

export interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'; // Added 'tool' role
  content: string | null; // Allow content to be null for tool calls
  tool_calls?: {
    id: string;
    type: 'function';
    function: { name: string; arguments: string; };
  }[]; // Add tool_calls directly to the message for assistant tool requests
  tool_call_id?: string; // For tool responses
  name?: string; // For tool function name
}

export interface AIBaseOptions {
  debug?: boolean;
  user?: string; // Optional end-user identifier for OpenAI monitoring
}

// --- Chat Interfaces & Options (Aligned with Chat Completions API) ---

export interface ChatOptions extends AIBaseOptions {
  conversationId?: string; // For client-side caching
  context?: 'default' | 'trading' | 'terminal'; // DegenDuel specific context for backend prompt engineering

  // Standard OpenAI Chat Completion parameters (subset for frontend control)
  model?: string; // e.g., 'gpt-4', 'gpt-3.5-turbo' - backend might override
  temperature?: number | null; // 0.0 to 2.0
  top_p?: number | null; // Nucleus sampling
  max_tokens?: number | null; // Max tokens to generate
  presence_penalty?: number | null; // -2.0 to 2.0
  frequency_penalty?: number | null; // -2.0 to 2.0
  stop?: string | string[] | null; // Stop sequences
  response_format?: { type: "text" | "json_object" }; // Specify response format
  seed?: number | null; // For reproducibility
  tools?: any[]; // For function calling / tool use
  tool_choice?: string | object; // Control tool usage

  // Streaming options (handled by client logic)
  streaming?: boolean; // If true, use streaming endpoint
  onChunk?: (chunk: string) => void; // Callback for streaming chunks
}

export interface ChatResponse {
  content: string | null; // Content can be null if function/tool is called
  functionCalled?: string; // Deprecated - check tool_calls instead
  tool_calls?: {
    id: string;
    type: 'function';
    function: { name: string; arguments: string; };
  }[];
  conversationId: string;
}

// --- Profile Image Interfaces & Options ---

export interface ImageStyle {
  id: string;
  name: string;
  description: string;
}

export interface ImageOptions extends AIBaseOptions {
  style?: string; // Style ID (e.g., 'cyberpunk', 'pixelart', etc.)
  forceRegenerate?: boolean; // Force regeneration even if image exists
  sourceImages?: string[]; // Optional source images to use
  tokenAddresses?: string[]; // Optional token addresses to incorporate
  prompt?: string; // Custom prompt (for test endpoint)
  quality?: 'low' | 'medium' | 'high'; // Image quality
  size?: '512x512' | '1024x1024'; // Image size
}

export interface ImageResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  result?: {
    url: string;
    type: string;
    model: string;
    quality: string;
    size: string;
    generated_at: string;
    metadata: Record<string, any>;
  };
}

// --- Token Data Interface (Remains the same) ---
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

// --- Error Types (Remain the same) ---
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

// TODO: Is the following correct?
// No global state needed - using simple REST API approach

/**
 * AI Service implementation
 * 
 * Provides an API client for the DegenDuel AI service
 * 
 * TODO: Is the following correct?
 *   Uses REST API for all functionality
 */
class AIService {
  private readonly API_AI_SVC_REST_URL: string;

  // Cache for conversations to enable history tracking without repeated server calls
  private conversationCache = new Map<string, AIMessage[]>();

  constructor() {
    // Correctly set the base path for AI services
    let base = API_URL_BASE;
    // Remove trailing slash from base if present, for consistency
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }

    // Now base is e.g. "https://host.com" or "https://host.com/api"

    if (base.endsWith('/api')) {
      // base is "https://host.com/api", so append "/ai"
      this.API_AI_SVC_REST_URL = `${base}/ai`;
    } else {
      // base is "https://host.com", so append "/api/ai"
      this.API_AI_SVC_REST_URL = `${base}/api/ai`;
    }
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

  // Uses the SHITTY, WOEFULLY OUTDATED, and ENTIRELY WORTHLESS OpenAI Chat Completions API (new standard: OpenAI Responses API. See https://platform.openai.com/docs/api-reference/responses)
  /**
   * Generate a chat completion using the REST API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  private async chatRest(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      // Get auth token for the request (still useful for logging/potential future use, but don't block on it)
      console.log('[AI Service REST] About to attempt token retrieval. Auth state:', authService.isAuthenticated(), 'User:', authService.getUser());
      const token = await authService.getToken();
      console.log('[AI Service REST] Token retrieved:', token ? `Exists (len: ${token.length})` : 'NULL or Undefined');

      // Create the DegenDuel AI Service API URL
      const responseUrl = `${this.API_AI_SVC_REST_URL}/response`;

      const response = await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Only include Auth header if token exists
          ...(token && { 'Authorization': `Bearer ${token}` }),
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

  // Uses the LATEST and GREATEST OpenAI Responses API
  //   @see https://platform.openai.com/docs/api-reference/responses
  /**
   * Generate a streaming chat completion using the stream API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  private async chatStreaming(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    let responseController: AbortController | undefined;
    try {
      // Get auth token for the request (still useful for logging/potential future use, but don't block on it)
      console.log('[AI Service Stream] About to attempt token retrieval. Auth state:', authService.isAuthenticated(), 'User:', authService.getUser());
      const token = await authService.getToken();
      console.log('[AI Service Stream] Token retrieved:', token ? `Exists (len: ${token.length})` : 'NULL or Undefined');

      const streamUrl = `${this.API_AI_SVC_REST_URL}/stream`;
      responseController = new AbortController(); // Create AbortController

      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Only include Auth header if token exists
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          messages,
          conversationId: options.conversationId,
          context: options.context || 'terminal'
        }),
        signal: responseController.signal, // Pass signal to fetch
      });

      if (!response.ok) {
        // Throw error based on response, potentially parsing JSON error
        throw await this.handleErrorResponse(response);
      }

      if (!response.body) {
        throw new AIServiceError('Response body is missing in streaming response.', AIErrorType.SERVER);
      }

      // Process the streaming response using SSE logic
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let responseConversationId = options.conversationId || '';
      let leftover = ''; // Buffer for partial lines

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Stream finished without an explicit isComplete=true event from the server
          // This might be normal or indicate an unexpected closure.
          console.debug('[AI Service Stream] SSE stream ended without isComplete=true event.');
          break;
        }

        // Prepend leftover data from the previous chunk
        const chunkText = leftover + decoder.decode(value, { stream: true });
        const lines = chunkText.split(/\\r?\\n/); // Split into lines

        // The last line might be incomplete, keep it for the next chunk
        leftover = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const jsonData = line.substring(5).trim(); // Remove "data:" prefix and trim whitespace
            if (jsonData) {
              try {
                const parsedData = JSON.parse(jsonData);

                if (parsedData.error) {
                  // Server sent an explicit error object
                  console.error('[AI Service Stream] Received error from server:', parsedData.error);
                  reader.cancel(); // Stop reading the stream
                  throw new AIServiceError(parsedData.error, AIErrorType.SERVER); // Reject the promise
                }

                if (parsedData.conversationId) {
                  responseConversationId = parsedData.conversationId;
                }

                if (parsedData.content) {
                  fullContent += parsedData.content;
                  if (options.onChunk) {
                    options.onChunk(parsedData.content); // Pass only content string
                  }
                }

                if (parsedData.isComplete === true) {
                  console.debug('[AI Service Stream] SSE stream processing complete.');
                  // Don't break here immediately, allow reader.read() to return { done: true }
                  // reader.cancel(); // Optionally cancel reading explicitly
                  // The loop will terminate naturally when done is true.
                  // Resolve will happen outside the loop.
                }

              } catch (e) {
                console.error('[AI Service Stream] Failed to parse SSE data JSON:', jsonData, e);
                // Decide how to handle potentially malformed data from the server
                // Option 1: Ignore the chunk
                // Option 2: Treat as raw text (less likely for SSE)
                // Option 3: Throw an error
                // Current: Ignoring
              }
            }
          } else if (line.trim()) {
            // Handle non-empty lines that don't start with "data:" (e.g., comments, other event types)
            console.debug(`[AI Service Stream] Received non-data SSE line: ${line}`);
          }
        }
      }

      // Update conversation cache only after successful completion
      if (responseConversationId) {
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
      // Ensure the fetch request is aborted if an error occurs
      if (responseController && !responseController.signal.aborted) {
        responseController.abort();
      }

      if (error instanceof AIServiceError) {
        throw error;
      }

      console.error('AI Streaming Error:', error);
      // Check if it's an AbortError (e.g., from reader.cancel() or controller.abort())
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError('Streaming request aborted.', AIErrorType.UNKNOWN);
      }

      throw new AIServiceError(
        'Failed to get streaming AI response.',
        AIErrorType.NETWORK // Or map based on error type if possible
      );
    }
  }

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

  // --- Profile Image Methods ---
  /**
   * Get available image styles
   *
   * @returns Promise with available image styles
   */
  async getImageStyles(): Promise<ImageStyle[]> {
    try {
      const token = await authService.getToken();
      const stylesUrl = `${API_URL_BASE}/api/profile-image/styles`;

      const response = await fetch(stylesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const data = await response.json();
      return data.styles;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      console.error('Failed to get image styles:', error);
      throw new AIServiceError(
        'Failed to get image styles.',
        AIErrorType.NETWORK
      );
    }
  }

  /**
   * Generate a profile image for a user
   *
   * @param walletAddress User's wallet address
   * @param options Configuration options for image generation
   * @returns Promise with the image generation response
   */
  async generateUserImage(walletAddress: string, options: ImageOptions = {}): Promise<ImageResponse> {
    try {
      if (options.debug) {
        console.log('Profile Image Request:', { walletAddress, options });
      }

      const token = await authService.getToken();
      const imageUrl = `${API_URL_BASE}/api/profile-image/generate/${walletAddress}`;

      const response = await fetch(imageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          style: options.style || 'default',
          forceRegenerate: options.forceRegenerate || false,
          sourceImages: options.sourceImages || [],
          tokenAddresses: options.tokenAddresses || []
        }),
      });

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const data = await response.json();

      if (options.debug) {
        console.log('Profile Image Response:', data);
      }

      return data;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      console.error('Profile Image Generation Error:', error);
      throw new AIServiceError(
        'Failed to generate profile image.',
        AIErrorType.UNKNOWN
      );
    }
  }

  /**
   * Generate a test image without user association
   *
   * @param prompt Text description for the image
   * @param options Configuration options for image generation
   * @returns Promise with the test image generation response
   */
  async generateTestImage(prompt: string, options: ImageOptions = {}): Promise<ImageResponse> {
    try {
      if (options.debug) {
        console.log('Test Image Request:', { prompt, options });
      }

      const token = await authService.getToken();
      const imageUrl = `${API_URL_BASE}/api/profile-image/test`;

      const response = await fetch(imageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          style: options.style || 'default',
          quality: options.quality || 'medium',
          size: options.size || '1024x1024'
        }),
      });

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      const data = await response.json();

      if (options.debug) {
        console.log('Test Image Response:', data);
      }

      return data;
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      console.error('Test Image Generation Error:', error);
      throw new AIServiceError(
        'Failed to generate test image.',
        AIErrorType.UNKNOWN
      );
    }
  }
}

/**
 * Create and export a singleton AI Service instance
 *
 * This service now exclusively uses REST API for all operations
 * WebSocket functionality was previously removed in favor of the unified WebSocket system
 *
 * Image generation now uses proper /api/profile-image/* endpoints
 * NO BACKWARD COMPATIBILITY - breaking changes are intentional
 */
export const aiService = new AIService();

// Export default for convenience
export default aiService;