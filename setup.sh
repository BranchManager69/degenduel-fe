#!/bin/bash

# DegenDuel Frontend Setup Script for OpenAI Codex
# This script prepares the environment for agent development tasks

set -e  # Exit on any error

echo "🚀 Setting up DegenDuel frontend environment..."

# Configure GitHub package registry authentication (only works during setup phase)
echo "🔐 Configuring GitHub package registry..."
echo "//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}" >> ~/.npmrc
echo "@branchmanager69:registry=https://npm.pkg.github.com" >> ~/.npmrc

# Install Node.js dependencies (with internet access during setup)
echo "📦 Installing dependencies..."
npm install

# Install global development tools
echo "🔧 Installing global development tools..."
npm install -g typescript@latest
npm install -g prettier@latest

# Verify TypeScript installation
echo "✅ Verifying TypeScript setup..."
npx tsc --version

# Run initial type check to ensure everything is working
echo "🔍 Running initial type check..."
npm run type-check

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs coverage dist dist-dev

# Set up environment variables in ~/.bashrc for persistence
echo "🔧 Setting up persistent environment variables..."
cat >> ~/.bashrc << 'EOF'

# DegenDuel Frontend Environment
export NODE_OPTIONS="--max_old_space_size=8192"
export FORCE_COLOR=1
export CI=false

EOF

echo "✅ Setup complete! Environment is ready for Codex development."
echo ""
echo "Available commands:"
echo "  npm run type-check     - TypeScript validation"
echo "  npm run build:dev      - Development build"
echo "  npm run build:prod     - Production build"
echo "  npm run test          - Run tests"
echo "  npm run lint          - Run linter"
echo "  npm run format        - Format code"
echo ""
echo "🎯 Codex can now effectively work with this codebase!"