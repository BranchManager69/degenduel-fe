#!/usr/bin/env node

/**
 * DegenDuel WebSocket Debug Tool
 * 
 * A command-line tool for debugging and testing the DegenDuel WebSocket API
 * 
 * Usage:
 *   ./ws-debug.mjs                    # Interactive mode
 *   ./ws-debug.mjs --help            # Show help
 *   ./ws-debug.mjs contests          # Get all contests
 *   ./ws-debug.mjs subscribe contest # Subscribe to contest topic
 *   ./ws-debug.mjs custom '{"type":"REQUEST","topic":"contest","action":"getContests"}'
 */

import WebSocket from 'ws';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse JWT to check expiration
function parseJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (err) {
    return null;
  }
}

// Check if token is expired
function isTokenExpired(token) {
  const payload = parseJWT(token);
  if (!payload || !payload.exp) return false; // Can't determine, assume valid
  
  const now = Math.floor(Date.now() / 1000);
  return payload.exp < now;
}

// Load auth token from .ws-auth file if it exists
function loadAuthToken() {
  try {
    const authFilePath = path.join(__dirname, '.ws-auth');
    if (fs.existsSync(authFilePath)) {
      const content = fs.readFileSync(authFilePath, 'utf8');
      const match = content.match(/^AUTH_TOKEN=(.+)$/m);
      if (match && match[1]) {
        const token = match[1].trim();
        
        // Check if token is expired
        if (isTokenExpired(token)) {
          console.log(chalk.yellow('⚠ Saved auth token has expired'));
          console.log(chalk.gray('Please update with: auth save <new-token>'));
          return null;
        }
        
        // Check expiration time
        const payload = parseJWT(token);
        if (payload && payload.exp) {
          const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
          const hours = Math.floor(expiresIn / 3600);
          const minutes = Math.floor((expiresIn % 3600) / 60);
          
          console.log(chalk.green('✓ Loaded auth token from .ws-auth file'));
          if (hours > 0) {
            console.log(chalk.gray(`  Token expires in ${hours}h ${minutes}m`));
          } else if (minutes > 0) {
            console.log(chalk.yellow(`  Token expires in ${minutes} minutes - consider refreshing soon`));
          }
        } else {
          console.log(chalk.green('✓ Loaded auth token from .ws-auth file'));
        }
        
        return token;
      }
    }
  } catch (err) {
    // Silently fail if can't read file
  }
  return null;
}

// Configuration
const WS_URL = process.env.WS_URL || 'wss://degenduel.me/api/v69/ws';
const AUTH_TOKEN = process.env.AUTH_TOKEN || loadAuthToken() || null;

// Available topics from the documentation
const TOPICS = {
  'market-data': { auth: false, desc: 'Real-time market data for tokens' },
  'portfolio': { auth: true, desc: 'User portfolio information' },
  'system': { auth: false, desc: 'System-wide notifications and events' },
  'contest': { auth: false, desc: 'Contest information and updates (public), user-specific with auth' },
  'user': { auth: true, desc: 'User profile and statistics' },
  'admin': { auth: true, desc: 'Administrative functions (requires admin role)' },
  'wallet': { auth: true, desc: 'Wallet information and transactions' },
  'skyduel': { auth: false, desc: 'SkyDuel game data (public), user-specific with auth' },
  'logs': { auth: false, desc: 'Client logging facility' }
};

