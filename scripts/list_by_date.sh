#!/bin/bash

# list_by_date.sh - List files in a directory sorted by modification date
# Usage: ./list_by_date.sh [directory_path]

# Set text colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Get the directory path from command line argument or use current directory
if [ -z "$1" ]; then
    DIR_PATH="."
else
    DIR_PATH="$1"
fi

# Check if the directory exists
if [ ! -d "$DIR_PATH" ]; then
    echo -e "${YELLOW}Error: Directory '$DIR_PATH' not found!${NC}"
    exit 1
fi

# Print header
echo -e "\n${GREEN}Files in '$DIR_PATH' sorted by modification date (newest first):${NC}\n"

# Find all files, sort by modification time (newest first), and format output
find "$DIR_PATH" -type f -not -path "*/node_modules/*" -not -path "*/\.*" | 
xargs -I{} stat -c "%Y %y %s {}" {} 2>/dev/null | 
sort -nr | 
awk '{
    # Format date and time
    date_time = $2 " " $3;
    
    # Format file size
    size = $4;
    if (size >= 1048576) {
        size_str = sprintf("%.2f MB", size/1048576);
    } else if (size >= 1024) {
        size_str = sprintf("%.2f KB", size/1024);
    } else {
        size_str = sprintf("%d B", size);
    }
    
    # Get file path
    file_path = "";
    for (i=5; i<=NF; i++) {
        file_path = file_path " " $i;
    }
    file_path = substr(file_path, 2);
    
    printf "%-20s  %-10s  %s\n", date_time, size_str, file_path;
}'

echo -e "\n${BLUE}Total files found: $(find "$DIR_PATH" -type f -not -path "*/node_modules/*" -not -path "*/\.*" | wc -l)${NC}\n"