#!/usr/bin/env node

/**
 * Real Didi Conversation Test
 * 
 * @description Makes REAL API calls to test Didi's SQL and portfolio functions
 * This talks to the ACTUAL AI service, no simulation
 * 
 * Usage: 
 *   node scripts/test-didi-real-conversation.js [wallet_address]
 * 
 * @author BranchManager69
 * @created 2025-01-06
 */

import fetch from 'node-fetch';
import chalk from 'chalk';
import readline from 'readline';

// Configuration
const API_URL = process.env.API_URL || 'https://degenduel.me/api';
const TEST_WALLET = process.argv[2] || 'BPuRhkeCkor7DxMrcPVsB4AdW6Pmp5oACjVzpPb72Mhp';

// Conversation state
let conversationHistory = [];
let conversationId = null;

// Test scenarios
const TEST_CONVERSATIONS = [
  [
    "What's my portfolio in contest 123?",
    "Show me all my active contest portfolios",
    "Which of my contests has the best performance?"
  ],
  [
    "Run a SQL query to show me the top 10 users by contest winnings",
    "Now show me how many contests each of those users participated in",
    "Which tokens do these top users prefer?"
  ],
  [
    "How many contests have I participated in total?",
    "What's my win rate?",
    "Show me my best performing token picks historically"
  ]
];

async function callDidiAPI(message) {
  // Add user message to history
  conversationHistory.push({ role: 'user', content: message });
  
  const requestBody = {
    messages: conversationHistory,
    context: 'terminal',
    streaming: false,
    conversationId: conversationId,
    userId: TEST_WALLET,
    userRole: 'user',
    tools: [
      { type: "getMyPortfolio", enabled: true },
      { type: "executeSQL", enabled: true },
      { type: "updatePortfolio", enabled: true },
      { type: "web_search", enabled: true },
      { type: "file_search", enabled: true }
    ]
  };

  try {
    console.log(chalk.gray('🔄 Calling AI service...'));
    
    const response = await fetch(`${API_URL}/ai/didi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    // Update conversation ID if provided
    if (data.conversationId) {
      conversationId = data.conversationId;
    }
    
    // Add assistant response to history
    if (data.content) {
      conversationHistory.push({ 
        role: 'assistant', 
        content: data.content,
        tool_calls: data.tool_calls 
      });
    }
    
    return data;
  } catch (error) {
    console.error(chalk.red('API Error:'), error.message);
    throw error;
  }
}

function displayResponse(response) {
  // Show AI response
  console.log(chalk.green('\n🤖 Didi:'), response.content || 'No response');
  
  // Show function calls if any
  if (response.tool_calls && response.tool_calls.length > 0) {
    console.log(chalk.cyan('\n📞 Function Calls:'));
    response.tool_calls.forEach(tc => {
      const args = JSON.parse(tc.function.arguments);
      console.log(chalk.gray(`   • ${tc.function.name}(${JSON.stringify(args)})`));
    });
  }
  
  // Show any additional data
  if (response.functionCalled) {
    console.log(chalk.magenta('\n🔧 Function Result:'), response.functionCalled);
  }
}

async function runTestConversation(conversation, name) {
  console.log(chalk.yellow('\n' + '='.repeat(70)));
  console.log(chalk.yellow.bold(`Test Conversation: ${name}`));
  console.log(chalk.yellow('='.repeat(70)));
  
  // Reset conversation
  conversationHistory = [];
  conversationId = null;
  
  for (const message of conversation) {
    console.log(chalk.blue(`\n👤 You: ${message}`));
    
    try {
      const response = await callDidiAPI(message);
      displayResponse(response);
      
      // Wait a bit between messages
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(chalk.red(`\n❌ Failed: ${error.message}`));
      break;
    }
  }
}

async function interactiveMode() {
  console.log(chalk.bold.cyan('\n🎮 Interactive Mode - Chat with Didi\n'));
  console.log(chalk.gray(`Using wallet: ${TEST_WALLET}`));
  console.log(chalk.gray('Type "exit" to quit, "clear" to reset conversation\n'));
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  // Reset conversation
  conversationHistory = [];
  conversationId = null;
  
  const askQuestion = () => {
    rl.question(chalk.blue('You: '), async (input) => {
      if (input.toLowerCase() === 'exit') {
        console.log(chalk.yellow('\nGoodbye! 👋'));
        rl.close();
        process.exit(0);
      }
      
      if (input.toLowerCase() === 'clear') {
        conversationHistory = [];
        conversationId = null;
        console.log(chalk.yellow('🗑️  Conversation cleared\n'));
        askQuestion();
        return;
      }
      
      try {
        const response = await callDidiAPI(input);
        displayResponse(response);
      } catch (error) {
        console.error(chalk.red(`\n❌ Error: ${error.message}`));
      }
      
      console.log(''); // Empty line
      askQuestion();
    });
  };
  
  askQuestion();
}

async function runAllTests() {
  console.log(chalk.bold.cyan('\n🧪 Didi Real Conversation Test Suite\n'));
  console.log(chalk.gray(`API URL: ${API_URL}`));
  console.log(chalk.gray(`Test Wallet: ${TEST_WALLET}`));
  console.log(chalk.gray(`Time: ${new Date().toISOString()}\n`));
  
  // Test 1: Portfolio queries
  await runTestConversation(
    TEST_CONVERSATIONS[0], 
    "Portfolio Management"
  );
  
  // Test 2: SQL queries
  await runTestConversation(
    TEST_CONVERSATIONS[1], 
    "Database Analysis"
  );
  
  // Test 3: Personal stats
  await runTestConversation(
    TEST_CONVERSATIONS[2], 
    "User Statistics"
  );
  
  console.log(chalk.green('\n\n✅ All test conversations completed!'));
  console.log(chalk.gray('Run with --interactive to chat directly with Didi\n'));
}

// Main execution
const args = process.argv.slice(2);

if (args.includes('--interactive') || args.includes('-i')) {
  interactiveMode();
} else {
  runAllTests()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(chalk.red('Fatal error:'), error);
      process.exit(1);
    });
}