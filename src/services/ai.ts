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
  context?: 'default' | 'trading' | 'terminal' | 'ui_terminal'; // DegenDuel specific context for backend prompt engineering

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
  
  // NEW: Dynamic UI generation options
  structured_output?: boolean; // Enable UI action generation
  ui_context?: {
    page?: string; // Current page context
    available_components?: string[]; // Components that can be generated
    user_portfolio?: any; // User's portfolio data for context
    current_view?: string; // Current view state
  };
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
  
  // NEW: Dynamic UI actions
  ui_actions?: Array<{
    type: 'create_component' | 'update_component' | 'remove_component' | 'replace_component';
    component: string;
    data?: any;
    placement?: 'above_terminal' | 'below_terminal' | 'sidebar_left' | 'sidebar_right' | 'fullscreen' | 'inline';
    id: string;
    animation?: 'fade_in' | 'slide_up' | 'slide_down' | 'scale_in' | 'none';
    duration?: number;
    title?: string;
    closeable?: boolean;
  }>;
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

/**
 * AI Service implementation
 * 
 * Provides an API client for the DegenDuel AI service
 * 
 * Uses REST API for all functionality (as it must for streaming)
 */
class AIService {
  private readonly API_AI_SVC_REST_URL: string;

  // Cache for conversations to enable history tracking without repeated server calls
  private conversationCache = new Map<string, AIMessage[]>();
  
  // Track which conversations should use non-streaming due to empty responses
  private useNonStreamingForSession = new Set<string>();

  constructor() {
    // Correctly set the base path for AI services
    let base = API_URL_BASE;
    // Remove trailing slash from base if present, for consistency
    if (base.endsWith('/')) {
      base = base.slice(0, -1);
    }

    // Now base is e.g. "https://degenduel.me" or "https://degenduel.me/api"

    if (base.endsWith('/api')) {
      // base is "https://degenduel.me/api", so append "/ai"
      this.API_AI_SVC_REST_URL = `${base}/ai`;
    } else {
      // base is "https://degenduel.me", so append "/api/ai"
      this.API_AI_SVC_REST_URL = `${base}/api/ai`;
    }
  }

  // No WebSocket methods needed - using REST API only

  // Uses the LATEST and GREATEST OpenAI Responses API
  //   @see https://platform.openai.com/docs/api-reference/responses