// Complete action catalog from codebase analysis
const TOPIC_ACTIONS = {
  system: [
    'GET_STATUS', 'GET_FEATURES', 'GET_MAINTENANCE', 'GET_SETTINGS',
    'GET_COUNTDOWN_DATA', 'getDatabaseStats', 'getSystemStatus', 'getRpcBenchmarks'
  ],
  wallet: [
    'GET_WALLET_DATA', 'SEND_TRANSACTION', 'UPDATE_SETTINGS', 'GET_TRANSACTIONS',
    'GET_TRANSACTION', 'GET_RECENT_TRANSACTIONS', 'VERIFY_TRANSACTION', 'GET_WALLET_SETTINGS'
  ],
  'wallet-balance': [
    'GET_SOLANA_BALANCE', 'GET_TOKEN_BALANCE', 'GET_WALLET_BALANCE', 
    'GET_BALANCE', 'REFRESH_TOKEN_BALANCE'
  ],
  portfolio: [
    'GET_PORTFOLIO', 'UPDATE_PORTFOLIO', 'SUBSCRIBE_PORTFOLIO_UPDATES',
    'UNSUBSCRIBE_PORTFOLIO_UPDATES'
  ],
  user: [
    'GET_PROFILE', 'UPDATE_PROFILE', 'GET_USER_STATS', 'GET_USER_ACHIEVEMENTS',
    'GET_USER_HISTORY', 'GET_USER_ACTIVITY', 'VERIFY_USER', 'GET_NOTIFICATIONS',
    'MARK_AS_READ', 'MARK_ALL_AS_READ', 'CLEAR_NOTIFICATIONS', 'GET_ACHIEVEMENTS',
    'GET_LEVEL', 'UNLOCK_ACHIEVEMENT', 'GET_ACHIEVEMENT_PROGRESS'
  ],
  contest: [
    'getContests', 'GET_CONTESTS', 'GET_CONTEST', 'CREATE_CONTEST', 'JOIN_CONTEST',
    'LEAVE_CONTEST', 'GET_CONTEST_SCHEDULES', 'GET_USER_CONTESTS', 'UPDATE_CONTEST',
    'CANCEL_CONTEST', 'START_CONTEST', 'END_CONTEST', 'GET_CONTEST_PARTICIPANTS',
    'GET_CONTEST_LEADERBOARD', 'GET_CONTEST_RESULTS', 'SUBMIT_PORTFOLIO',
    'UPDATE_PORTFOLIO', 'SUBSCRIBE_CONTEST_POSITIONS', 'UNSUBSCRIBE_CONTEST_POSITIONS'
  ],
  'contest-chat': [
    'GET_MESSAGES', 'SEND_MESSAGE', 'DELETE_MESSAGE', 'PIN_MESSAGE'
  ],
  'contest-participants': [
    'get_participants', 'subscribe_contest', 'unsubscribe_contest'
  ],
  admin: [
    'GET_ANALYTICS', 'getContestSchedulerStatus', 'controlContestScheduler',
    'GET_SYSTEM_STATUS', 'GET_USER_LIST', 'BAN_USER', 'UNBAN_USER',
    'GET_SYSTEM_METRICS', 'GET_ERROR_LOGS', 'RESTART_SERVICE',
    'UPDATE_SYSTEM_SETTINGS', 'rpc-benchmarks/trigger'
  ],
  'market-data': [
    'GET_TOKENS', 'GET_TOKEN', 'GET_TOKEN_DETAILS', 'GET_PRICE_HISTORY',
    'GET_PRICE_UPDATES', 'GET_TOP_TOKENS', 'GET_TRENDING_TOKENS',
    'GET_TOKEN_STATS', 'SEARCH_TOKENS'
  ],
  skyduel: [
    'get_state', 'GET_GAME_STATE', 'JOIN_GAME', 'MAKE_MOVE',
    'FORFEIT_GAME', 'GET_LEADERBOARD'
  ],
  terminal: [
    'getVanityDashboard', 'GET_DATA', 'GET_COMMANDS', 'EXECUTE_COMMAND'
  ],
  service: [
    'get_state', 'GET_SERVICE_STATUS', 'UPDATE_SERVICE', 'RESTART_SERVICE_INSTANCE'
  ],
  'circuit-breaker': [
    'get_services', 'reset_breaker', 'update_config', 'GET_CIRCUIT_STATUS',
    'TRIGGER_CIRCUIT', 'RESET_CIRCUIT'
  ],
  'rpc-benchmark': [
    'GET_RPC_STATUS', 'RUN_BENCHMARK', 'GET_BENCHMARK_RESULTS'
  ],
  'liquidity-sim': [
    'simulate', 'simulateGrid', 'getTokenInfo', 'GET_SIMULATION_PARAMS',
    'RUN_SIMULATION', 'SAVE_SIMULATION', 'GET_SAVED_SIMULATIONS'
  ],
  'vanity-dashboard': [
    'GET_VANITY_WALLETS', 'CREATE_VANITY_WALLET', 'CHECK_VANITY_POOL'
  ],
  'launch-events': ['GET_LAUNCH_STATUS'],
  analytics: [
    'GET_USER_ANALYTICS', 'GET_SYSTEM_ANALYTICS', 'GET_CONTEST_ANALYTICS',
    'GET_PERFORMANCE_METRICS'
  ],
  logs: ['SEND_CLIENT_LOG', 'GET_CLIENT_LOGS']
};

