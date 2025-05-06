#!/usr/bin/env node

/**
 * WebSocket Actions Scanner
 * 
 * This script scans frontend and backend codebases to extract and compare
 * WebSocket action names used in requests and handlers.
 * 
 * Usage:
 * node find-websocket-actions.js [--frontend-path=/path/to/frontend] [--backend-path=/path/to/backend]
 * 
 * Output:
 * - Logs all WebSocket actions found in frontend and backend
 * - Identifies mismatches where frontend uses actions not handled by backend
 * - Generates a report suitable for documentation
 * 
 * @author Claude Code
 * @created 2025-05-06
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default paths
let frontendPath = process.cwd(); // Default to current directory for frontend
let backendPath = path.resolve(process.cwd(), '../degenduel'); // Assumed backend location

// Process command line arguments
process.argv.slice(2).forEach(arg => {
  if (arg.startsWith('--frontend-path=')) {
    frontendPath = arg.split('=')[1];
  } else if (arg.startsWith('--backend-path=')) {
    backendPath = arg.split('=')[1];
  }
});

// Validate paths
if (!fs.existsSync(frontendPath)) {
  console.error(`Frontend path does not exist: ${frontendPath}`);
  process.exit(1);
}

const backendExists = fs.existsSync(backendPath);
if (!backendExists) {
  console.warn(`Warning: Backend path does not exist: ${backendPath}`);
  console.warn('Will only scan frontend code.');
}

// Define patterns to look for
const frontendPatterns = [
  // Finds ws.request patterns: ws.request(TopicType.X, 'actionName')
  /ws\.request\(\s*(?:TopicType\.)?([A-Za-z_]+)\s*,\s*['"]([A-Za-z_]+)['"]/g,
  
  // Find direct message sends with type:REQUEST
  /sendMessage\(\s*{\s*type:\s*(?:DDExtendedMessageType\.)?REQUEST\s*,.*?action:\s*['"]([A-Za-z_]+)['"]/gs,
  
  // Fallback pattern for other variations
  /action:\s*['"]([A-Za-z_]+)['"]/g
];

const backendPatterns = [
  // Find case statements in switch blocks that handle actions
  /case\s*['"]([A-Za-z_]+)['"]\s*:/g,
  
  // Find explicit action checks
  /(?:message|msg|request)\.action\s*===?\s*['"]([A-Za-z_]+)['"]/g,
  
  // Find action assignments
  /action:\s*['"]([A-Za-z_]+)['"]/g
];

// Results storage
const results = {
  frontend: {
    byTopic: {},
    allActions: new Set()
  },
  backend: {
    byTopic: {},
    allActions: new Set()
  },
  mismatches: [],
  matches: []
};

/**
 * Scans a file for patterns and extracts matches
 */
function scanFile(filePath, patterns, isBackend = false) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileResults = [];
    
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern);
      
      while ((match = regex.exec(content)) !== null) {
        // If frontend pattern with topic and action
        if (!isBackend && match.length >= 3) {
          const topic = match[1];
          const action = match[2];
          
          if (!results.frontend.byTopic[topic]) {
            results.frontend.byTopic[topic] = new Set();
          }
          results.frontend.byTopic[topic].add(action);
          results.frontend.allActions.add(action);
          fileResults.push({ topic, action, line: getLineNumber(content, match.index) });
        } 
        // Backend pattern or simpler frontend pattern with just action
        else {
          const action = match[1] || match[0].match(/['"]([A-Za-z_]+)['"]/)?.[1];
          if (action) {
            // Try to infer topic from file path or content
            const topic = inferTopic(filePath, content);
            
            if (isBackend) {
              if (!results.backend.byTopic[topic]) {
                results.backend.byTopic[topic] = new Set();
              }
              results.backend.byTopic[topic].add(action);
              results.backend.allActions.add(action);
            } else {
              if (!results.frontend.byTopic[topic]) {
                results.frontend.byTopic[topic] = new Set();
              }
              results.frontend.byTopic[topic].add(action);
              results.frontend.allActions.add(action);
            }
            
            fileResults.push({ topic, action, line: getLineNumber(content, match.index) });
          }
        }
      }
    }
    
    if (fileResults.length > 0) {
      console.log(`\nFound ${fileResults.length} WebSocket actions in ${path.relative(isBackend ? backendPath : frontendPath, filePath)}`);
      fileResults.forEach(({ topic, action, line }) => {
        console.log(`  ${topic ? topic + ':' : ''}${action} (line ${line})`);
      });
    }
    
    return fileResults;
  } catch (err) {
    console.error(`Error scanning file ${filePath}:`, err.message);
    return [];
  }
}

