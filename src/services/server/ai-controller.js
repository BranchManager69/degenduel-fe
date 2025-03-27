/**
 * AI Controller - Backend server implementation
 * Example structure for server-side handling of AI requests
 * 
 * This file is a reference implementation for how the backend would
 * handle AI requests, securing API keys and managing rate limiting.
 */

// Import the OpenAI SDK
// const { Configuration, OpenAIApi } = require('openai');

/**
 * Handle chat completion requests
 * @param {Request} req The Express/Koa/etc request object
 * @param {Response} res The Express/Koa/etc response object
 */
async function handleChatRequest(req, res) {
  try {
    // Extract request parameters
    const { messages, model, temperature, maxTokens, conversationId } = req.body;
    
    // Validate required parameters
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ 
        error: 'Invalid request: messages array is required'
      });
    }
    
    // Configure OpenAI API client
    // NEVER expose API keys in frontend code! Use server environment variables instead.
    // const configuration = new Configuration({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });
    // const openai = new OpenAIApi(configuration);
    
    // Apply rate limiting based on user identity
    // const userId = req.user?.id || 'anonymous';
    // if (!checkRateLimitForUser(userId)) {
    //   return res.status(429).json({ 
    //     error: 'Rate limit exceeded. Please try again later.'
    //   });
    // }
    
    // Make API request to OpenAI
    // const response = await openai.createChatCompletion({
    //   model: model || 'gpt-3.5-turbo',
    //   messages,
    //   temperature: temperature ?? 0.7,
    //   max_tokens: maxTokens || 150,
    //   user: userId,
    // });
    
    // Send response back to client
    // return res.status(200).json({
    //   content: response.data.choices[0].message.content,
    //   usage: response.data.usage,
    //   conversationId
    // });

    // Mock implementation for testing/reference
    console.log('AI Chat Request:', {
      messages,
      model: model || 'gpt-3.5-turbo',
      temperature: temperature ?? 0.7,
      maxTokens: maxTokens || 150
    });
    
    // Simulated response delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock response
    return res.status(200).json({
      content: 'This is a mock response from the AI service. In a real implementation, this would be the response from OpenAI.',
      usage: {
        prompt_tokens: 56,
        completion_tokens: 24,
        total_tokens: 80
      },
      conversationId
    });
  } catch (error) {
    console.error('AI Chat Request Error:', error);
    
    // Determine appropriate error response
    if (error.response) {
      // OpenAI API error
      const status = error.response.status;
      const data = error.response.data;
      
      // Map common error types
      if (status === 401) {
        return res.status(401).json({ 
          error: 'Authentication error with AI service.'
        });
      } else if (status === 429) {
        return res.status(429).json({ 
          error: 'Rate limit exceeded for AI service.'
        });
      } else if (status === 400) {
        return res.status(400).json({ 
          error: 'Invalid request to AI service: ' + (data.error?.message || 'Unknown error')
        });
      }
      
      // Default server errors
      return res.status(status).json({ 
        error: data.error?.message || 'AI service error'
      });
    }
    
    // Network or unexpected error
    return res.status(500).json({ 
      error: 'Internal server error processing AI request'
    });
  }
}

/**
 * Example rate limit implementation
 * In a real app, this would use Redis or similar for distributed rate limiting
 * @param {string} userId User ID to check rate limit for
 * @returns {boolean} True if request is allowed, false if rate limited
 */
function checkRateLimitForUser(userId) {
  // Example implementation - would be replaced with a proper rate limiting solution
  const now = Date.now();
  const userLimits = rateLimits.get(userId) || { count: 0, resetAt: now + 60000 };
  
  // Reset counter if time has elapsed
  if (now > userLimits.resetAt) {
    userLimits.count = 0;
    userLimits.resetAt = now + 60000;
  }
  
  // Check if rate limited
  if (userLimits.count >= 10) {
    return false;
  }
  
  // Update counter
  userLimits.count++;
  rateLimits.set(userId, userLimits);
  
  return true;
}

// Simple in-memory rate limit store (would use Redis in production)
const rateLimits = new Map();

// Export controller functions
module.exports = {
  handleChatRequest
};