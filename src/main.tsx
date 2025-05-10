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

// Render DegenDuel App
ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode> // Disabled to prevent double-mounting which was
  // causing Privy’s iframe initialisation race and “cannot dequeue” errors.
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  //</React.StrictMode>
);
