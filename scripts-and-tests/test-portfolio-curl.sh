#!/bin/bash

# Simple curl commands to test portfolio endpoints
# 
# Usage: 
# 1. First get your values from the browser
# 2. Then run: ./test-portfolio-curl.sh

echo "🧪 DegenDuel Portfolio Endpoint Tester"
echo "====================================="
echo ""

# STEP 1: Get your values
echo "📋 STEP 1: Get these values from your browser:"
echo ""
echo "1. Auth Token:"
echo "   - Open DevTools (F12)"
echo "   - Go to Application > Storage > Local Storage" 
echo "   - Copy value of 'authToken' or 'dd_token'"
echo ""
echo "2. Contest ID:"
echo "   - Look at URL when viewing a contest"
echo "   - Example: /contests/123 → Contest ID is 123"
echo ""
echo "3. Wallet Address:"
echo "   - Your connected wallet address"
echo "   - Example: 0x1234...abcd"
echo ""

# Prompt for values
read -p "Enter your auth token: " AUTH_TOKEN
read -p "Enter contest ID: " CONTEST_ID  
read -p "Enter wallet address: " WALLET_ADDRESS

echo ""
echo "Testing with:"
echo "- Contest: $CONTEST_ID"
echo "- Wallet: $WALLET_ADDRESS"
echo "- Token: ${AUTH_TOKEN:0:20}..."
echo ""

# Test 1: Contest Live Data
echo "🔍 Test 1: Contest Live Data"
echo "=========================="
curl -s -X GET "https://degenduel.me/api/contests/$CONTEST_ID/live" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" | jq '.' || echo "Failed - is jq installed?"

echo ""
echo "Press Enter to continue..."
read

# Test 2: User Portfolio
echo "🔍 Test 2: User Portfolio"
echo "======================="
curl -s -X GET "https://degenduel.me/api/contests/$CONTEST_ID/portfolio/$WALLET_ADDRESS" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" | jq '.' || echo "Failed - is jq installed?"

echo ""
echo "Press Enter to continue..."
read

# Test 3: Contest Details
echo "🔍 Test 3: Contest Details"
echo "========================"
curl -s -X GET "https://degenduel.me/api/contests/$CONTEST_ID" \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Accept: application/json" | jq '.' || echo "Failed - is jq installed?"

echo ""
echo "✅ All tests completed!"
echo ""
echo "💡 Quick curl commands for manual testing:"
echo ""
echo "# Contest Live Data:"
echo "curl -H \"Authorization: Bearer $AUTH_TOKEN\" https://degenduel.me/api/contests/$CONTEST_ID/live | jq"
echo ""
echo "# User Portfolio:"
echo "curl -H \"Authorization: Bearer $AUTH_TOKEN\" https://degenduel.me/api/contests/$CONTEST_ID/portfolio/$WALLET_ADDRESS | jq"
echo ""