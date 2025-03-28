  #!/bin/bash

  # Default options
  output_file="websocket_system_documentation.md"
  include_fe=true
  include_api=true
  verbose=false

  # Parse command line arguments
  for arg in "$@"; do
    case $arg in
      --fe)
        include_fe=true
        include_api=false
        shift
        ;;
      --api)
        include_fe=false
        include_api=true
        shift
        ;;
      --verbose)
        verbose=true
        shift
        ;;
      --output=*)
        output_file="${arg#*=}"
        shift
        ;;
      *)
        # Unknown option
        echo "Unknown option: $arg"
        echo "Usage: $0 [--fe] [--api] [--verbose] [--output=file.md]"
        exit 1
        ;;
    esac
  done

  echo "# WebSocket System Documentation" > $output_file
  echo "" >> $output_file
  echo "Generated on $(date)" >> $output_file
  echo "" >> $output_file

  # Frontend WebSocket core files
  fe_core_files=(
    "/home/websites/degenduel-fe/src/hooks/useBaseWebSocket.ts"
    "/home/websites/degenduel-fe/src/utils/wsMonitor.ts"
    "/home/websites/degenduel-fe/src/components/debug/websocket/WebSocketMonitor.tsx"
    "/home/websites/degenduel-fe/src/components/core/WebSocketManager.tsx"
  )

  # Frontend WebSocket specialized hook files
  fe_hook_files=(
    "/home/websites/degenduel-fe/src/hooks/useTokenDataWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useContestChatWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useWalletWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useAnalyticsWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useServiceWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useSkyDuelWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useSystemSettingsWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useServerStatusWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/usePortfolioWebSocket.ts"
    "/home/websites/degenduel-fe/src/hooks/useMarketDataWebSocket.ts"
  )

  # Frontend UI component files related to WebSockets
  fe_ui_files=(
    "/home/websites/degenduel-fe/src/components/contest-chat/ContestChat.tsx"
    "/home/websites/degenduel-fe/src/components/contest-chat/ContestChatManager.tsx"
  )

  # Frontend toast system files (only included with verbose flag)
  fe_toast_files=(
    "/home/websites/degenduel-fe/src/components/toast/ToastContext.tsx"
    "/home/websites/degenduel-fe/src/components/toast/ToastContainer.tsx"
    "/home/websites/degenduel-fe/src/components/toast/ToastListener.tsx"
    "/home/websites/degenduel-fe/src/components/toast/Toast.tsx"
  )

  # Backend API WebSocket files (placeholder - replace with actual paths)
  api_websocket_files=(
    "/path/to/api/websocket/server.js"
    "/path/to/api/websocket/tokenDataService.js"
    "/path/to/api/websocket/contestChatService.js"
    "/path/to/api/websocket/walletService.js"
    "/path/to/api/websocket/analyticsService.js"
    "/path/to/api/websocket/healthMonitor.js"
  )

  # Function to process files
  process_files() {
    local files=("$@")

    for file in "${files[@]}"; do
      if [ -f "$file" ]; then
        echo "## File: $file" >> $output_file
        echo "" >> $output_file

        # Determine the file extension for proper syntax highlighting
        extension="${file##*.}"
        case $extension in
          ts|tsx)
            lang="typescript"
            ;;
          js|jsx)
            lang="javascript"
            ;;
          *)
            lang="$extension"
            ;;
        esac

        echo '```'$lang >> $output_file
        cat "$file" >> $output_file
        echo '```' >> $output_file
        echo "" >> $output_file
        echo "---" >> $output_file
        echo "" >> $output_file
      else
        echo "## File: $file (File not found)" >> $output_file
        echo "" >> $output_file
        echo "This file was listed in the documentation script but could not be found on the system" >> $output_file
        echo "" >> $output_file
        echo "---" >> $output_file
        echo "" >> $output_file
      fi
    done
  }

  # Process frontend files if requested
  if [ "$include_fe" = true ]; then
    echo "## Frontend WebSocket System" >> $output_file
    echo "" >> $output_file

    echo "### Core WebSocket Components" >> $output_file
    echo "" >> $output_file
    process_files "${fe_core_files[@]}"

    echo "### Specialized WebSocket Hooks" >> $output_file
    echo "" >> $output_file
    process_files "${fe_hook_files[@]}"

    echo "### UI Components" >> $output_file
    echo "" >> $output_file
    process_files "${fe_ui_files[@]}"

    if [ "$verbose" = true ]; then
      echo "### Toast Notification System" >> $output_file
      echo "" >> $output_file
      process_files "${fe_toast_files[@]}"
    fi
  fi

  # Process backend files if requested
  if [ "$include_api" = true ]; then
    echo "## Backend WebSocket System" >> $output_file
    echo "" >> $output_file
    process_files "${api_websocket_files[@]}"
  fi

  echo "Documentation created at $output_file"
  echo "Options used: Frontend=$include_fe, Backend=$include_api, Verbose=$verbose"