/**
 * Get line number from content and position
 */
function getLineNumber(content, position) {
  const lines = content.slice(0, position).split('\n');
  return lines.length;
}

/**
 * Infer topic from file path or content
 */
function inferTopic(filePath, content) {
  // Extract from filename patterns
  const filename = path.basename(filePath, path.extname(filePath)).toLowerCase();
  
  // Check for topic-hooks directory structure
  if (filePath.includes('topic-hooks/use')) {
    const hookMatch = filePath.match(/use([A-Za-z]+)\.ts$/);
    if (hookMatch) {
      return hookMatch[1].toUpperCase();
    }
  }
  
  const topicMapping = {
    'terminal': 'TERMINAL',
    'token': 'TOKEN_DATA', 
    'market': 'MARKET_DATA',
    'portfolio': 'PORTFOLIO',
    'notification': 'NOTIFICATION',
    'achievement': 'ACHIEVEMENT',
    'wallet': 'WALLET',
    'contest': 'CONTEST',
    'chat': 'CONTEST_CHAT',
    'system': 'SYSTEM',
    'service': 'SERVICE',
    'status': 'SERVER_STATUS',
    'analytics': 'ANALYTICS'
  };
  
  // Check for known topic names in filename
  for (const [key, value] of Object.entries(topicMapping)) {
    if (filename.includes(key)) {
      return value;
    }
  }
  
  // Look for topic constants in content
  const topicMatch = content.match(/topic:\s*['"]([a-zA-Z_-]+)['"]/);
  if (topicMatch) {
    return topicMatch[1].toUpperCase();
  }
  
  // Look for socket types
  const socketTypeMatch = content.match(/(?:TopicType|SOCKET_TYPES|TOPICS)\.([A-Z_]+)/);
  if (socketTypeMatch) {
    return socketTypeMatch[1];
  }
  
  return 'UNKNOWN';
}

/**
 * Recursively scan a directory for TypeScript and JavaScript files
 */
function scanDirectory(dir, patterns, isBackend = false) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.startsWith('node_modules') && !file.startsWith('.')) {
      scanDirectory(filePath, patterns, isBackend);
    } else if (stat.isFile() && (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js'))) {
      scanFile(filePath, patterns, isBackend);
    }
  }
}

/**
 * Generate report comparing frontend and backend actions
 */
