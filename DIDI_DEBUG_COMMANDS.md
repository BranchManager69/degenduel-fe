# Didi Debug Commands

This document lists the debug commands available to test and troubleshoot Didi's advanced features.

## Available Debug Commands

### `test-ui`
- **Purpose**: Test dynamic UI generation
- **Action**: Creates a test Token Watchlist component below the terminal
- **Duration**: 30 seconds (auto-removes)
- **Usage**: Type `test-ui` in the terminal

### `debug-info`
- **Purpose**: Display system debug information
- **Shows**: Current date/time, available components, Dynamic UI status, environment
- **Usage**: Type `debug-info` in the terminal

### `clear`
- **Purpose**: Clear conversation history
- **Usage**: Type `clear` in the terminal

### `reset-didi`
- **Purpose**: Reset Didi's memory state and conversation
- **Usage**: Type `reset-didi` in the terminal

### `didi-status`
- **Purpose**: Show Didi's current state and memory
- **Shows**: Interaction count, topic awareness, freedom progress
- **Usage**: Type `didi-status` in the terminal

## Testing Didi's Features

### 1. Dynamic UI Generation
1. Type `test-ui` to see if the dynamic UI system works
2. Check browser console for any errors
3. Look for component creation logs in console

### 2. Web Search Capability
1. Ask Didi: "What's happening in crypto today?"
2. Ask Didi: "Search for latest news about Solana"
3. Check console for tool calls and web search attempts

### 3. Date/Time Awareness
1. Ask Didi: "What year is it?"
2. Ask Didi: "What's today's date?"
3. Type `debug-info` to see current system date

### 4. Component Generation
1. Ask Didi: "Create a token watchlist for SOL and ETH"
2. Ask Didi: "Show me a portfolio chart"
3. Ask Didi: "Generate a market heatmap"

## Expected Behavior

- **Dynamic UI**: Components should appear below the terminal
- **Web Search**: Didi should acknowledge it can search the web
- **Date Awareness**: Didi should know it's 2025
- **Console Logs**: Check for detailed logging of AI requests/responses

## Troubleshooting

If features aren't working:

1. Check browser console for errors
2. Verify network requests to `/api/ai/didi`
3. Check if backend endpoints are responding
4. Use debug commands to isolate issues