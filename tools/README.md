# Screenshot Tools

This directory contains utilities for taking automated screenshots of the application.

## Files

- **`screenshot-tool.cjs`** - Main screenshot utility with flexible configuration
- **`screenshot-routes.json`** - Example configuration file with common routes
- **`screenshot-examples.sh`** - Executable script showing usage examples

## Usage

### Quick Start
```bash
# From project root, screenshot homepage
node tools/screenshot-tool.cjs

# Screenshot specific routes
node tools/screenshot-tool.cjs "/contests" "/profile"

# Use configuration file
node tools/screenshot-tool.cjs -c tools/screenshot-routes.json
```

### Examples
```bash
# View all examples
./tools/screenshot-examples.sh

# Get help
node tools/screenshot-tool.cjs --help
```

## Output

Screenshots are saved to `screenshots/` directory in the project root (gitignored).

## Requirements

- Development server running on http://127.0.0.1:8080 (or specify different URL with `-u`)
- Node.js with puppeteer installed (`npm install puppeteer --save-dev`) 