// Message templates
const MESSAGE_TEMPLATES = {
  subscribe: (topics) => ({
    type: 'SUBSCRIBE',
    topics: Array.isArray(topics) ? topics : [topics],
    ...(AUTH_TOKEN && { authToken: AUTH_TOKEN })
  }),
  
  unsubscribe: (topics) => ({
    type: 'UNSUBSCRIBE',
    topics: Array.isArray(topics) ? topics : [topics]
  }),
  
  request: (topic, action, data = {}) => ({
    type: 'REQUEST',
    topic,
    action,
    ...(Object.keys(data).length > 0 && { data }),
    ...(AUTH_TOKEN && TOPICS[topic]?.auth && { authToken: AUTH_TOKEN })
  }),
  
  command: (topic, command, data = {}) => ({
    type: 'COMMAND',
    topic,
    command,
    ...(Object.keys(data).length > 0 && { data }),
    ...(AUTH_TOKEN && TOPICS[topic]?.auth && { authToken: AUTH_TOKEN })
  })
};

class WebSocketDebugger {
  constructor() {
    this.ws = null;
    this.messageHistory = [];
    this.isConnected = false;
    this.subscriptions = new Set();
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.cyan('ws> ')
    });
  }

  connect() {
    console.log(chalk.yellow(`Connecting to ${WS_URL}...`));
    
    this.ws = new WebSocket(WS_URL);
    
    this.ws.on('open', () => {
      this.isConnected = true;
      console.log(chalk.green('✓ Connected to WebSocket'));
      if (AUTH_TOKEN) {
        console.log(chalk.gray('Using authentication token'));
      }
      this.showHelp();
      this.rl.prompt();
    });
    
    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (e) {
        console.log(chalk.red('Raw message:'), data.toString());
      }
    });
    
    this.ws.on('error', (err) => {
      console.error(chalk.red('WebSocket error:'), err.message);
    });
    
    this.ws.on('close', () => {
      this.isConnected = false;
      console.log(chalk.yellow('\nWebSocket connection closed'));
      if (this.rl) {
        this.rl.close();
      }
      process.exit(0);
    });
  }

  handleMessage(message) {
    this.messageHistory.push({ time: new Date(), message });
    
    // Clear the prompt line
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);
    
    // Display the message with formatting
    console.log(chalk.gray('\n─────────────────────────────────────────'));
    console.log(chalk.yellow('Received:'), new Date().toLocaleTimeString());
    
    // Color code based on message type
    if (message.type === 'ERROR') {
      console.log(chalk.red(JSON.stringify(message, null, 2)));
    } else if (message.type === 'ACKNOWLEDGMENT') {
      console.log(chalk.green(JSON.stringify(message, null, 2)));
    } else if (message.type === 'SYSTEM') {
      console.log(chalk.blue(JSON.stringify(message, null, 2)));
    } else if (message.action && message.data) {
      // Data response - show summary
      console.log(chalk.white('Type:'), message.type || 'DATA');
      console.log(chalk.white('Topic:'), message.topic);
      console.log(chalk.white('Action:'), message.action);
      
      if (Array.isArray(message.data)) {
        console.log(chalk.white('Data:'), `Array with ${message.data.length} items`);
        if (message.data.length > 0) {
          console.log(chalk.gray('First item:'));
          console.log(chalk.gray(JSON.stringify(message.data[0], null, 2)));
        }
      } else {
        console.log(chalk.white('Data:'));
        console.log(chalk.gray(JSON.stringify(message.data, null, 2)));
      }
    } else {
      console.log(chalk.white(JSON.stringify(message, null, 2)));
    }
    
    console.log(chalk.gray('─────────────────────────────────────────\n'));
    
    // Restore the prompt
    this.rl.prompt();
  }

  send(message) {
    if (!this.isConnected) {
      console.log(chalk.red('Not connected to WebSocket'));
      return;
    }
    
    console.log(chalk.cyan('\nSending:'), JSON.stringify(message, null, 2));
    this.ws.send(JSON.stringify(message));
  }

  showHelp() {
    console.log(chalk.white('\nAvailable commands:'));
    console.log(chalk.gray('  help                      - Show this help'));
    console.log(chalk.gray('  topics                    - List available topics'));
    console.log(chalk.gray('  actions <topic>           - List actions for a topic'));
    console.log(chalk.gray('  subscribe <topic>         - Subscribe to a topic'));
    console.log(chalk.gray('  unsubscribe <topic>       - Unsubscribe from a topic'));
    console.log(chalk.gray('  request <topic> <action>  - Send a request'));
    console.log(chalk.gray('  raw <json>                - Send raw JSON message'));
    console.log(chalk.gray('  history                   - Show message history'));
    console.log(chalk.gray('  clear                     - Clear screen'));
    console.log(chalk.gray('  exit                      - Close connection and exit'));
    console.log();
    console.log(chalk.white('Quick shortcuts:'));
    console.log(chalk.gray('  contests                  - Get all contests'));
    console.log(chalk.gray('  contest <id>              - Get specific contest'));
    console.log(chalk.gray('  join <contestId>          - Join a contest'));
    console.log(chalk.gray('  market <token>            - Get market data'));
    console.log(chalk.gray('  portfolio                 - Get your portfolio (auth)'));
    console.log(chalk.gray('  profile                   - Get your profile (auth)'));
    console.log(chalk.gray('  wallet                    - Get wallet data (auth)'));
    console.log(chalk.gray('  balance                   - Get wallet balance (auth)'));
    console.log(chalk.gray('  notifications             - Get notifications (auth)'));
    console.log();
    console.log(chalk.white('Authentication:'));
    console.log(chalk.gray('  auth                      - Check auth status'));
    console.log(chalk.gray('  auth save <token>         - Save auth token'));
    console.log();
    console.log(chalk.white('Testing:'));
    console.log(chalk.gray('  test                      - Show test suites'));
    console.log(chalk.gray('  test auth                 - Test authenticated endpoints'));
    console.log(chalk.gray('  test public               - Test public endpoints'));
    console.log();
  }
  
  runTestSuite(suite) {
    console.log(chalk.cyan(`\nRunning ${suite} test suite...\n`));
    
    const tests = {
      auth: [
        { topic: 'portfolio', action: 'GET_PORTFOLIO', desc: 'Portfolio data' },
        { topic: 'user', action: 'GET_PROFILE', desc: 'User profile' },
        { topic: 'wallet', action: 'GET_WALLET_DATA', desc: 'Wallet data' },
        { topic: 'wallet-balance', action: 'GET_WALLET_BALANCE', desc: 'Wallet balance' },
        { topic: 'user', action: 'GET_NOTIFICATIONS', desc: 'Notifications' },
        { topic: 'user', action: 'GET_USER_STATS', desc: 'User stats' },
        { topic: 'contest', action: 'GET_USER_CONTESTS', desc: 'User contests' }
      ],
      public: [
        { topic: 'contest', action: 'getContests', desc: 'All contests' },
        { topic: 'system', action: 'GET_STATUS', desc: 'System status' },
        { topic: 'market-data', action: 'GET_TOP_TOKENS', desc: 'Top tokens' },
        { topic: 'skyduel', action: 'GET_LEADERBOARD', desc: 'SkyDuel leaderboard' }
      ],
      contest: [
        { topic: 'contest', action: 'getContests', desc: 'List contests' },
        { topic: 'contest', action: 'GET_CONTEST_SCHEDULES', desc: 'Contest schedules' },
        { topic: 'contest-participants', action: 'get_participants', desc: 'Participants', data: { contestId: '871' } }
      ],
      admin: [
        { topic: 'admin', action: 'GET_SYSTEM_STATUS', desc: 'Admin system status' },
        { topic: 'admin', action: 'GET_ANALYTICS', desc: 'Analytics data' },
        { topic: 'admin', action: 'getContestSchedulerStatus', desc: 'Scheduler status' }
      ]
    };
    
    const selectedTests = suite === 'all' 
      ? [...tests.public, ...(AUTH_TOKEN ? tests.auth : [])]
      : tests[suite] || [];
    
    if (selectedTests.length === 0) {
      console.log(chalk.red('Unknown test suite:', suite));
      return;
    }
    
    // Subscribe to necessary topics first
    const topics = [...new Set(selectedTests.map(t => t.topic))];
    console.log(chalk.gray(`Subscribing to topics: ${topics.join(', ')}`));
    this.send(MESSAGE_TEMPLATES.subscribe(topics));
    
    // Run tests with delay
    let delay = 1000;
    selectedTests.forEach((test, index) => {
      setTimeout(() => {
        console.log(chalk.yellow(`\n[${index + 1}/${selectedTests.length}] Testing ${test.desc}...`));
        this.send(MESSAGE_TEMPLATES.request(test.topic, test.action, test.data || {}));
      }, delay);
      delay += 2000; // 2 second delay between tests
    });
    
    setTimeout(() => {
      console.log(chalk.green(`\n✓ Test suite '${suite}' completed`));
    }, delay);
  }

  processCommand(line) {
    const [cmd, ...args] = line.trim().split(' ');
    
    switch (cmd.toLowerCase()) {
      case 'help':
      case '?':
        this.showHelp();
        break;
        
      case 'topics':
        console.log(chalk.white('\nAvailable topics:'));
        Object.entries(TOPICS).forEach(([topic, info]) => {
          const authBadge = info.auth ? chalk.red(' [AUTH]') : '';
          console.log(chalk.cyan(`  ${topic}${authBadge}`) + chalk.gray(` - ${info.desc}`));
        });
        break;
        
      case 'actions':
        if (!args[0]) {
          console.log(chalk.red('Usage: actions <topic>'));
        } else if (TOPIC_ACTIONS[args[0]]) {
          console.log(chalk.white(`\nActions for ${args[0]}:`));
          TOPIC_ACTIONS[args[0]].forEach(action => {
            console.log(chalk.cyan(`  ${action}`));
          });
        } else {
          console.log(chalk.yellow(`No predefined actions for ${args[0]}`));
        }
        break;
        
      case 'subscribe':
      case 'sub':
        if (!args[0]) {
          console.log(chalk.red('Usage: subscribe <topic>'));
        } else {
          this.subscriptions.add(args[0]);
          this.send(MESSAGE_TEMPLATES.subscribe(args[0]));
        }
        break;
        
      case 'unsubscribe':
      case 'unsub':
        if (!args[0]) {
          console.log(chalk.red('Usage: unsubscribe <topic>'));
        } else {
          this.subscriptions.delete(args[0]);
          this.send(MESSAGE_TEMPLATES.unsubscribe(args[0]));
        }
        break;
        
      case 'request':
      case 'req':
        if (args.length < 2) {
          console.log(chalk.red('Usage: request <topic> <action> [data]'));
        } else {
          const data = args[2] ? JSON.parse(args.slice(2).join(' ')) : {};
          this.send(MESSAGE_TEMPLATES.request(args[0], args[1], data));
        }
        break;
        
      // Shortcuts and test commands
      case 'contests':
        this.send(MESSAGE_TEMPLATES.request('contest', 'getContests'));
        break;
        
      case 'contest':
        if (!args[0]) {
          console.log(chalk.red('Usage: contest <id>'));
        } else {
          this.send(MESSAGE_TEMPLATES.request('contest', 'GET_CONTEST', { contestId: args[0] }));
        }
        break;
        
      case 'join':
        if (!args[0]) {
          console.log(chalk.red('Usage: join <contestId>'));
        } else {
          this.send(MESSAGE_TEMPLATES.request('contest', 'JOIN_CONTEST', { contestId: args[0] }));
        }
        break;
        
      case 'market':
        if (!args[0]) {
          console.log(chalk.red('Usage: market <token>'));
        } else {
          this.send(MESSAGE_TEMPLATES.request('market-data', 'GET_TOKEN', { token: args[0] }));
        }
        break;
        
      case 'portfolio':
        this.send(MESSAGE_TEMPLATES.request('portfolio', 'GET_PORTFOLIO'));
        break;
        
      case 'profile':
        this.send(MESSAGE_TEMPLATES.request('user', 'GET_PROFILE'));
        break;
        
      case 'wallet':
        this.send(MESSAGE_TEMPLATES.request('wallet', 'GET_WALLET_DATA'));
        break;
        
      case 'balance':
        this.send(MESSAGE_TEMPLATES.request('wallet-balance', 'GET_WALLET_BALANCE'));
        break;
        
      case 'notifications':
        this.send(MESSAGE_TEMPLATES.request('user', 'GET_NOTIFICATIONS'));
        break;
        
      case 'test':
        if (!args[0]) {
          console.log(chalk.yellow('\nAvailable test suites:'));
          console.log(chalk.gray('  test auth      - Test all authenticated endpoints'));
          console.log(chalk.gray('  test public    - Test all public endpoints'));
          console.log(chalk.gray('  test contest   - Test contest-related endpoints'));
          console.log(chalk.gray('  test admin     - Test admin endpoints (requires admin role)'));
          console.log(chalk.gray('  test all       - Run all tests'));
        } else {
          this.runTestSuite(args[0]);
        }
        break;
        
      case 'raw':
        if (!args[0]) {
          console.log(chalk.red('Usage: raw <json>'));
        } else {
          try {
            const message = JSON.parse(args.join(' '));
            this.send(message);
          } catch (e) {
            console.log(chalk.red('Invalid JSON:', e.message));
          }
        }
        break;
        
      case 'history':
      case 'hist':
        console.log(chalk.white('\nMessage history:'));
        this.messageHistory.slice(-10).forEach((entry, i) => {
          console.log(chalk.gray(`${i + 1}. ${entry.time.toLocaleTimeString()}`));
          console.log(chalk.gray(JSON.stringify(entry.message, null, 2).split('\n').map(l => '   ' + l).join('\n')));
        });
        break;
        
      case 'clear':
      case 'cls':
        console.clear();
        break;
        
      case 'auth':
        if (!args[0]) {
          if (AUTH_TOKEN) {
            console.log(chalk.green('Currently authenticated'));
            console.log(chalk.gray(`Token: ${AUTH_TOKEN.substring(0, 20)}...`));
            
            // Show token details
            const payload = parseJWT(AUTH_TOKEN);
            if (payload) {
              if (payload.wallet_address) {
                console.log(chalk.gray(`Wallet: ${payload.wallet_address}`));
              }
              if (payload.nickname) {
                console.log(chalk.gray(`Nickname: ${payload.nickname}`));
              }
              if (payload.exp) {
                const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
                if (expiresIn > 0) {
                  const hours = Math.floor(expiresIn / 3600);
                  const minutes = Math.floor((expiresIn % 3600) / 60);
                  if (hours > 0) {
                    console.log(chalk.gray(`Expires in: ${hours}h ${minutes}m`));
                  } else {
                    console.log(chalk.yellow(`Expires in: ${minutes} minutes`));
                  }
                } else {
                  console.log(chalk.red('Token is expired!'));
                }
              }
            }
          } else {
            console.log(chalk.yellow('Not authenticated'));
            console.log(chalk.gray('Use "auth save <token>" to set your auth token'));
          }
        } else if (args[0] === 'save' && args[1]) {
          // Save token to .ws-auth file
          const token = args.slice(1).join(' ');
          const authFilePath = path.join(__dirname, '.ws-auth');
          const content = `# WebSocket Debug Tool Authentication\n# This token is automatically loaded when you run the tool\n\nAUTH_TOKEN=${token}\n`;
          
          try {
            fs.writeFileSync(authFilePath, content);
            console.log(chalk.green('✓ Auth token saved to .ws-auth file'));
            console.log(chalk.gray('Restart the tool to use the new token'));
          } catch (err) {
            console.log(chalk.red('Failed to save auth token:', err.message));
          }
        } else {
          console.log(chalk.yellow('Usage: auth save <token>'));
        }
        break;
        
      case 'exit':
      case 'quit':
      case 'q':
        if (this.ws) {
          this.ws.close();
        }
        break;
        
      default:
        if (cmd) {
          console.log(chalk.red(`Unknown command: ${cmd}. Type 'help' for available commands.`));
        }
    }
  }

  startInteractive() {
    this.rl.on('line', (line) => {
      this.processCommand(line);
      this.rl.prompt();
    });
    
    this.rl.on('close', () => {
      console.log(chalk.yellow('\nGoodbye!'));
      if (this.ws) {
        this.ws.close();
      }
      process.exit(0);
    });
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(chalk.white('DegenDuel WebSocket Debug Tool'));
    console.log(chalk.gray('\nUsage:'));
    console.log(chalk.gray('  ws-debug                    # Interactive mode'));
    console.log(chalk.gray('  ws-debug contests           # Get all contests'));
    console.log(chalk.gray('  ws-debug subscribe contest  # Subscribe to contest topic'));
    console.log(chalk.gray('  ws-debug custom \'{"..."}\'   # Send custom JSON'));
    console.log(chalk.gray('\nEnvironment variables:'));
    console.log(chalk.gray('  WS_URL=wss://...            # WebSocket URL (default: wss://degenduel.me/api/v69/ws)'));
    console.log(chalk.gray('  AUTH_TOKEN=...              # Authentication token for protected topics'));
    process.exit(0);
  }
  
  const wsDebugger = new WebSocketDebugger();
  wsDebugger.connect();
  
  // If arguments provided, execute and exit
  if (args.length > 0) {
    setTimeout(() => {
      if (args[0] === 'contests') {
        wsDebugger.send(MESSAGE_TEMPLATES.request('contest', 'getContests'));
      } else if (args[0] === 'subscribe' && args[1]) {
        wsDebugger.send(MESSAGE_TEMPLATES.subscribe(args[1]));
      } else if (args[0] === 'custom' && args[1]) {
        try {
          wsDebugger.send(JSON.parse(args[1]));
        } catch (e) {
          console.error(chalk.red('Invalid JSON:', e.message));
          process.exit(1);
        }
      } else {
        console.error(chalk.red('Invalid command'));
        process.exit(1);
      }
      
      // Wait for response then exit
      setTimeout(() => {
        wsDebugger.ws.close();
      }, 5000);
    }, 1000);
  } else {
    // Interactive mode
    wsDebugger.startInteractive();
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error(chalk.red('Unhandled error:'), err);
  process.exit(1);
});

// Run the tool
main();