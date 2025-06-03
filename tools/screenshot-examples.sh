#!/bin/bash

# Screenshot Tool - Usage Examples
# Make sure your development server is running first!

echo "🚀 Screenshot Tool Examples"
echo "=========================="
echo ""

# Example 1: Homepage only (simplest usage)
echo "📸 1. Screenshot homepage only:"
echo "node screenshot-tool.cjs"
echo ""

# Example 2: Specific routes via command line
echo "📸 2. Screenshot specific routes:"
echo "node screenshot-tool.cjs /contests /profile /dashboard"
echo ""

# Example 3: Hash routing (for SPAs)
echo "📸 3. Hash routing for SPAs:"
echo "node screenshot-tool.cjs \"#/contests/demo/results\" \"#/profile\""
echo ""

# Example 4: Using flags for individual routes
echo "📸 4. Using route flags:"
echo "node screenshot-tool.cjs -r \"/contests\" -r \"/leaderboard\""
echo ""

# Example 5: Different viewport size
echo "📸 5. Mobile viewport:"
echo "node screenshot-tool.cjs --width 375 --height 667 \"/\""
echo ""

# Example 6: Custom output directory
echo "📸 6. Custom output directory:"
echo "node screenshot-tool.cjs -o \"./my-screenshots/\" \"/contests\""
echo ""

# Example 7: Different server URL
echo "📸 7. Production server:"
echo "node screenshot-tool.cjs -u \"https://dduel.me\" \"/contests\""
echo ""

# Example 8: Using config file
echo "📸 8. Using configuration file:"
echo "node screenshot-tool.cjs -c screenshot-routes.json"
echo ""

# Example 9: Long delay for slow loading pages
echo "📸 9. Longer delay for dynamic content:"
echo "node screenshot-tool.cjs --delay 5000 \"/contests\""
echo ""

# Example 10: Quick contest results
echo "📸 10. Quick contest results screenshot:"
echo "node screenshot-tool.cjs \"#/contests/demo/results\""
echo ""

echo "💡 Run any of these commands to see them in action!"
echo "📚 For full help: node screenshot-tool.cjs --help" 