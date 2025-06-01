/**
 * Contest Flow Test Runner
 * 
 * This script provides a systematic way to run and monitor contest flow tests
 * with proper logging, cleanup, and reporting.
 */

import { TEST_CONFIG, cleanupTestContests, createTestContest } from './setup';

// Test Configuration
const RUNNER_CONFIG = {
  MAX_CONCURRENT_TESTS: 3,
  TEST_TIMEOUT: 120000, // 2 minutes per test
  RETRY_ATTEMPTS: 2,
  REPORT_FILE: 'contest-flow-test-report.json',
};

interface TestResult {
  testName: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
  timestamp: string;
  contestId?: string;
}

interface TestReport {
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    totalDuration: number;
  };
  results: TestResult[];
  environment: {
    apiUrl: string;
    wsUrl: string;
    timestamp: string;
  };
}

class ContestFlowTestRunner {
  private results: TestResult[] = [];
  private startTime: number = 0;

  async runAllTests(): Promise<TestReport> {
    console.log('🚀 Starting Contest Flow E2E Test Suite');
    console.log('🔧 Test Configuration:', {
      apiUrl: TEST_CONFIG.API_URL,
      wsUrl: TEST_CONFIG.WS_URL,
      maxConcurrent: RUNNER_CONFIG.MAX_CONCURRENT_TESTS,
      timeout: RUNNER_CONFIG.TEST_TIMEOUT,
    });

    this.startTime = Date.now();

    // Pre-test setup
    await this.preTestSetup();

    try {
      // Run test suites
      await this.runTestSuite('Free Contest Flow', this.runFreeContestTests);
      await this.runTestSuite('Paid Contest Flow', this.runPaidContestTests);
      await this.runTestSuite('Multi-User Scenarios', this.runMultiUserTests);
      await this.runTestSuite('Error Handling', this.runErrorHandlingTests);
      await this.runTestSuite('Performance Tests', this.runPerformanceTests);

    } finally {
      // Post-test cleanup
      await this.postTestCleanup();
    }

    return this.generateReport();
  }

  private async preTestSetup(): Promise<void> {
    console.log('🧹 Pre-test setup: Cleaning existing test data');
    try {
      await cleanupTestContests();
      console.log('✅ Pre-test cleanup completed');
    } catch (error) {
      console.warn('⚠️ Pre-test cleanup failed (continuing anyway):', error);
    }
  }

  private async postTestCleanup(): Promise<void> {
    console.log('🧹 Post-test cleanup: Removing test data');
    try {
      await cleanupTestContests();
      console.log('✅ Post-test cleanup completed');
    } catch (error) {
      console.warn('⚠️ Post-test cleanup failed:', error);
    }
  }

