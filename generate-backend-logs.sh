#!/bin/bash

# Script to generate backend git logs for Developer Timeline
# Run this from the degenduel backend directory: cd ../degenduel && ./generate-backend-logs.sh

OUTPUT_FILE="../degenduel-fe/backend-commit-logs.txt"

echo "Generating backend commit logs for the last 14 days..."
echo "Output file: $OUTPUT_FILE"

# Generate the logs with detailed format
git log --oneline --since="14 days ago" --date=short --pretty=format:"%h|%ad|%s" --date=format:"%Y-%m-%d" > "$OUTPUT_FILE"

echo ""
echo "Backend commit logs saved to: $OUTPUT_FILE"
echo "Commit count: $(wc -l < "$OUTPUT_FILE")"
echo ""
echo "Preview of first 5 commits:"
head -5 "$OUTPUT_FILE"
echo ""
echo "Now copy this file path to Claude: $OUTPUT_FILE"