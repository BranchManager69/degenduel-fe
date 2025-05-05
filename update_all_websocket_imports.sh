#!/bin/bash

# Path to the root of the project
PROJECT_ROOT="/home/branchmanager/websites/degenduel-fe"

# Create the legacy directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/src/hooks/websocket/legacy"

# Array of WebSocket hooks that need to be moved to legacy
HOOKS=(
  "useSkyDuelWebSocket"
  "useContestChatWebSocket"
  "useNotificationWebSocket"
)

# Possible relative path depths
DEPTHS=(
  "../"
  "../../"
  "../../../"
  "../../../../"
)

echo "Updating WebSocket imports to use legacy directory..."

# Loop through each file in the src directory with .ts or .tsx extension
find "$PROJECT_ROOT/src" -name "*.ts" -o -name "*.tsx" | while read -r file; do
  # Skip files in docs_archive or already in legacy directory
  if [[ "$file" == *"/docs_archive/"* || "$file" == *"/legacy/"* ]]; then
    continue
  fi

  # Check for each hook at each depth
  for hook in "${HOOKS[@]}"; do
    for depth in "${DEPTHS[@]}"; do
      # Create the search pattern
      search_pattern="from ['\"]${depth}hooks/websocket/${hook}['\"]"
      
      # Check if the file contains the import pattern
      if grep -q "$search_pattern" "$file"; then
        # Create the replacement pattern
        replace_pattern="from '${depth}hooks/websocket/legacy/${hook}'"
        
        # Use sed to replace the import statement
        sed -i "s|$search_pattern|$replace_pattern|g" "$file"
        
        echo "Updated $hook import in $file"
      fi
    done
  done
done

echo "Checking for any missed imports..."

# Final check for any remaining direct imports
for hook in "${HOOKS[@]}"; do
  grep_results=$(grep -r "import.*from.*hooks/websocket/$hook" --include="*.tsx" --include="*.ts" "$PROJECT_ROOT/src" | grep -v "legacy" | grep -v "docs_archive")
  
  if [ -n "$grep_results" ]; then
    echo "⚠️ Found imports that may still need updating for $hook:"
    echo "$grep_results"
  fi
done

echo "Done!"