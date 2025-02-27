#!/bin/bash

# Exit on error
set -e

echo "🔨 Building DegenDuel (development version) with no minification..."
npm run build:dev

echo "🚀 Starting preview server on port 3010..."
VITE_FORCE_DISABLE_MINIFY=true vite preview --port 3010 --strictPort