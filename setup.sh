#!/bin/bash

# DegenDuel Frontend Setup Script for OpenAI Codex
# This script prepares the environment for agent development tasks

echo "🚀 Setting up DegenDuel frontend environment..."

# Try to install dependencies, but continue if private packages fail
echo "📦 Installing dependencies..."
if npm install --ignore-scripts; then
    echo "✅ Dependencies installed successfully"
else
    echo "⚠️  Some private packages failed - continuing with available packages"
    # Try installing without the problematic private package
    npm install --ignore-scripts --no-optional || true
fi

# Install global development tools (these don't require private auth)
echo "🔧 Installing global development tools..."
npm install -g typescript@latest || echo "TypeScript already installed globally"
npm install -g prettier@latest || echo "Prettier already installed globally"

# Verify what we have installed
echo "✅ Verifying installations..."
node --version
npm --version
npx tsc --version || echo "TypeScript not available globally"

# Try to run type check if possible
echo "🔍 Testing TypeScript setup..."
if npx tsc --noEmit --skipLibCheck 2>/dev/null; then
    echo "✅ TypeScript check passed"
else
    echo "⚠️  TypeScript check skipped (may need private packages)"
fi

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
echo "Note: Some private packages may be missing due to authentication."
echo "Codex can still work effectively with the available codebase."
echo ""
echo "Available commands that should work:"
echo "  npx tsc --noEmit      - TypeScript validation"
echo "  npm run lint          - Run linter (if deps available)"
echo "  npm run format        - Format code"
echo ""
echo "🎯 Codex can now work with this codebase!"