import React from "react";
import ReactDOM from "react-dom/client";

import { App } from "./App";
import "./index.css";
import { initializeClientLogForwarder } from "./utils/clientLogForwarder";

// Initialize the client log forwarder to capture and send logs to the server
initializeClientLogForwarder();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
