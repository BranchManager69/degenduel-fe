#!/bin/bash

# Find all hook files
find src/hooks -type f -name "*.ts" -o -name "*.tsx" | sort | while read file; do
  # Get last commit date and hash for each file
  DATE_HASH=$(git log -1 --format="%ad %h" --date=short -- "$file")
  # Output in format: date hash filename
  echo "$DATE_HASH $file"
done | sort # Sort by date (oldest first)