function generateReport() {
  // Convert Sets to sorted Arrays for reporting
  const frontendActions = Array.from(results.frontend.allActions).sort();
  const backendActions = Array.from(results.backend.allActions).sort();
  
  // Find mismatches (frontend actions not in backend)
  results.mismatches = frontendActions.filter(action => !backendActions.includes(action));
  
  // Find matches (actions in both)
  results.matches = frontendActions.filter(action => backendActions.includes(action));
  
  // Generate markdown report
  let report = `# WebSocket Actions Report\n\n`;
  report += `Generated on: ${new Date().toISOString()}\n\n`;
  
  // Summary section
  report += `## Summary\n\n`;
  report += `- Frontend actions: ${frontendActions.length}\n`;
  if (backendExists) {
    report += `- Backend actions: ${backendActions.length}\n`;
    report += `- Matches: ${results.matches.length}\n`;
    report += `- Mismatches: ${results.mismatches.length}\n\n`;
  } else {
    report += `- Backend not scanned\n\n`;
  }
  
  // Action details by topic
  report += `## Actions by Topic\n\n`;
  
  // Frontend topics
  report += `### Frontend Topics\n\n`;
  for (const [topic, actions] of Object.entries(results.frontend.byTopic)) {
    report += `#### ${topic}\n\n`;
    Array.from(actions).sort().forEach(action => {
      const inBackend = backendExists && results.backend.allActions.has(action);
      report += `- \`${action}\` ${inBackend ? '✅' : '❌'}\n`;
    });
    report += `\n`;
  }
  
  // Backend topics (if available)
  if (backendExists) {
    report += `### Backend Topics\n\n`;
    for (const [topic, actions] of Object.entries(results.backend.byTopic)) {
      report += `#### ${topic}\n\n`;
      Array.from(actions).sort().forEach(action => {
        const inFrontend = results.frontend.allActions.has(action);
        report += `- \`${action}\` ${inFrontend ? '✅' : '⚠️'}\n`;
      });
      report += `\n`;
    }
  }
  
  // Mismatches section
  if (backendExists && results.mismatches.length > 0) {
    report += `## Mismatches (Frontend → Backend)\n\n`;
    report += `These actions are used in the frontend but not found in the backend:\n\n`;
    results.mismatches.forEach(action => {
      report += `- \`${action}\`\n`;
    });
    report += `\n`;
  }
  
  // Proposed shared enum
  report += `## Proposed Shared Enum\n\n`;
  report += "```typescript\n";
  report += "export enum DDWebSocketActions {\n";
  
  // Group by topics
  for (const [topic, actions] of Object.entries(results.frontend.byTopic)) {
    report += `  // ${topic} actions\n`;
    Array.from(actions).sort().forEach(action => {
      // Convert to standard format (TOPIC_ACTION_NAME = 'actionName')
      const enumKey = `${topic}_${action.toUpperCase()}`;
      report += `  ${enumKey} = '${action}',\n`;
    });
    report += "\n";
  }
  
  // Add backend-only actions if relevant
  if (backendExists) {
    const backendOnlyActions = backendActions.filter(action => !frontendActions.includes(action));
    if (backendOnlyActions.length > 0) {
      report += `  // Backend-only actions\n`;
      for (const action of backendOnlyActions) {
        // Find topic for this action
        let actionTopic = 'UNKNOWN';
        for (const [topic, actions] of Object.entries(results.backend.byTopic)) {
          if (actions.has(action)) {
            actionTopic = topic;
            break;
          }
        }
        const enumKey = `${actionTopic}_${action.toUpperCase()}`;
        report += `  ${enumKey} = '${action}',\n`;
      }
    }
  }
  
  report += "}\n";
  report += "```\n\n";
  
  // Migration guide
  report += `## Migration Guide\n\n`;
  report += `### For Frontend\n\n`;
  report += "```typescript\n";
  report += "// Before\n";
  report += "ws.request(TopicType.TERMINAL, 'GET_TERMINAL_DATA');\n\n";
  report += "// After\n";
  report += "import { DDWebSocketActions } from '@branchmanager69/degenduel-shared';\n";
  report += "ws.request(TopicType.TERMINAL, DDWebSocketActions.TERMINAL_GET_TERMINAL_DATA);\n";
  report += "```\n\n";
  
  report += `### For Backend\n\n`;
  report += "```javascript\n";
  report += "// Before\n";
  report += "switch (message.action) {\n";
  report += "  case 'getData':\n";
  report += "    // handle data request\n";
  report += "    break;\n";
  report += "}\n\n";
  report += "// After\n";
  report += "const { DDWebSocketActions } = require('@branchmanager69/degenduel-shared');\n";
  report += "switch (message.action) {\n";
  report += "  case DDWebSocketActions.TERMINAL_GET_DATA:\n";
  report += "    // handle data request\n";
  report += "    break;\n";
  report += "}\n";
  report += "```\n";
  
  // Write report to file
  const reportPath = path.join(frontendPath, 'websocket-actions-report.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\nReport written to ${reportPath}`);
  
  // Log summary to console
  console.log('\n=== WebSocket Actions Summary ===');
  console.log(`Frontend actions: ${frontendActions.length}`);
  if (backendExists) {
    console.log(`Backend actions: ${backendActions.length}`);
    console.log(`Matches: ${results.matches.length}`);
    console.log(`Mismatches: ${results.mismatches.length}`);
    
    if (results.mismatches.length > 0) {
      console.log('\nMismatches (Frontend → Backend):');
      results.mismatches.forEach(action => console.log(`- ${action}`));
    }
  }
}

// Main execution
console.log('Scanning frontend WebSocket actions...');
scanDirectory(frontendPath, frontendPatterns);

if (backendExists) {
  console.log('\nScanning backend WebSocket actions...');
  scanDirectory(backendPath, backendPatterns, true);
}

// Generate report
generateReport();