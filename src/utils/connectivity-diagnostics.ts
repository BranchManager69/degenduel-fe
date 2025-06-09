/**
 * DegenDuel Connectivity Diagnostics
 * 
 * This utility helps diagnose network connectivity issues with the DegenDuel backend.
 * It tests both REST API and WebSocket connections to identify the root cause of failures.
 */

import { API_URL, WS_URL } from '../config/config';

export interface ConnectivityTestResult {
  timestamp: string;
  testName: string;
  success: boolean;
  responseTime?: number;
  error?: string;
  details?: any;
}

export interface ConnectivityDiagnosticReport {
  timestamp: string;
  userAgent: string;
  networkOnline: boolean;
  apiUrl: string;
  wsUrl: string;
  tests: ConnectivityTestResult[];
  summary: {
    apiTests: { passed: number; failed: number };
    wsTests: { passed: number; failed: number };
    overallHealth: 'healthy' | 'degraded' | 'failed';
  };
}

export class ConnectivityDiagnostics {
  private results: ConnectivityTestResult[] = [];

  /**
   * Run a comprehensive connectivity test suite
   */
  async runFullDiagnostics(): Promise<ConnectivityDiagnosticReport> {
    console.log('🔧 [Connectivity Diagnostics] Starting full diagnostic suite...');

    this.results = [];

    // API Tests
    await this.testMaintenanceEndpoint();
    await this.testApiStatus();
    await this.testCorsConfiguration();
    await this.testBasicApiEndpoints();

    // WebSocket Tests
    await this.testWebSocketConnection();
    await this.testWebSocketAuth();

    // Network Tests
    await this.testNetworkConnectivity();
    await this.testDNSResolution();

    return this.generateReport();
  }

  /**
   * Test the maintenance mode endpoint (the failing one)
   */
  async testMaintenanceEndpoint(): Promise<ConnectivityTestResult> {
    const testName = 'Maintenance Mode Check';
    console.log(`🔍 Testing: ${testName}`);

    const startTime = Date.now();

    try {
      const response = await fetch(`${API_URL}/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'X-Requested-With': 'XMLHttpRequest',
        },
        signal: AbortSignal.timeout(10000)
      });

      const responseTime = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName,
          success: true,
          responseTime,
          details: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            data
          }
        };

        console.log(`✅ ${testName}: Success (${responseTime}ms)`);
        this.results.push(result);
        return result;
      } else {
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName,
          success: false,
          responseTime,
          error: `HTTP ${response.status}: ${response.statusText}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries())
          }
        };

        console.log(`❌ ${testName}: Failed - ${result.error}`);
        this.results.push(result);
        return result;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: ConnectivityTestResult = {
        timestamp: new Date().toISOString(),
        testName,
        success: false,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        details: {
          errorType: error instanceof Error ? error.name : 'Unknown',
          isNetworkError: error instanceof TypeError,
          isTimeoutError: error instanceof Error && error.name === 'AbortError'
        }
      };