  /**
   * Generate a streaming chat completion using the proper SSE API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  private async chatStreaming(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    let responseController: AbortController | undefined;
    try {
      // Using cookie-based authentication - no tokens needed
      console.log('[AI Service Stream] Using cookie-based auth. Auth state:', authService.isAuthenticated(), 'User:', authService.getUser());

      const streamUrl = `${this.API_AI_SVC_REST_URL}/didi`;
      responseController = new AbortController();

      // Proper SSE request format matching the guide
      const response = await fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream', // Critical for SSE
        },
        credentials: 'include', // ✅ Send session cookie for authentication
        body: JSON.stringify({
          messages,
          context: options.context || 'terminal',
          loadout: 'default', // Add loadout parameter
          stream: true, // Explicitly enable streaming
          max_tokens: options.max_tokens || 400,
          temperature: options.temperature || 0.6,
          // Include conversation ID if available
          ...(options.conversationId && { conversationId: options.conversationId }),
          // NEW: Structured output options
          ...(options.structured_output && { structured_output: true }),
          ...(options.ui_context && { ui_context: options.ui_context })
        }),
        signal: responseController.signal,
      });

      if (!response.ok) {
        throw await this.handleErrorResponse(response);
      }

      if (!response.body) {
        throw new AIServiceError('Response body is missing in streaming response.', AIErrorType.SERVER);
      }

      // Process the streaming response using proper SSE parsing
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let responseConversationId = options.conversationId || '';
      let buffer = ''; // Buffer for partial lines
      let functionCalls: any[] = [];
      let uiActions: any[] = [];
      let chunkCount = 0;
      
      console.log('[AI Service Stream] Starting SSE stream processing');

      while (true) {
        const { done, value } = await reader.read();
        chunkCount++;
        
        if (done) {
          console.log('[AI Service Stream] SSE stream ended.', {
            totalChunks: chunkCount,
            finalBufferLength: buffer.length,
            finalBuffer: buffer.length > 0 ? buffer : 'empty'
          });
          break;
        }

        // Decode the chunk
        const rawChunk = decoder.decode(value, { stream: true });
        console.log(`[AI Service Stream] Chunk ${chunkCount}:`, {
          rawLength: rawChunk.length,
          rawPreview: rawChunk.substring(0, 100) + (rawChunk.length > 100 ? '...' : ''),
          bufferBefore: buffer.length
        });

        // Append new data to buffer
        buffer += rawChunk;
        const lines = buffer.split('\n');
        
        console.log(`[AI Service Stream] Split into ${lines.length} lines, buffer after: ${buffer.length}`);
        
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || '';
        
        console.log(`[AI Service Stream] Processing ${lines.length} complete lines, keeping buffer: "${buffer}"`);

        for (const line of lines) {
          console.log(`[AI Service Stream] Processing line: "${line}"`);
          
          if (line.startsWith('data: ')) {
            const jsonData = line.substring(6).trim();
            console.log(`[AI Service Stream] Extracted JSON data: "${jsonData}"`);
            
            if (jsonData) {
              try {
                const eventData = JSON.parse(jsonData);
                console.log(`[AI Service Stream] Parsed event:`, eventData);
                
                // Handle different event types based on the guide
                switch (eventData.type) {
                  case 'chunk':
                    console.log(`[AI Service Stream] Processing chunk delta: "${eventData.delta}"`);
                    if (eventData.delta) {
                      fullContent += eventData.delta;
                      console.log(`[AI Service Stream] Full content now: ${fullContent.length} chars`);
                      if (options.onChunk) {
                        console.log(`[AI Service Stream] Calling onChunk with: "${eventData.delta}"`);
                        options.onChunk(eventData.delta);
                      } else {
                        console.log(`[AI Service Stream] No onChunk callback provided`);
                      }
                    }
                    break;
                    
                  case 'function_call':
                    console.log('[AI Service Stream] Function call:', eventData.function);
                    functionCalls.push({
                      id: eventData.function.name + '_' + Date.now(),
                      type: 'function',
                      function: eventData.function
                    });
                    if (options.onChunk) {
                      options.onChunk(`[Calling function: ${eventData.function.name}...]\n`);
                    }
                    break;
                    
                  case 'function_result':
                    console.log('[AI Service Stream] Function result:', eventData.result);
                    if (options.onChunk) {
                      options.onChunk(`[Function result received]\n`);
                    }
                    break;
                    
                  case 'ui_action':
                    console.log('[AI Service Stream] UI Action:', eventData.action);
                    uiActions.push(eventData.action);
                    if (options.onChunk) {
                      options.onChunk(`[Generating ${eventData.action.component}...]\n`);
                    }
                    break;
                    
                  case 'done':
                    console.debug('[AI Service Stream] Stream complete.');
                    if (eventData.usage) {
                      console.log('[AI Service Stream] Token usage:', eventData.usage);
                    }
                    // Stream is done, will exit loop naturally
                    break;
                    
                  case 'error':
                    console.error('[AI Service Stream] Received error:', eventData.error);
                    reader.cancel();
                    throw new AIServiceError(eventData.error, AIErrorType.SERVER);
                    
                  default:
                    console.debug('[AI Service Stream] Unknown event type:', eventData.type, eventData);
                }

              } catch (e) {
                console.error('[AI Service Stream] JSON Parse Error:', {
                  error: e,
                  jsonData: jsonData,
                  jsonDataLength: jsonData.length,
                  jsonDataPreview: jsonData.substring(0, 200),
                  line: line,
                  chunkNumber: chunkCount
                });
                // Continue processing other events
              }
            } else {
              console.log(`[AI Service Stream] Empty JSON data for line: "${line}"`);
            }
          } else if (line.trim()) {
            console.log(`[AI Service Stream] Non-data line: "${line}"`);
          }
        }
      }

      // Update conversation cache only after successful completion
      if (responseConversationId || fullContent) {
        const updatedHistory = [
          ...messages,
          { 
            role: 'assistant' as const, 
            content: fullContent,
            ...(functionCalls.length > 0 && { tool_calls: functionCalls })
          }
        ];
        
        const cacheId = responseConversationId || this.generateConversationId();
        this.conversationCache.set(cacheId, updatedHistory);
        responseConversationId = cacheId;
      }

      // Check if we got completely empty response and fallback to non-streaming
      console.log('[AI Service Stream] Final results:', {
        fullContentLength: fullContent.length,
        fullContentPreview: fullContent.substring(0, 100),
        functionCallsCount: functionCalls.length,
        uiActionsCount: uiActions.length,
        conversationId: responseConversationId
      });
      
      if (!fullContent.trim() && functionCalls.length === 0 && uiActions.length === 0) {
        console.log('[AI Service Stream] Empty response detected, falling back to non-streaming endpoint');
        // Mark this conversation to use non-streaming for the rest of the session
        if (responseConversationId) {
          this.useNonStreamingForSession.add(responseConversationId);
        }
        return this.chatRest(messages, { ...options, streaming: false });
      }

      return {
        content: fullContent,
        tool_calls: functionCalls.length > 0 ? functionCalls : undefined,
        ui_actions: uiActions.length > 0 ? uiActions : undefined,
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
      
      // Check if it's an AbortError
      if (error instanceof Error && error.name === 'AbortError') {
        throw new AIServiceError('Streaming request aborted.', AIErrorType.UNKNOWN);
      }

      throw new AIServiceError(
        'Failed to get streaming AI response.',
        AIErrorType.NETWORK
      );
    }
  }

  /**
   * Generate a conversation ID for caching
   */
  private generateConversationId(): string {
    return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

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
      // Skip streaming if this conversation has had empty responses before
      const useStreaming = !!options.streaming && 
        !(options.conversationId && this.useNonStreamingForSession.has(options.conversationId));

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

  // (private for a reason) Uses the SHITTY, WOEFULLY OUTDATED, and ENTIRELY WORTHLESS OpenAI Chat Completions API (new standard: OpenAI Responses API. See https://platform.openai.com/docs/api-reference/responses)
  /**
   * Generate a chat completion using the SHITTY, WOEFULLY OUTDATED, and ENTIRELY WORTHLESS OpenAI Chat Completions REST API
   * 
   * @param messages Array of messages in the conversation
   * @param options Configuration options
   * @returns Promise with the AI response
   */
  private async chatRest(messages: AIMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    try {
      // Using cookie-based authentication - no tokens needed
      console.log('[AI Service REST] Using cookie-based auth. Auth state:', authService.isAuthenticated(), 'User:', authService.getUser());

      // Create the DegenDuel AI Service API URL
      const responseUrl = `${this.API_AI_SVC_REST_URL}/didi`;

      const response = await fetch(responseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // ✅ Send session cookie for authentication
        body: JSON.stringify({
          messages,
          conversationId: options.conversationId,
          context: options.context || 'terminal',
          stream: false // Explicitly disable streaming for REST endpoint
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
        "I'm busy right now.",
        AIErrorType.NETWORK
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