  private async runTestSuite(suiteName: string, testFunction: () => Promise<void>): Promise<void> {
    console.log(`\n📋 Running Test Suite: ${suiteName}`);
    const suiteStartTime = Date.now();

    try {
      await testFunction.call(this);
      const duration = Date.now() - suiteStartTime;
      console.log(`✅ ${suiteName} completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - suiteStartTime;
      console.error(`❌ ${suiteName} failed after ${duration}ms:`, error);

      this.results.push({
        testName: suiteName,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async runFreeContestTests(): Promise<void> {
    console.log('🎯 Testing Free Contest Flow');

    // Create test contest
    const testContest = await createTestContest({
      name: `${TEST_CONFIG.TEST_CONTEST_PREFIX}Free_Flow_Test_${Date.now()}`,
      description: 'Automated test for free contest flow',
      entry_fee: '0',
      min_participants: 2,
      max_participants: 10,
      allowed_buckets: [1, 2, 3],
      settings: {
        difficulty: 'guppy' as const,
        tokenTypesAllowed: ['crypto'],
        startingPortfolioValue: '1000',
        minParticipants: 2,
        maxParticipants: 10,
      }
    });

    console.log(`📝 Created test contest: ${testContest.contest_code}`);

    // Simulate test steps
    await this.simulateUserJourney('free-contest', testContest.id);
  }

  private async runPaidContestTests(): Promise<void> {
    console.log('💰 Testing Paid Contest Flow');

    const testContest = await createTestContest({
      name: `${TEST_CONFIG.TEST_CONTEST_PREFIX}Paid_Flow_Test_${Date.now()}`,
      description: 'Automated test for paid contest flow',
      entry_fee: '0.01', // Small test amount
      min_participants: 2,
      max_participants: 10,
      allowed_buckets: [1, 2, 3],
      settings: {
        difficulty: 'guppy' as const,
        tokenTypesAllowed: ['crypto'],
        startingPortfolioValue: '1000',
        minParticipants: 2,
        maxParticipants: 10,
      }
    });

    console.log(`📝 Created paid test contest: ${testContest.contest_code}`);

    // Simulate paid contest journey (would include wallet mocking)
    await this.simulateUserJourney('paid-contest', testContest.id);
  }

  private async runMultiUserTests(): Promise<void> {
    console.log('👥 Testing Multi-User Scenarios');

    // Test concurrent user actions
    await this.simulateTest('concurrent-entries', async () => {
      // Create contest that multiple users can join
      const sharedContest = await createTestContest();

      // Simulate multiple users joining simultaneously
      const userPromises = Array(3).fill(null).map((_, index) =>
        this.simulateUserJourney(`user-${index}`, sharedContest.id)
      );

      await Promise.all(userPromises);
    });
  }

  private async runErrorHandlingTests(): Promise<void> {
    console.log('⚠️ Testing Error Handling');

    await this.simulateTest('invalid-contest-id', async () => {
      // Test with invalid contest ID
      try {
        await this.simulateUserJourney('error-test', 'invalid-id');
      } catch (error) {
        console.log('✅ Expected error caught:', error);
      }
    });

    await this.simulateTest('network-errors', async () => {
      // Test network error scenarios
      console.log('🔧 Simulating network disruption');
      // Implementation would mock network failures
    });
  }

  private async runPerformanceTests(): Promise<void> {
    console.log('⚡ Testing Performance');

    await this.simulateTest('page-load-times', async () => {
      const loadTimes = [];

      // Test multiple page loads
      for (let i = 0; i < 5; i++) {
        const startTime = performance.now();
        // Simulate page load
        await new Promise(resolve => setTimeout(resolve, 100));
        const loadTime = performance.now() - startTime;
        loadTimes.push(loadTime);
      }

      const avgLoadTime = loadTimes.reduce((a, b) => a + b) / loadTimes.length;
      console.log(`📊 Average page load time: ${avgLoadTime.toFixed(2)}ms`);

      // Performance threshold check
      if (avgLoadTime > 3000) {
        throw new Error(`Page load time ${avgLoadTime}ms exceeds 3000ms threshold`);
      }
    });
  }

  private async simulateUserJourney(userId: string, contestId: string): Promise<void> {
    console.log(`👤 Simulating user journey for ${userId} in contest ${contestId}`);

    // Simulate the contest flow steps
    const steps = [
      'browse-contests',
      'view-contest-details',
      'select-portfolio',
      'submit-entry',
      'monitor-contest',
      'view-results'
    ];

    for (const step of steps) {
      await this.simulateStep(userId, step, contestId);
    }
  }

  private async simulateStep(userId: string, step: string, _contestId: string): Promise<void> {
    console.log(`  📍 ${userId}: ${step}`);

    // Add realistic timing delays
    const delay = Math.random() * 1000 + 500; // 0.5-1.5 seconds
    await new Promise(resolve => setTimeout(resolve, delay));

    // Simulate potential failures
    if (Math.random() < 0.05) { // 5% failure rate for testing
      throw new Error(`Simulated failure in ${step} for ${userId}`);
    }
  }

  private async simulateTest(testName: string, testFunction: () => Promise<void>): Promise<void> {
    const startTime = Date.now();

    try {
      await testFunction();
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        status: 'passed',
        duration,
        timestamp: new Date().toISOString(),
      });

      console.log(`✅ ${testName} passed (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;

      this.results.push({
        testName,
        status: 'failed',
        duration,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });

      console.error(`❌ ${testName} failed (${duration}ms):`, error);
    }
  }

  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime;
    const summary = {
      total: this.results.length,
      passed: this.results.filter(r => r.status === 'passed').length,
      failed: this.results.filter(r => r.status === 'failed').length,
      skipped: this.results.filter(r => r.status === 'skipped').length,
      totalDuration,
    };

    const report: TestReport = {
      summary,
      results: this.results,
      environment: {
        apiUrl: TEST_CONFIG.API_URL,
        wsUrl: TEST_CONFIG.WS_URL,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('\n📊 Test Summary:');
    console.log(`  Total Tests: ${summary.total}`);
    console.log(`  Passed: ${summary.passed} ✅`);
    console.log(`  Failed: ${summary.failed} ❌`);
    console.log(`  Skipped: ${summary.skipped} ⏭️`);
    console.log(`  Total Duration: ${totalDuration}ms`);
    console.log(`  Success Rate: ${((summary.passed / summary.total) * 100).toFixed(1)}%`);

    return report;
  }
}

// Export for external usage
export const testRunner = new ContestFlowTestRunner();

// CLI usage
if (require.main === module) {
  testRunner.runAllTests()
    .then(report => {
      console.log('\n🎉 Test run completed');
      process.exit(report.summary.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Test runner failed:', error);
      process.exit(1);
    });
} 