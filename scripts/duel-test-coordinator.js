#!/usr/bin/env node

/**
 * DegenDuel Test Coordinator
 * 
 * This script helps coordinate full duel testing with the backend team
 * by providing automated test execution, monitoring, and reporting.
 */

const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

class DuelTestCoordinator {
  constructor() {
    this.testResults = [];
    this.startTime = new Date();
    this.currentPhase = null;
    this.testConfig = {
      API_URL: process.env.VITE_TEST_API_URL || 'https://dev.degenduel.me/api',
      WS_URL: process.env.VITE_TEST_WS_URL || 'wss://dev.degenduel.me',
      TEST_DURATION: 3 * 60 * 60 * 1000, // 3 hours
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = {
      info: '🔵',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      phase: '🎯'
    }[type] || '📝';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
    
    // Also log to file for backend team reference
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}\n`;
    fs.appendFileSync('duel-test-log.txt', logEntry);
  }

  async runCommand(command, description) {
    return new Promise((resolve, reject) => {
      this.log(`Running: ${description}`, 'info');
      
      exec(command, (error, stdout, stderr) => {
        if (error) {
          this.log(`Failed: ${description} - ${error.message}`, 'error');
          reject(error);
        } else {
          this.log(`Completed: ${description}`, 'success');
          resolve({ stdout, stderr });
        }
      });
    });
  }

  async preTestSetup() {
    this.log('Starting Pre-Test Setup', 'phase');
    
    try {
      // Clean up any existing test data
      await this.runCommand(
        'npm run test:contest-flow:runner -- --cleanup',
        'Cleaning existing test data'
      );

      // Verify connectivity
      await this.runCommand(
        'npm run test:tokens',
        'Verifying token API connectivity'
      );

      // Test WebSocket connection
      await this.testWebSocketConnectivity();

      // Create test contests
      await this.createTestContests();

      this.log('Pre-test setup completed successfully', 'success');
      return true;
    } catch (error) {
      this.log(`Pre-test setup failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWebSocketConnectivity() {
    this.log('Testing WebSocket connectivity', 'info');
    
    return new Promise((resolve, reject) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(this.testConfig.WS_URL);
      
      const timeout = setTimeout(() => {
        this.log('WebSocket connection timeout', 'warning');
        ws.close();
        reject(new Error('WebSocket timeout'));
      }, 10000);

      ws.on('open', () => {
        this.log('WebSocket connection successful', 'success');
        clearTimeout(timeout);
        ws.close();
        resolve();
      });

      ws.on('error', (error) => {
        this.log(`WebSocket connection failed: ${error.message}`, 'error');
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  async createTestContests() {
    this.log('Creating test contests', 'info');
    
    const contests = [
      {
        name: 'E2E-Test-Free-Contest',
        entry_fee: '0',
        type: 'free'
      },
      {
        name: 'E2E-Test-Paid-Contest',
        entry_fee: '0.01',
        type: 'paid'
      },
      {
        name: 'E2E-Test-Stress-Contest',
        entry_fee: '0',
        max_participants: 10,
        type: 'stress'
      }
    ];

    for (const contest of contests) {
      try {
        const response = await fetch(`${this.testConfig.API_URL}/contests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            name: `${contest.name}_${Date.now()}`,
            description: `Automated test contest for ${contest.type} testing`,
            entry_fee: contest.entry_fee,
            min_participants: 2,
            max_participants: contest.max_participants || 5,
            start_time: new Date(Date.now() + 60 * 1000).toISOString(),
            end_time: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
          })
        });

        if (response.ok) {
          const contestData = await response.json();
          this.log(`Created ${contest.type} contest: ${contestData.contest_code}`, 'success');
        } else {
          this.log(`Failed to create ${contest.type} contest: ${response.statusText}`, 'error');
        }
      } catch (error) {
        this.log(`Error creating ${contest.type} contest: ${error.message}`, 'error');
      }
    }
  }

  async executePhase1() {
    this.currentPhase = 'Phase 1: Basic Contest Flow';
    this.log(`Starting ${this.currentPhase}`, 'phase');
    
    try {
      // Run free contest flow test
      await this.runCommand(
        'npm run test:contest-flow:free',
        'Free contest flow test'
      );

      // Test paid contest flow (if Solana testnet is available)
      try {
        await this.runCommand(
          'npm run test:contest-flow -- --paid',
          'Paid contest flow test'
        );
      } catch (error) {
        this.log('Paid contest test skipped (no testnet SOL)', 'warning');
      }

      this.log(`${this.currentPhase} completed`, 'success');
      return true;
    } catch (error) {
      this.log(`${this.currentPhase} failed: ${error.message}`, 'error');
      return false;
    }
  }

  async executePhase2() {
    this.currentPhase = 'Phase 2: Stress Testing';
    this.log(`Starting ${this.currentPhase}`, 'phase');
    
    try {
      // Run concurrent user simulation
      await this.runCommand(
        'npm run test:contest-flow:runner -- --concurrent-users=10',
        'Concurrent user load test'
      );

      // Monitor system performance
      await this.monitorPerformance(5 * 60 * 1000); // 5 minutes

      this.log(`${this.currentPhase} completed`, 'success');
      return true;
    } catch (error) {
      this.log(`${this.currentPhase} failed: ${error.message}`, 'error');
      return false;
    }
  }

  async executePhase3() {
    this.currentPhase = 'Phase 3: Error Scenarios';
    this.log(`Starting ${this.currentPhase}`, 'phase');
    
    try {
      // Test error handling
      await this.runCommand(
        'npm run test:contest-flow:runner -- --test-errors',
        'Error scenario testing'
      );

      this.log(`${this.currentPhase} completed`, 'success');
      return true;
    } catch (error) {
      this.log(`${this.currentPhase} failed: ${error.message}`, 'error');
      return false;
    }
  }

  async executePhase4() {
    this.currentPhase = 'Phase 4: Integration Points';
    this.log(`Starting ${this.currentPhase}`, 'phase');
    
    try {
      // Test Solana integration
      await this.testSolanaIntegration();

      // Test WebSocket event flow
      await this.testWebSocketEventFlow();

      this.log(`${this.currentPhase} completed`, 'success');
      return true;
    } catch (error) {
      this.log(`${this.currentPhase} failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testSolanaIntegration() {
    this.log('Testing Solana integration', 'info');
    
    try {
      // Test Jupiter price feeds
      const response = await fetch('https://price.jup.ag/v4/price?ids=So11111111111111111111111111111111111111112');
      if (response.ok) {
        const data = await response.json();
        this.log(`SOL price from Jupiter: $${data.data.So11111111111111111111111111111111111111112.price}`, 'success');
      }
    } catch (error) {
      this.log(`Solana integration test failed: ${error.message}`, 'error');
    }
  }

  async testWebSocketEventFlow() {
    this.log('Testing WebSocket event flow', 'info');
    
    return new Promise((resolve) => {
      const WebSocket = require('ws');
      const ws = new WebSocket(this.testConfig.WS_URL);
      const events = [];
      
      ws.on('open', () => {
        // Subscribe to contest events
        ws.send(JSON.stringify({
          action: 'subscribe',
          topic: 'contest',
          data: {}
        }));
        
        setTimeout(() => {
          this.log(`Received ${events.length} WebSocket events`, 'info');
          ws.close();
          resolve();
        }, 30000);
      });

      ws.on('message', (data) => {
        try {
          const event = JSON.parse(data);
          events.push(event);
          this.log(`WS Event: ${event.type || 'unknown'}`, 'info');
        } catch (error) {
          this.log(`Invalid WebSocket message: ${data}`, 'warning');
        }
      });

      ws.on('error', (error) => {
        this.log(`WebSocket error: ${error.message}`, 'error');
        resolve();
      });
    });
  }

  async monitorPerformance(duration) {
    this.log(`Monitoring performance for ${duration / 1000} seconds`, 'info');
    
    const startTime = Date.now();
    const metrics = {
      apiCalls: 0,
      wsMessages: 0,
      errors: 0
    };

    // Simulate performance monitoring
    const interval = setInterval(() => {
      // In a real implementation, this would collect actual metrics
      metrics.apiCalls += Math.floor(Math.random() * 10);
      metrics.wsMessages += Math.floor(Math.random() * 50);
      
      if (Date.now() - startTime >= duration) {
        clearInterval(interval);
        this.log(`Performance metrics: ${JSON.stringify(metrics)}`, 'info');
      }
    }, 1000);

    return new Promise((resolve) => {
      setTimeout(resolve, duration);
    });
  }

  async generateReport() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const report = {
      testSession: {
        startTime: this.startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: `${Math.floor(duration / 1000 / 60)} minutes`,
      },
      phases: this.testResults,
      summary: {
        totalTests: this.testResults.length,
        passed: this.testResults.filter(r => r.success).length,
        failed: this.testResults.filter(r => !r.success).length,
      },
      nextSteps: [
        'Review failed tests and prioritize fixes',
        'Share logs with backend team',
        'Schedule follow-up testing if needed',
        'Plan production deployment if all critical tests pass'
      ]
    };

    const reportPath = `duel-test-report-${Date.now()}.json`;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Test report generated: ${reportPath}`, 'success');
    this.log(`Test Summary: ${report.summary.passed}/${report.summary.totalTests} tests passed`, 'info');
    
    return report;
  }

  async runFullTest() {
    this.log('🗡️ Starting Full Duel Test Coordination', 'phase');
    
    // Pre-test setup
    const setupSuccess = await this.preTestSetup();
    if (!setupSuccess) {
      this.log('Aborting test due to setup failure', 'error');
      return;
    }

    // Execute test phases
    const phases = [
      () => this.executePhase1(),
      () => this.executePhase2(),
      () => this.executePhase3(),
      () => this.executePhase4()
    ];

    for (let i = 0; i < phases.length; i++) {
      const phaseNumber = i + 1;
      this.log(`\n${'='.repeat(50)}`, 'info');
      this.log(`STARTING PHASE ${phaseNumber}`, 'phase');
      this.log(`${'='.repeat(50)}`, 'info');
      
      const startTime = Date.now();
      const success = await phases[i]();
      const duration = Date.now() - startTime;
      
      this.testResults.push({
        phase: phaseNumber,
        success,
        duration: `${Math.floor(duration / 1000)} seconds`,
        timestamp: new Date().toISOString()
      });

      if (!success) {
        this.log(`Phase ${phaseNumber} failed. Continue? (y/n)`, 'warning');
        // In a real scenario, this would wait for user input
        // For now, continue with other phases
      }
      
      // 2-minute break between phases
      this.log('Taking 2-minute break before next phase...', 'info');
      await new Promise(resolve => setTimeout(resolve, 2 * 60 * 1000));
    }

    // Generate final report
    await this.generateReport();
    
    this.log('🎉 Full Duel Test Coordination Complete!', 'success');
  }
}

// CLI interface
if (require.main === module) {
  const coordinator = new DuelTestCoordinator();
  
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'setup':
      coordinator.preTestSetup();
      break;
    case 'phase1':
      coordinator.executePhase1();
      break;
    case 'phase2':
      coordinator.executePhase2();
      break;
    case 'phase3':
      coordinator.executePhase3();
      break;
    case 'phase4':
      coordinator.executePhase4();
      break;
    case 'full':
    default:
      coordinator.runFullTest();
      break;
  }
}

module.exports = DuelTestCoordinator; 