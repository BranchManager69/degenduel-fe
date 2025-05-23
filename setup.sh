#!/bin/bash

# DegenDuel Frontend Setup Script for OpenAI Codex
# This script prepares the environment for agent development tasks

set -e  # Exit on any error

echo "🚀 Setting up DegenDuel frontend environment..."

# Install Node.js dependencies
echo "📦 Installing dependencies..."
npm install

# Install development tools and linters
echo "🔧 Installing additional development tools..."
npm install -g typescript@latest
npm install -g eslint@latest
npm install -g prettier@latest

# Verify TypeScript installation
echo "✅ Verifying TypeScript setup..."
npx tsc --version

# Run initial type check to ensure everything is working
echo "🔍 Running initial type check..."
npm run type-check

# Install testing dependencies if needed
echo "🧪 Ensuring test environment is ready..."
npm install --save-dev @testing-library/jest-dom @testing-library/react @testing-library/user-event

# Setup Git hooks (if husky is configured)
echo "🪝 Setting up Git hooks..."
npm run prepare || echo "Husky setup skipped (not configured)"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p coverage
mkdir -p dist
mkdir -p dist-dev

# Verify build tools are working
echo "🏗️ Verifying build tools..."
which node
which npm
which npx

# Set up environment variables in ~/.bashrc for persistence
echo "🔧 Setting up persistent environment variables..."
cat >> ~/.bashrc << 'EOF'

# DegenDuel Frontend Environment
export NODE_OPTIONS="--max_old_space_size=8192"
export FORCE_COLOR=1
export CI=false

EOF

# Source the updated bashrc
source ~/.bashrc || echo "Bashrc sourced"

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