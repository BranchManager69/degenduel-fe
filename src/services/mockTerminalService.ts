/**
 * Mock Terminal Chat Service
 * 
 * This service provides predefined responses for the Terminal component's chat functionality.
 * It simulates an API call with predefined responses based on message content.
 */

// Mock delay to simulate network request
const MOCK_DELAY = 500;

// Predefined responses based on keywords
const responses: Record<string, string> = {
  'default': "I'm DegenDuel's AI assistant. I can tell you about our trading competitions, token prices, prize pools, and how to play. What would you like to know?",
  'about': "DegenDuel is a high-stakes crypto trading competition platform on Solana where users can compete in trading battles to win SOL prizes.",
  'contest': "Our competitions let you pit your crypto trading skills against other players. Pick the best-performing tokens and win SOL prizes!",
  'competition': "DegenDuel competitions range from quick 1-hour battles to multi-day tournaments. Entry fees and prize pools vary by contest.",
  'token': "DegenDuel tracks real-time prices of hundreds of Solana tokens. You can compete using both popular and emerging tokens in your portfolio.",
  'price': "Token prices are pulled from real-time market data. Your competition performance depends on how well your selected tokens perform during the contest period.",
  'prize': "Prize pools vary by contest, with some competitions offering substantial SOL rewards. The higher the entry fee, the bigger the potential prize!",
  'reward': "Top performers in each contest win SOL rewards from the prize pool. The exact distribution depends on the contest format.",
  'how': "To play: 1) Connect your wallet 2) Enter a contest by paying the entry fee 3) Build your token portfolio 4) Watch the leaderboard as prices change 5) Win prizes if your portfolio performs well!",
  'solana': "DegenDuel is built on Solana to provide fast, low-cost trading competitions with real-time updates. All entry fees and prizes are in SOL.",
  'help': "I can answer questions about DegenDuel's trading competitions, how to play, prize structures, and more. Just ask!",
};

/**
 * Process a chat message and return a predefined response
 * @param message The user's chat message
 * @returns Promise that resolves to a response object
 */
export const processTerminalChat = async (message: string): Promise<{ response: string; timestamp: string }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Convert message to lowercase for matching
      const lowerMessage = message.toLowerCase();
      
      // Find matching keyword
      let responseText = responses.default;
      for (const [keyword, response] of Object.entries(responses)) {
        if (keyword !== 'default' && lowerMessage.includes(keyword)) {
          responseText = response;
          break;
        }
      }
      
      // Simulate slight variation in responses
      if (Math.random() > 0.7) {
        responseText += " Anything else you'd like to know?";
      }
      
      resolve({
        response: responseText,
        timestamp: new Date().toISOString()
      });
    }, MOCK_DELAY);
  });
};

/**
 * Mock terminal chat API endpoint for use with customApiConfig
 * @param message The user's message
 * @returns Promise that resolves to the API response
 */
export const mockTerminalEndpoint = async (message: string): Promise<Response> => {
  const result = await processTerminalChat(message);
  
  // Create a mock Response object
  return new Response(JSON.stringify(result), {
    headers: {
      'Content-Type': 'application/json'
    },
    status: 200
  });
};