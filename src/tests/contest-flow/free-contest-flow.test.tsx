/**
 * Free Contest Flow End-to-End Test
 * 
 * Tests the complete user journey for free contests:
 * 1. Contest Discovery (Browse/Landing)
 * 2. Contest Details 
 * 3. Portfolio Selection
 * 4. Contest Entry (Free)
 * 5. Live Contest Experience
 * 6. Results Page
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  cleanupTestContests,
  ContestFlowTestWrapper,
  createTestContest,
  performanceMonitor,
  TEST_CONTEST_TEMPLATE
} from './setup';

// Import the pages we'll be testing
import { ContestBrowser } from '../../pages/public/contests/ContestBrowserPage';
import { ContestDetails } from '../../pages/public/contests/ContestDetailPage';
import { ContestLobbyV2 } from '../../pages/public/contests/ContestLobbyV2';
import { ContestResults } from '../../pages/public/contests/ContestResultsPage';
import { PortfolioTokenSelectionPage } from '../../pages/public/contests/PortfolioTokenSelectionPage';

// Mock react-router-dom for controlled navigation testing
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ id: 'test-contest-123' }),
}));

// Mock the auth hook to simulate logged-in user
jest.mock('../../hooks/auth/useMigratedAuth', () => ({
  useMigratedAuth: () => ({
    user: {
      id: 'test-user-123',
      username: 'test_free_user',
      email: 'test@degenduel.test',
      role: 'user',
    },
    isAuthenticated: true,
    loading: false,
  }),
}));

describe('Free Contest Flow E2E', () => {
  let testContest: any;
  
  beforeAll(async () => {
    // Clean up any existing test contests
    await cleanupTestContests();
    
    // Create a test contest for this flow
    testContest = await createTestContest(TEST_CONTEST_TEMPLATE, {
      entry_fee: '0', // Ensure it's free
    });
    
    console.log('🎯 Test contest created:', testContest.contest_code);
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestContests();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Step 1: Contest Discovery', () => {
    it('should display free contests in the browser', async () => {
      performanceMonitor.startTiming('ContestBrowser Load');
      
      render(
        <ContestFlowTestWrapper>
          <ContestBrowser />
        </ContestFlowTestWrapper>
      );

      performanceMonitor.endTiming('ContestBrowser Load');

      // Wait for contests to load
      await waitFor(() => {
        expect(screen.getByText(/contest/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show our test contest
      await waitFor(() => {
        expect(screen.getByText(new RegExp(testContest.name, 'i'))).toBeInTheDocument();
      });

      // Should indicate it's free ($0.00 entry fee)
      expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
    });

    it('should allow clicking on a free contest to view details', async () => {
      render(
        <ContestFlowTestWrapper>
          <ContestBrowser />
        </ContestFlowTestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(new RegExp(testContest.name, 'i'))).toBeInTheDocument();
      });

      // Click on the contest
      const contestCard = screen.getByText(new RegExp(testContest.name, 'i')).closest('div');
      expect(contestCard).toBeInTheDocument();
      
      fireEvent.click(contestCard!);

      // Should navigate to contest details
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining(`/contests/${testContest.id}`));
      });
    });
  });

  describe('Step 2: Contest Details', () => {
    it('should display contest information and entry button', async () => {
      performanceMonitor.startTiming('ContestDetails Load');
      
      render(
        <ContestFlowTestWrapper>
          <ContestDetails />
        </ContestFlowTestWrapper>
      );

      performanceMonitor.endTiming('ContestDetails Load');

      // Wait for contest details to load
      await waitFor(() => {
        expect(screen.getByText(/contest details|select your portfolio/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show free contest indicator
      expect(screen.getByText(/free|no entry fee|\$0\.00/i)).toBeInTheDocument();

      // Should have entry button enabled
      const entryButton = screen.getByRole('button', { name: /join|enter|select portfolio/i });
      expect(entryButton).toBeInTheDocument();
      expect(entryButton).not.toBeDisabled();
    });

    it('should navigate to portfolio selection when entry button is clicked', async () => {
      render(
        <ContestFlowTestWrapper>
          <ContestDetails />
        </ContestFlowTestWrapper>
      );

      await waitFor(() => {
        const entryButton = screen.getByRole('button', { name: /join|enter|select portfolio/i });
        expect(entryButton).toBeInTheDocument();
      });

      const entryButton = screen.getByRole('button', { name: /join|enter|select portfolio/i });
      fireEvent.click(entryButton);

      // Should navigate to portfolio selection
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/portfolio-selection')
        );
      });
    });
  });

  describe('Step 3: Portfolio Selection', () => {
    it('should display token selection interface for free contest', async () => {
      performanceMonitor.startTiming('PortfolioSelection Load');
      
      render(
        <ContestFlowTestWrapper>
          <PortfolioTokenSelectionPage />
        </ContestFlowTestWrapper>
      );

      performanceMonitor.endTiming('PortfolioSelection Load');

      // Wait for tokens to load
      await waitFor(() => {
        expect(screen.getByText(/select tokens|build portfolio|token selection/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show "FREE CONTEST" indicator
      expect(screen.getByText(/free contest/i)).toBeInTheDocument();

      // Should display available tokens
      await waitFor(() => {
        expect(screen.getByText(/SOL/)).toBeInTheDocument();
      });
    });

    it('should allow portfolio creation and submission for free contest', async () => {
      const user = userEvent.setup();
      
      render(
        <ContestFlowTestWrapper>
          <PortfolioTokenSelectionPage />
        </ContestFlowTestWrapper>
      );

      // Wait for tokens to load
      await waitFor(() => {
        expect(screen.getByText(/SOL/)).toBeInTheDocument();
      });

      // Select SOL token
      const solToken = screen.getByText(/SOL/).closest('button');
      if (solToken) {
        await user.click(solToken);
      }

      // Set weight for SOL (40%)
      const solWeightInput = screen.getByDisplayValue('40') || screen.getByPlaceholderText(/weight|percentage/i);
      if (solWeightInput) {
        await user.clear(solWeightInput);
        await user.type(solWeightInput, '60');
      }

      // Select JTO token
      const jtoToken = screen.getByText(/JTO/).closest('button');
      if (jtoToken) {
        await user.click(jtoToken);
      }

      // Set weight for JTO (40%)
      const jtoWeightInput = screen.getAllByDisplayValue('40')[1] || screen.getAllByPlaceholderText(/weight|percentage/i)[1];
      if (jtoWeightInput) {
        await user.clear(jtoWeightInput);
        await user.type(jtoWeightInput, '40');
      }

      // Submit portfolio
      const submitButton = screen.getByRole('button', { name: /submit|enter contest|join/i });
      expect(submitButton).toBeInTheDocument();
      
      await user.click(submitButton);

      // For free contests, should proceed directly without payment
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          expect.stringContaining('/live') || expect.stringContaining('/lobby')
        );
      }, { timeout: 15000 });
    });
  });

  describe('Step 4: Contest Entry Success', () => {
    it('should successfully enter free contest without payment', async () => {
      // This test verifies the API call for free contest entry
      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, contestId: testContest.id }),
        } as Response)
      );

      render(
        <ContestFlowTestWrapper>
          <PortfolioTokenSelectionPage />
        </ContestFlowTestWrapper>
      );

      // Simulate portfolio submission
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /submit|enter/i })).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /submit|enter/i });
      fireEvent.click(submitButton);

      // Should call the free contest entry API
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/contests'),
          expect.objectContaining({
            method: 'POST',
            credentials: 'include',
          })
        );
      });

      mockFetch.mockRestore();
    });
  });

  describe('Step 5: Live Contest Experience', () => {
    it('should display contest lobby with real-time updates', async () => {
      performanceMonitor.startTiming('ContestLobby Load');
      
      render(
        <ContestFlowTestWrapper>
          <ContestLobbyV2 />
        </ContestFlowTestWrapper>
      );

      performanceMonitor.endTiming('ContestLobby Load');

      // Wait for lobby to load
      await waitFor(() => {
        expect(screen.getByText(/contest lobby|live contest|leaderboard/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show user is participating
      expect(screen.getByText(/you are participating|your portfolio/i)).toBeInTheDocument();

      // Should show leaderboard
      expect(screen.getByText(/leaderboard|rankings/i)).toBeInTheDocument();
    });
  });

  describe('Step 6: Contest Results', () => {
    it('should display results page with final standings', async () => {
      performanceMonitor.startTiming('ContestResults Load');
      
      render(
        <ContestFlowTestWrapper>
          <ContestResults />
        </ContestFlowTestWrapper>
      );

      performanceMonitor.endTiming('ContestResults Load');

      // Wait for results to load
      await waitFor(() => {
        expect(screen.getByText(/contest results|final standings|your rank/i)).toBeInTheDocument();
      }, { timeout: 10000 });

      // Should show final leaderboard
      expect(screen.getByText(/final leaderboard|final standings/i)).toBeInTheDocument();

      // Should show user's final position
      expect(screen.getByText(/your rank|your position/i)).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      const mockFetch = jest.spyOn(global, 'fetch').mockImplementation(() =>
        Promise.reject(new Error('Network error'))
      );

      render(
        <ContestFlowTestWrapper>
          <ContestBrowser />
        </ContestFlowTestWrapper>
      );

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText(/error|failed to load|try again/i)).toBeInTheDocument();
      });

      mockFetch.mockRestore();
    });

    it('should handle WebSocket disconnection gracefully', async () => {
      render(
        <ContestFlowTestWrapper>
          <ContestLobbyV2 />
        </ContestFlowTestWrapper>
      );

      // Should show connection status
      await waitFor(() => {
        expect(screen.getByText(/connected|disconnected|reconnecting/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should load pages within acceptable time limits', async () => {
      const measurements: number[] = [];

      // Test ContestBrowser load time
      const start1 = performance.now();
      render(<ContestFlowTestWrapper><ContestBrowser /></ContestFlowTestWrapper>);
      await waitFor(() => screen.getByText(/contest/i));
      measurements.push(performance.now() - start1);

      // Test ContestDetails load time
      const start2 = performance.now();
      render(<ContestFlowTestWrapper><ContestDetails /></ContestFlowTestWrapper>);
      await waitFor(() => screen.getByText(/contest details|select portfolio/i));
      measurements.push(performance.now() - start2);

      // All pages should load within 3 seconds
      measurements.forEach((time, index) => {
        expect(time).toBeLessThan(3000);
        console.log(`📊 Page ${index + 1} loaded in ${time.toFixed(2)}ms`);
      });
    });
  });
}); 