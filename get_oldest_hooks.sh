#!/bin/bash

# For each hook file, get the date of the first commit that added it
find src/hooks -type f -name "*.ts" -o -name "*.tsx" | sort | while read file; do
  # Get the date of the first commit for this file
  FIRST_COMMIT=$(git log --format="%ad %h" --date=short --reverse -- "$file" | head -1)
  
  # If no commit is found, use a placeholder
  if [ -z "$FIRST_COMMIT" ]; then
    FIRST_COMMIT="Unknown"
  fi
  
  # Get the date of the last commit for this file
  LAST_COMMIT=$(git log -1 --format="%ad %h" --date=short -- "$file")
  
  # If no last commit is found, use a placeholder
  if [ -z "$LAST_COMMIT" ]; then
    LAST_COMMIT="Unknown"
  fi
  
  # Output: creation_date last_modification_date filename
  echo "$FIRST_COMMIT | $LAST_COMMIT | $file"
done | sort # Sort by creation date (oldest first)