      console.log(`❌ ${testName}: Error - ${result.error}`);
      this.results.push(result);
      return result;
    }
  }

  /**
   * Test basic API status and common endpoints
   */
  async testApiStatus(): Promise<void> {
    const endpoints = [
      { path: '/status', name: 'Status Endpoint' },
      { path: '/auth/session', name: 'Auth Session' },
      { path: '/tokens/trending?limit=1', name: 'Tokens Endpoint' },
      { path: '/contests', name: 'Contests Endpoint' }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const response = await fetch(`${API_URL}${endpoint.path}`, {
          method: 'GET',
          credentials: 'include',
          signal: AbortSignal.timeout(5000)
        });

        const responseTime = Date.now() - startTime;

        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: `API ${endpoint.name}`,
          success: response.ok,
          responseTime,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
          details: {
            url: `${API_URL}${endpoint.path}`,
            status: response.status,
            statusText: response.statusText
          }
        };

        if (response.ok) {
          console.log(`✅ API ${endpoint.name}: Success (${responseTime}ms)`);
        } else {
          console.log(`❌ API ${endpoint.name}: Failed - ${result.error}`);
        }

        this.results.push(result);
      } catch (error) {
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: `API ${endpoint.name}`,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          details: {
            url: `${API_URL}${endpoint.path}`,
            errorType: error instanceof Error ? error.name : 'Unknown'
          }
        };

        console.log(`❌ API ${endpoint.name}: Error - ${result.error}`);
        this.results.push(result);
      }
    }
  }

  /**
   * Test CORS configuration
   */
  async testCorsConfiguration(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/status`, {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin,
          'Access-Control-Request-Method': 'GET',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });

      const corsHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        if (key.toLowerCase().startsWith('access-control')) {
          corsHeaders[key] = value;
        }
      });

      const result: ConnectivityTestResult = {
        timestamp: new Date().toISOString(),
        testName: 'CORS Configuration',
        success: response.ok,
        error: response.ok ? undefined : `CORS preflight failed: ${response.status}`,
        details: {
          status: response.status,
          corsHeaders,
          origin: window.location.origin
        }
      };

      console.log(`${response.ok ? '✅' : '❌'} CORS Configuration: ${response.ok ? 'OK' : 'Failed'}`);
      this.results.push(result);
    } catch (error) {
      const result: ConnectivityTestResult = {
        timestamp: new Date().toISOString(),
        testName: 'CORS Configuration',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      console.log(`❌ CORS Configuration: Error - ${result.error}`);
      this.results.push(result);
    }
  }

  /**
   * Test basic API endpoints that should always work
   */
  async testBasicApiEndpoints(): Promise<void> {
    // Test if we can reach the API root
    try {
      const response = await fetch(API_URL, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });

      const result: ConnectivityTestResult = {
        timestamp: new Date().toISOString(),
        testName: 'API Root Reachability',
        success: response.status < 500, // Accept 404, but not 500+
        error: response.status >= 500 ? `Server error: ${response.status}` : undefined,
        details: {
          status: response.status,
          statusText: response.statusText
        }
      };

      console.log(`${result.success ? '✅' : '❌'} API Root: ${response.status} ${response.statusText}`);
      this.results.push(result);
    } catch (error) {
      const result: ConnectivityTestResult = {
        timestamp: new Date().toISOString(),
        testName: 'API Root Reachability',
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };

      console.log(`❌ API Root: Error - ${result.error}`);
      this.results.push(result);
    }
  }

  /**
   * Test WebSocket connection
   */
  async testWebSocketConnection(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔌 Testing WebSocket connection...');

      const startTime = Date.now();
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
          const result: ConnectivityTestResult = {
            timestamp: new Date().toISOString(),
            testName: 'WebSocket Connection',
            success: false,
            error: 'Connection timeout (10 seconds)',
            details: { url: WS_URL }
          };

          console.log(`❌ WebSocket Connection: Timeout`);
          this.results.push(result);
          ws.close();
          cleanup();
        }
      }, 10000);

      ws.onopen = () => {
        const responseTime = Date.now() - startTime;
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: 'WebSocket Connection',
          success: true,
          responseTime,
          details: {
            url: WS_URL,
            readyState: ws.readyState
          }
        };

        console.log(`✅ WebSocket Connection: Success (${responseTime}ms)`);
        this.results.push(result);
        clearTimeout(timeout);
        ws.close();
        cleanup();
      };

      ws.onerror = (error) => {
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: 'WebSocket Connection',
          success: false,
          error: `WebSocket connection failed: ${error}`,
          details: {
            url: WS_URL,
            readyState: ws.readyState
          }
        };

        console.log(`❌ WebSocket Connection: Failed`);
        this.results.push(result);
        clearTimeout(timeout);
        cleanup();
      };

      ws.onclose = (event) => {
        if (!resolved) {
          const result: ConnectivityTestResult = {
            timestamp: new Date().toISOString(),
            testName: 'WebSocket Connection',
            success: false,
            error: `Connection closed: ${event.code} ${event.reason}`,
            details: {
              url: WS_URL,
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean
            }
          };

          console.log(`❌ WebSocket Connection: Closed (${event.code})`);
          this.results.push(result);
          clearTimeout(timeout);
          cleanup();
        }
      };
    });
  }

  /**
   * Test WebSocket authentication
   */
  async testWebSocketAuth(): Promise<void> {
    return new Promise((resolve) => {
      console.log('🔑 Testing WebSocket authentication...');

      const ws = new WebSocket(`${WS_URL}?token=test_token`);
      let resolved = false;

      const timeout = setTimeout(() => {
        if (!resolved) {
          const result: ConnectivityTestResult = {
            timestamp: new Date().toISOString(),
            testName: 'WebSocket Authentication',
            success: false,
            error: 'Auth test timeout',
            details: { url: `${WS_URL}?token=test_token` }
          };

          console.log(`❌ WebSocket Auth: Timeout`);
          this.results.push(result);
          ws.close();
          resolved = true;
          resolve();
        }
      }, 5000);

      ws.onopen = () => {
        console.log('🔌 WebSocket connected, testing auth...');
        ws.send(JSON.stringify({
          type: 'SUBSCRIBE',
          topics: ['system']
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const result: ConnectivityTestResult = {
            timestamp: new Date().toISOString(),
            testName: 'WebSocket Authentication',
            success: true,
            details: {
              url: `${WS_URL}?token=test_token`,
              firstMessage: message,
              messageType: message.type
            }
          };

          console.log(`✅ WebSocket Auth: Success (${message.type})`);
          this.results.push(result);
          clearTimeout(timeout);
          ws.close();
          resolved = true;
          resolve();
        } catch (e) {
          console.log(`⚠️ WebSocket Auth: Message parse error`);
        }
      };

      ws.onerror = () => {
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: 'WebSocket Authentication',
          success: false,
          error: 'Authentication failed',
          details: { url: `${WS_URL}?token=test_token` }
        };

        console.log(`❌ WebSocket Auth: Failed`);
        this.results.push(result);
        clearTimeout(timeout);
        resolved = true;
        resolve();
      };
    });
  }

  /**
   * Test basic network connectivity
   */
  async testNetworkConnectivity(): Promise<void> {
    const hosts = [
      { name: 'DegenDuel Domain', url: 'https://degenduel.me' },
      { name: 'Google (Baseline)', url: 'https://google.com' },
      { name: 'Cloudflare (CDN)', url: 'https://cloudflare.com' }
    ];

    for (const host of hosts) {
      try {
        const startTime = Date.now();
        await fetch(host.url, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(5000)
        });
        const responseTime = Date.now() - startTime;

        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: `Network: ${host.name}`,
          success: true,
          responseTime,
          details: { url: host.url }
        };

        console.log(`✅ Network ${host.name}: Reachable (${responseTime}ms)`);
        this.results.push(result);
      } catch (error) {
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: `Network: ${host.name}`,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          details: { url: host.url }
        };

        console.log(`❌ Network ${host.name}: ${result.error}`);
        this.results.push(result);
      }
    }
  }

  /**
   * Test DNS resolution (limited in browsers)
   */
  async testDNSResolution(): Promise<void> {
    const domains = ['degenduel.me', 'google.com'];

    for (const domain of domains) {
      try {
        const startTime = Date.now();
        await fetch(`https://${domain}`, {
          method: 'HEAD',
          mode: 'no-cors',
          signal: AbortSignal.timeout(3000)
        });
        const responseTime = Date.now() - startTime;

        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: `DNS: ${domain}`,
          success: true,
          responseTime,
          details: { domain }
        };

        console.log(`✅ DNS ${domain}: Resolved (${responseTime}ms)`);
        this.results.push(result);
      } catch (error) {
        const result: ConnectivityTestResult = {
          timestamp: new Date().toISOString(),
          testName: `DNS: ${domain}`,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          details: { domain }
        };

        console.log(`❌ DNS ${domain}: ${result.error}`);
        this.results.push(result);
      }
    }
  }

  /**
   * Generate a comprehensive diagnostic report
   */
  private generateReport(): ConnectivityDiagnosticReport {
    const apiTests = this.results.filter(r => r.testName.includes('API') || r.testName.includes('Maintenance') || r.testName.includes('CORS'));
    const wsTests = this.results.filter(r => r.testName.includes('WebSocket'));

    const apiPassed = apiTests.filter(t => t.success).length;
    const apiFailed = apiTests.filter(t => !t.success).length;
    const wsPassed = wsTests.filter(t => t.success).length;
    const wsFailed = wsTests.filter(t => !t.success).length;

    let overallHealth: 'healthy' | 'degraded' | 'failed';
    if (apiPassed === 0 && wsPassed === 0) {
      overallHealth = 'failed';
    } else if (apiFailed > 0 || wsFailed > 0) {
      overallHealth = 'degraded';
    } else {
      overallHealth = 'healthy';
    }

    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      networkOnline: navigator.onLine,
      apiUrl: API_URL,
      wsUrl: WS_URL,
      tests: this.results,
      summary: {
        apiTests: { passed: apiPassed, failed: apiFailed },
        wsTests: { passed: wsPassed, failed: wsFailed },
        overallHealth
      }
    };
  }

  /**
   * Export diagnostic results for sharing
   */
  exportResults(report: ConnectivityDiagnosticReport): void {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `degenduel-diagnostics-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);

    console.log('📄 Diagnostic results exported to file');
  }
}

// Export a singleton instance for easy use
export const connectivityDiagnostics = new ConnectivityDiagnostics(); 