#!/bin/bash

# Path to the root of the project
PROJECT_ROOT="/home/branchmanager/websites/degenduel-fe"

# Create the legacy directory if it doesn't exist
mkdir -p "$PROJECT_ROOT/src/hooks/websocket/legacy"

# Function to update import paths in a file
update_imports() {
  local file="$1"
  local hook_name="$2"
  local depth="$3"
  
  # Create the pattern based on depth
  local search_pattern="from ['\"]$depth""hooks/websocket/$hook_name['\"]"
  local replace_pattern="from '$depth""hooks/websocket/legacy/$hook_name'"
  
  # Use sed to replace the import statement
  sed -i "s|$search_pattern|$replace_pattern|g" "$file"
  
  echo "Updated imports in $file"
}

echo "Updating WebSocket imports to use legacy directory..."

# Update useSkyDuelWebSocket imports
update_imports "$PROJECT_ROOT/src/components/admin/skyduel/ServiceGraph.tsx" "useSkyDuelWebSocket" "../../../"
update_imports "$PROJECT_ROOT/src/components/admin/skyduel/ServiceGrid.tsx" "useSkyDuelWebSocket" "../../../"

# Find all other files using these imports and update them
echo "Checking for more files that may need updates..."

grep_results=$(grep -r "import.*from.*hooks/websocket/use.*WebSocket" --include="*.tsx" --include="*.ts" "$PROJECT_ROOT/src" | grep -v "legacy" | grep -v "__WEBSOCKET_STANDARDIZATION_GUIDE.md")

if [ -n "$grep_results" ]; then
  echo "Found additional files that need updates:"
  echo "$grep_results"
  echo "You may need to update these files manually or extend this script to handle them."
fi

echo "Done!"