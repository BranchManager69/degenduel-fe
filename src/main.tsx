// src/main.tsx

/**
 * Main Entry Point
 * 
 * @description Main entry point for the DegenDuel frontend application.
 * 
 * @author BranchManager69
 * @version 2.0.0
 * @created 2025-01-01
 * @updated 2025-05-08
 */

import ReactDOM from "react-dom/client";

import { App } from "./App";
import { AppErrorBoundary } from "./components/shared/AppErrorBoundary";
import "./index.css";

// Client Log Forwarder
import { initializeClientLogForwarder } from "./utils/clientLogForwarder";
initializeClientLogForwarder(); // Initialize CLF

// Stagewise Toolbar (Development only)
import { initToolbar } from "@stagewise/toolbar";

// Render DegenDuel App
ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode> // Disabled to prevent double-mounting which was
  // causing Privy's iframe initialisation race and "cannot dequeue" errors.
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  //</React.StrictMode>
);

// Initialize Stagewise Toolbar in development mode
function setupStagewise() {
  if (import.meta.env.MODE === 'development' || import.meta.env.DEV) {
    const stagewiseConfig = {
      plugins: [
        {
          name: 'degenduel-context',
          description: 'Provides DegenDuel-specific context for components',
          shortInfoForPrompt: () => {
            const selectedElement = document.querySelector('[data-stagewise-selected]');
            if (!selectedElement) return "No element selected";
            
            // Extract useful context about the selected element
            const tagName = selectedElement.tagName.toLowerCase();
            const className = selectedElement.className;
            const id = selectedElement.id;
            const text = selectedElement.textContent?.slice(0, 100) || '';
            
            return `Selected ${tagName}${id ? `#${id}` : ''}${className ? `.${className.split(' ').join('.')}` : ''}: "${text}"`;
          },
          mcp: null,
          actions: [
            {
              name: 'Log Element Info',
              description: 'Logs detailed information about the selected element to console',
              execute: () => {
                const selectedElement = document.querySelector('[data-stagewise-selected]');
                if (selectedElement) {
                  console.group('🎯 Stagewise Element Info');
                  console.log('Element:', selectedElement);
                  console.log('TagName:', selectedElement.tagName);
                  console.log('ClassName:', selectedElement.className);
                  console.log('ID:', selectedElement.id);
                  console.log('Text Content:', selectedElement.textContent);
                  console.log('Computed Styles:', window.getComputedStyle(selectedElement));
                  console.groupEnd();
                } else {
                  console.warn('No element selected');
                }
              },
            },
            {
              name: 'Copy Element Selector',
              description: 'Copies a CSS selector for the selected element to clipboard',
              execute: () => {
                const selectedElement = document.querySelector('[data-stagewise-selected]');
                if (selectedElement) {
                  let selector = selectedElement.tagName.toLowerCase();
                  if (selectedElement.id) {
                    selector += `#${selectedElement.id}`;
                  } else if (selectedElement.className) {
                    selector += `.${selectedElement.className.split(' ').join('.')}`;
                  }
                  navigator.clipboard.writeText(selector).then(() => {
                    console.log('✅ Selector copied to clipboard:', selector);
                  });
                }
              },
            },
          ],
        },
      ],
    };

    initToolbar(stagewiseConfig);
    console.log('🛠️ Stagewise Toolbar initialized for DegenDuel development');
  }
}

// Initialize toolbar when DOM is ready
document.addEventListener('DOMContentLoaded', setupStagewise);

// Also call immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupStagewise);
} else {
  setupStagewise();
}