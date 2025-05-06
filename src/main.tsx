import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import { AppErrorBoundary } from "./components/shared/AppErrorBoundary";
import "./index.css";
import { initializeClientLogForwarder } from "./utils/clientLogForwarder";

// Initialize the client log forwarder to capture and send logs to the server
initializeClientLogForwarder();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </React.StrictMode>,
);
