# DegenDuel Frontend Testing Guide

## Overview

This document provides guidance on running and writing tests for the DegenDuel frontend application. We use Jest for running tests and React Testing Library for testing React components.

## Running Tests

```bash
# Run all tests
npm test

# Run tests for a specific file
npm test -- src/components/common/LoadingSpinner.test.tsx

# Run tests matching a specific name
npm test -- -t "LoadingSpinner"

# Run tests with coverage report
npm test -- --coverage
```

## Test Structure

Our tests follow this basic structure:

```tsx
import { render, screen } from "@testing-library/react";
import { MyComponent } from "./MyComponent";

describe("MyComponent", () => {
  it("renders correctly", () => {
    render(<MyComponent />);
    expect(screen.getByText("Some Text")).toBeInTheDocument();
  });
});
```

## Types of Tests

### Unit Tests
Tests for individual components in isolation. Example: testing that a button renders correctly.

### Integration Tests
Tests for how components work together. Example: testing that a form submits data correctly.

### API Service Tests
Tests for API service functions that interact with backend endpoints.

## Authentication Testing

The authentication system has comprehensive test coverage across three key areas:

### 1. Hook Testing (`/src/hooks/useAuth.test.ts`)
- Tests the core useAuth hook functionality
- Verifies user role checks (admin, superadmin)
- Tests connection state management
- Tests WebSocket token generation

### 2. API Service Testing (`/src/services/api/auth.test.ts`)
- Tests authentication API endpoints
- Verifies proper handling of authentication tokens
- Tests error handling for network issues and auth failures
- Tests session management and wallet signature verification

### 3. Integration Testing (`/src/tests/authFlow.test.tsx`)
- Tests complete authentication flows
- Verifies proper routing based on authentication state
- Tests role-based access control across routes
- Tests loading states during authentication

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the component does, not how it's built.

2. **Use Descriptive Test Names**: Make it clear what is being tested.

3. **Test Edge Cases**: Test error states, loading states, and empty states.

4. **Mock External Dependencies**: Use Jest to mock API calls, hooks, etc.

5. **Use Testing Library Queries Correctly**:
   - `getBy*`: Use when element should be in the document
   - `queryBy*`: Use when element might not be in the document
   - `findBy*`: Use for async elements that appear after some time

## Coverage

We track code coverage using Jest's built-in coverage reporter. Coverage reports are generated in the `coverage/` directory after running tests with the `--coverage` flag.

Our current coverage goals (these will increase as test suite matures):
- Statements: 5%
- Branches: 5%
- Functions: 5%
- Lines: 5%

Target coverage goals:
- Statements: 70%
- Branches: 70%
- Functions: 70%
- Lines: 70%

## Testing Protected Routes

When testing components that require authentication:

1. Mock the authentication context/hooks
2. Simulate different user roles (admin, superadmin, regular user)
3. Verify the component behaves correctly for each user type
4. Test both authenticated and unauthenticated states

Example:
```typescript
// Mock the useAuth hook
jest.mock("../../hooks/useAuth", () => ({
  useAuth: jest.fn(),
}));
const { useAuth } = jest.requireMock("../../hooks/useAuth");

// Test with admin user
useAuth.mockReturnValue({
  user: { role: "admin" },
  isAdmin: () => true,
});

// Test with non-admin user
useAuth.mockReturnValue({
  user: { role: "user" },
  isAdmin: () => false,
});
```

## Continuous Integration & Deployment

The CI/CD pipeline runs automatically on GitHub Actions for:
- All pushes to main and develop branches
- All pull requests to main and develop branches

Our workflow runs the following jobs in sequence:
1. **Test Suite**: Runs type checking, tests, and generates coverage reports
2. **Development Build**: Builds the development version (to dist-dev/)
3. **Production Build**: Builds the production version (to dist/)

Each job must pass before a PR can be merged. This ensures:
- Code is type-safe and tests pass
- The application builds successfully for both environments
- Coverage reports are tracked over time

### Setting Up GitHub Environments

To properly configure the CI/CD workflow:

1. Go to your GitHub repository → Settings → Environments
2. Create two environments:
   - **development**: For dev builds (dev.degenduel.me)
   - **production**: For prod builds (degenduel.me)
3. For each environment, you can optionally:
   - Add environment secrets (if needed)
   - Configure environment protection rules
   - Add required reviewers for deployments

### GitHub Branch Protection

To enforce quality checks before merging:

1. Go to your GitHub repository → Settings → Branches → Branch protection rules
2. Add a rule for `main` branch:
   - Check "Require a pull request before merging"
   - Under "Require status checks to pass before merging":
     - Check "Require branches to be up to date before merging"
     - Search for and select ALL of these checks:
       - "Test Suite" 
       - "Development Build"
       - "Production Build"
   - Enable "Do not allow bypassing the above settings"
3. Add a similar rule for the `develop` branch

This configuration ensures:
- All code is peer-reviewed before merging
- All tests, type checks, and builds must pass
- Both dev and prod builds are verified
- Failed builds or tests will block merges

### Using CI Results

Our CI pipeline provides:

1. **Test Results**: View in the GitHub Actions tab
   - See which tests passed/failed
   - Debug test failures directly in GitHub
   - Quick feedback on test status

2. **Code Coverage**: Uploaded to Codecov
   - Coverage reports and history
   - Coverage diff for each PR
   - Visualization and metrics
   - Track progress over time

3. **Build Artifacts**: Uploaded for each workflow run
   - Can be downloaded for inspection
   - Retained for 7 days
   - Useful for debugging build issues
   - Verify build output manually if needed

You can access:
- Test and build results: GitHub Actions tab → Select workflow run → View jobs
- Coverage reports: Click on Codecov check in PR or Actions
- Build artifacts: GitHub Actions tab → Select workflow run → Artifacts section

## Writing New Tests

1. Create a file named `ComponentName.test.tsx` next to the component you're testing.
2. Import the component and any dependencies.
3. Write tests using describe and it blocks.
4. Use render() and screen from React Testing Library to test the component.

## Common Testing Patterns

### Testing Event Handlers

```tsx
import { render, screen, fireEvent } from "@testing-library/react";

it("calls onClick when clicked", () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click Me</Button>);
  fireEvent.click(screen.getByText("Click Me"));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

### Testing Asynchronous Code

```tsx
import { render, screen, waitFor } from "@testing-library/react";

it("loads data asynchronously", async () => {
  render(<DataLoader />);
  expect(screen.getByText("Loading...")).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.getByText("Data Loaded")).toBeInTheDocument();
  });
});
```

### Testing Hooks

```tsx
import { renderHook } from "@testing-library/react";
import { useCounter } from "./useCounter";

it("increments counter", () => {
  const { result } = renderHook(() => useCounter());
  
  act(() => {
    result.current.increment();
  });
  
  expect(result.current.count).toBe(1);
});
```

### Testing API Services

```typescript
// Mock fetch or axios
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

it('handles API errors gracefully', async () => {
  // Setup mock to simulate a network error
  mockAxios.get.mockRejectedValueOnce(new Error('Network error'));

  // Call the service function and verify error handling
  await expect(myService.getData()).rejects.toThrow('Network error');
});
```