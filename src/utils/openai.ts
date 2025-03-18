/**
 * OpenAI API utility functions for the Terminal component
 */

interface Message {
  role: string;
  content: string;
}

/**
 * Calls the OpenAI API to get a chat response
 * @param messages Array of chat messages with role and content
 * @returns Promise with the AI response text
 */
export const getChatResponse = async (messages: Message[]): Promise<string> => {
  try {
    // Call the V69 chat endpoint
    const response = await fetch('/api/v69/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    
    // Handle V69 response format
    if (data.response) {
      return data.response;
    } else if (data.message) {
      return data.message;
    } else if (data.content) {
      return data.content;
    } else {
      console.warn('Unexpected response format from V69 chat endpoint:', data);
      return 'No response from AI service';
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return getFallbackResponse();
  }
};

/**
 * Returns a fallback response when the OpenAI API call fails
 * @returns A random fallback response
 */
export const getFallbackResponse = (): string => {
  const fallbacks = [
    "I'm having trouble connecting to the AI services right now. Please try again later.",
    "AI services are currently experiencing high demand. Please try again in a moment.",
    "Connection to AI services temporarily unavailable. Try asking a different question.",
    "The DegenDuel AI is currently upgrading. Your patience is appreciated.",
    "AI response limit reached. Please try again soon."
  ];
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};