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
import { UnifiedWebSocketProvider } from "./contexts/UnifiedWebSocketContext";
import "./index.css";

// Client Log Forwarder
import { initializeClientLogForwarder } from "./utils/clientLogForwarder";
initializeClientLogForwarder(); // Initialize CLF

// Render DegenDuel App with WebSocket provider at the very top level
ReactDOM.createRoot(document.getElementById("root")!).render(
  //<React.StrictMode> // Disabled to prevent double-mounting which was
  // causing Privy's iframe initialisation race and "cannot dequeue" errors.
    <AppErrorBoundary>
      <UnifiedWebSocketProvider>
        <App />
      </UnifiedWebSocketProvider>
    </AppErrorBoundary>
  //</React.StrictMode>
);

// Stagewise removed - that garbage didn't work with SSH remote development

// Add connectivity testing function to window for easy debugging
declare global {
  interface Window {
    testDegenDuelConnectivity: () => Promise<void>;
  }
}

window.testDegenDuelConnectivity = async () => {
  console.log('🔧 DegenDuel Connectivity Test - Starting...');
  console.log('=' .repeat(50));
  
  const API_URL = (
    window.location.hostname === "localhost" || window.location.hostname.startsWith("127.0.0.1")
      ? `${window.location.protocol}//${window.location.host}/api`
      : `https://degenduel.me/api`
  );
  
  const WS_URL = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/v69/ws`;
  
  console.log('📋 Configuration:');
  console.log(`   API URL: ${API_URL}`);
  console.log(`   WebSocket URL: ${WS_URL}`);
  console.log(`   User Agent: ${navigator.userAgent}`);
  console.log(`   Network Online: ${navigator.onLine}`);
  console.log('');
  
  // Test 1: Basic connectivity
  console.log('🌐 Test 1: Basic Network Connectivity');
  try {
    await fetch('https://google.com', { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(3000) });
    console.log('   ✅ Internet connectivity: OK');
  } catch {
    console.log('   ❌ Internet connectivity: FAILED');
  }
  
  try {
    await fetch('https://degenduel.me', { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(5000) });
    console.log('   ✅ DegenDuel domain: OK');
  } catch {
    console.log('   ❌ DegenDuel domain: FAILED');
  }
  
  // Test 2: API Status
  console.log('🔌 Test 2: API Connectivity');
  try {
    const response = await fetch(`${API_URL}/status`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`   📡 API Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      try {
        const data = await response.json();
        console.log('   ✅ API Status endpoint: OK');
        console.log('   📄 Response data:', data);
      } catch {
        console.log('   ⚠️ API responded but JSON parse failed');
      }
    } else {
      console.log('   ❌ API Status endpoint: FAILED');
    }
  } catch (error: any) {
    console.log(`   ❌ API Status endpoint: ERROR - ${error.message}`);
  }
  
  // Test 3: WebSocket
  console.log('🔌 Test 3: WebSocket Connectivity');
  
  return new Promise<void>((resolve) => {
    const ws = new WebSocket(WS_URL);
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        resolve();
      }
    };
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log('   ❌ WebSocket: Connection timeout (10s)');
        ws.close();
        cleanup();
      }
    }, 10000);
    
    ws.onopen = () => {
      console.log('   ✅ WebSocket: Connected successfully');
      clearTimeout(timeout);
      ws.close();
      cleanup();
    };
    
    ws.onerror = (error) => {
      console.log('   ❌ WebSocket: Connection failed', error);
      clearTimeout(timeout);
      cleanup();
    };
    
    ws.onclose = (event) => {
      if (!resolved) {
        console.log(`   🔌 WebSocket: Closed - ${event.code} ${event.reason}`);
        clearTimeout(timeout);
        cleanup();
      }
    };
  }).finally(() => {
    console.log('');
    console.log('=' .repeat(50));
    console.log('🔧 DegenDuel Connectivity Test - Complete');
    console.log('💡 If issues persist, check:');
    console.log('   1. Backend server status');
    console.log('   2. DNS resolution for degenduel.me');
    console.log('   3. Firewall/network restrictions');
    console.log('   4. SSL certificate validity');
    console.log('');
    console.log('💻 To run this test again, type: testDegenDuelConnectivity()');
  });
};

// 🚀 AUTO-RUN CONNECTIVITY TEST ON DEV ENVIRONMENT
// This runs automatically when you're on dev.degenduel.me so you don't have to remember!
if (window.location.hostname === 'dev.degenduel.me' || 
    window.location.hostname === 'localhost' || 
    window.location.hostname.includes('127.0.0.1')) {
  
  console.log('🔧 [AUTO-DEV] Development environment detected - running connectivity test automatically!');
  
  // Wait a bit for the app to initialize, then run the test
  setTimeout(() => {
    console.log('🔧 [AUTO-DEV] Starting automatic connectivity diagnostics...');
    window.testDegenDuelConnectivity().then(() => {
      console.log('🔧 [AUTO-DEV] Automatic connectivity test completed!');
      console.log('💡 [AUTO-DEV] This test runs automatically on dev domains. To disable, comment out the auto-run code in main.tsx');
    }).catch((error) => {
      console.error('🔧 [AUTO-DEV] Connectivity test failed:', error);
    });
  }, 2000); // Wait 2 seconds for app to load
}