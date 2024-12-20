# System Navigation and Information
alias ll='ls -alFh'                    # Detailed list with human-readable sizes
alias la='ls -A'                       # List all files except . and ..
alias l='ls -CF'                       # Column list with indicators
alias tree='tree -C'                   # Colorized tree
alias treef='tree -af'                 # Show all files including hidden ones
alias treed='tree -d'                  # Show only directories
alias space='du -sh * | sort -h'       # Show space usage, sorted by size
alias ports='sudo netstat -tulpn'      # Show active ports
alias myip='curl ipinfo.io/ip'         # Show public IP address
alias diskspace='df -h'                # Show disk usage in human readable format

# Project Management and PM2
alias pma='pm2 start all'              # Start all PM2 processes
alias pmr='pm2 restart all'            # Restart all PM2 processes
alias pms='pm2 stop all'               # Stop all PM2 processes
alias pml='pm2 logs'                   # Show PM2 logs
alias pmm='pm2 monit'                  # Open PM2 monitor
alias pmls='pm2 list'                  # List all PM2 processes
alias pmss='pm2 save'                  # Save PM2 process list
alias pmf='pm2 flush'                  # Flush PM2 logs

# Project specific (customize these for your projects)
alias duel='cd /home/websites/degenduel'
alias duel-fe='cd /home/websites/degenduel-fe'
alias bet='cd /home/websites/branch-bet'
alias logs='cd /home/websites/logs-degenduel'

# NPM shortcuts
alias nr='npm run'                     # Quick npm run
alias nrb='npm run build'              # npm run build
alias nrd='npm run dev'                # npm run dev
alias nrs='npm run start'              # npm run start
alias ni='npm install'                 # npm install
alias nid='npm install --save-dev'     # npm install dev dependencies
alias nug='npm update -g'              # Update global packages
alias nrw='npm run watch'              # npm run watch

# Git shortcuts
alias gs='git status'                  # Git status
alias gp='git pull'                    # Git pull
alias gb='git branch'                  # Git branch
alias gc='git checkout'                # Git checkout
alias gcm='git checkout main'          # Checkout main branch
alias gcd='git checkout development'   # Checkout development branch

# Nginx management
alias ng-test='sudo nginx -t'                          # Test nginx configuration
alias ng-reload='sudo nginx -t && sudo systemctl reload nginx'  # Test and reload nginx
alias ng-restart='sudo systemctl restart nginx'        # Restart nginx
alias ng-status='sudo systemctl status nginx'          # Check nginx status
alias ng-error='sudo tail -f /var/log/nginx/error.log' # View nginx error logs
alias ng-access='sudo tail -f /var/log/nginx/access.log' # View nginx access logs

# System logs and monitoring
alias syslog='sudo tail -f /var/log/syslog'           # View system logs
alias journal='sudo journalctl -f'                     # View systemd journal
alias dmesg='sudo dmesg -w'                           # View kernel messages

# Quick edits (customize paths as needed)
alias nginx-conf='sudo nano /etc/nginx/nginx.conf'     # Edit nginx main config
alias hosts='sudo nano /etc/hosts'                     # Edit hosts file

# Custom project restarts (customize these for your specific projects)
alias restart-duel='cd /home/websites/degenduel && pmr && cd -'
alias restart-fe='cd /home/websites/degenduel-fe && pmr && cd -'
alias restart-all='pmr && echo "All services restarted!"'

# Directory tree dumps (great for documentation)
alias tree-md='tree -I "node_modules|build|dist" > DIRECTORY_STRUCTURE.md'  # Create markdown tree ignoring build files
alias tree-proj='tree -I "node_modules|build|dist|.git" -L 2'              # Show project structure, 2 levels deep

#############################################################################################

# Main project navigation
alias dev='cd ~/dev-tools'              # Quick access to development tools
alias web='cd ~/websites'               # Quick access to web projects
alias goto='cd ~/dev-tools'             # Alternative if you prefer this name

# Dev Tools Navigation and Management
alias llama='cd ~/dev-tools/llama.cpp'  # Navigate to llama.cpp
alias betty='cd ~/dev-tools/betty'      # Navigate to Betty
alias sol='cd ~/dev-tools/andbeyond'    # Navigate to Solana tools

# Combined commands for development
alias devls='cd ~/dev-tools && ls -la'  # List all dev tools with details
alias webls='cd ~/websites && ls -la'   # List all web projects with details

# Project status checking
alias devstat='cd ~/dev-tools && for d in *; do echo "=== $d ==="; cd $d; git status 2>/dev/null || echo "Not a git repo"; cd ..; done'
# Shows git status of all dev tool projects

# Quick directory tree views
alias devtree='cd ~/dev-tools && tree -L 2 -I "node_modules|target|build"'  # Show dev tools structure
alias webtree='cd ~/websites && tree -L 2 -I "node_modules|dist|build"'     # Show web projects structure

# Combined build commands
alias solbuild='cd ~/dev-tools/andbeyond && cargo build'  # Build Solana tools
alias llamabuild='cd ~/dev-tools/llama.cpp && make'       # Build llama.cpp

############################################

dev to jump to your development tools

web to jump to your web projects

devtree to see a clean view of your development projects

newdev project-name to create a new development project with proper permissions

devstat to check the git status of all your development projects at once







#############################################################################################

