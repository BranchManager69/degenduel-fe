#!/usr/bin/env node

/**
 * Single Function Test
 * Quick test to see if Didi calls specific functions
 */

import fetch from 'node-fetch';
import chalk from 'chalk';

const API_URL = 'https://degenduel.me/api';
const TEST_WALLET = '5RbsCTp7Z3ZBs6LRg8cvtZkF1FtAt4GndEtdsWQCzVy8';

// Parse Server-Sent Events response
function parseSSEResponse(text) {
  const lines = text.split('\n');
  let content = '';
  let tool_calls = [];
  let conversationId = null;
  let isComplete = false;
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      try {
        const data = JSON.parse(line.substring(6));
        
        if (data.type === 'content') {
          content += data.content || '';
        } else if (data.type === 'function_call') {
          tool_calls.push({
            id: data.id,
            function: {
              name: data.name,
              arguments: data.arguments
            }
          });
        } else if (data.type === 'done') {
          conversationId = data.conversationId;
          isComplete = true;
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    }
  }
  
  return {
    content: content,
    tool_calls: tool_calls.length > 0 ? tool_calls : undefined,
    conversationId: conversationId,
    isComplete: isComplete
  };
}

async function testSingleQuestion(question) {
  const requestBody = {
    messages: [{ role: 'user', content: question }],
    context: 'terminal',
    loadoutType: 'terminal',  // Explicitly use terminal loadout
    streaming: false,
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
    console.log(chalk.blue(`Question: ${question}`));
    console.log(chalk.gray('Sending request...'));
    
    const response = await fetch(`${API_URL}/ai/didi`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API Error ${response.status}: ${await response.text()}`);
    }

    // Parse SSE response
    const text = await response.text();
    const data = parseSSEResponse(text);
    
    console.log(chalk.green('\nDidi Response:'), data.content);
    
    if (data.tool_calls && data.tool_calls.length > 0) {
      console.log(chalk.cyan('\n🎉 FUNCTION CALLED!'));
      data.tool_calls.forEach(tc => {
        console.log(chalk.yellow(`   • ${tc.function.name}(${tc.function.arguments})`));
      });
    } else {
      console.log(chalk.red('\n❌ No functions called'));
    }
    
    return data;
  } catch (error) {
    console.error(chalk.red('Error:'), error.message);
    throw error;
  }
}

// Test questions designed to trigger functions
const testQuestions = [
  "Run a SQL query to show me active contests",
  "Show me my portfolio in contest 123",
  "What's my portfolio in contest 456?",
  "Execute SQL to find top users",
  "Get my portfolio for contest 789"
];

async function runTests() {
  console.log(chalk.bold.cyan('🧪 Single Function Call Test\n'));
  
  for (const question of testQuestions) {
    try {
      await testSingleQuestion(question);
      console.log(chalk.gray('\n' + '='.repeat(50) + '\n'));
      
      // Wait between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.log(chalk.red(`Failed: ${error.message}`));
      console.log(chalk.gray('\n' + '='.repeat(50) + '\n'));
    }
  }
}

runTests().catch(console.error);