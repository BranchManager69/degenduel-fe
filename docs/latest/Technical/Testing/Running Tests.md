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

## TypeScript Testing Best Practices

1. **Use Explicit Type Annotations**: When mocking in TypeScript, use explicit type annotations instead of relying on imports.

   ```typescript
   // Instead of importing then mocking (creates unused import warnings):
   // import { myService } from './myService';
   
   // Create explicitly typed mock functions 
   const mockGetData = jest.fn<Promise<UserData>, [string]>();
   const mockUpdateUser = jest.fn<Promise<void>, [string, UserUpdateParams]>();
   
   // Set up the mock implementation with properly typed functions
   jest.mock('./myService', () => ({
     myService: {
       getData: mockGetData,
       updateUser: mockUpdateUser
     }
   }));
   ```

2. **Use Named Mock Functions**: Instead of casting functions to jest.Mock, create explicit mock functions with variable names.

   ```typescript
   // 🚫 Avoid this pattern that requires type casting
   (myService.getData as jest.Mock).mockResolvedValue({ data: 123 });
   
   // ✅ Better approach with named mocks
   const mockGetData = jest.fn();
   jest.mock('./myService', () => ({ myService: { getData: mockGetData } }));
   mockGetData.mockResolvedValue({ data: 123 });
   ```

3. **Type Your Mock Responses**: Ensure mock responses match the expected types.

   ```typescript
   // Type your mock data
   const mockUserData: User = { 
     id: 1, 
     name: 'Test User',
     email: 'test@example.com'
   };
   
   // Use proper typing for the response
   mockGetUser.mockResolvedValue(mockUserData);
   ```

4. **Create Properly Typed Mock Responses**: For fetch or axios, create helper functions that return properly typed responses.

   ```typescript
   const createMockResponse = <T>(status: number, data: T): Response => {
     return {
       status,
       ok: status >= 200 && status < 300,
       json: jest.fn().mockResolvedValue(data),
       text: jest.fn().mockResolvedValue(JSON.stringify(data)),
       headers: new Headers()
     } as unknown as Response;
   };
   ```

5. **Avoid Type Assertions When Possible**: Use proper types from the start rather than converting types later.

   ```typescript
   // 🚫 Avoid excessive type assertions
   const result = await myFunction() as SomeType;
   
   // ✅ Better to ensure your mocks and functions return the correct types
   mockFunction.mockResolvedValue(correctlyTypedData);
   const result = await myFunction(); // TypeScript knows the type
   ```

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

2. **Code Coverage**: Uploaded to Codecov
   - Coverage reports and history
   - Coverage diff for each PR
   - Visualization and metrics

3. **Build Artifacts**: Uploaded for each workflow run
   - Can be downloaded for inspection
   - Retained for 7 days
   - Useful for debugging build issues

You can access:
- Test and build results: GitHub Actions tab → Select workflow run → View jobs
- Coverage reports: Click on Codecov check in PR or Actions
- Build artifacts: GitHub Actions tab → Select workflow run → Artifacts section

## Writing New Tests

1. Create a file named `ComponentName.test.tsx` next to the component you're testing.
2. Import the component and any dependencies.
3. Write tests using describe and it blocks.
4. Use render() and screen from React Testing Library to test the component.

## Common TypeScript Testing Issues and Solutions

### 1. Issue: Using API client functions with incorrect parameters

```typescript
// 🚫 Problem: This function doesn't accept a token parameter
const client = createApiClient("token");

// ✅ Solution: Pass auth headers in the request options instead
const client = createApiClient();
await client.fetch("/endpoint", {
  headers: {
    Authorization: "Bearer token"
  }
});
```

### 2. Issue: Type errors when mocking API services

```typescript
// 🚫 Problem: Using type assertions can lead to errors
const result = await (apiService.getData as jest.Mock)(); // TS error!

// ✅ Solution: Use named mock functions
const mockGetData = jest.fn();
jest.mock('./apiService', () => ({
  apiService: { getData: mockGetData }
}));
const result = await mockGetData(); // No type errors
```

### 3. Issue: Incorrect mock Response objects

```typescript
// 🚫 Problem: Mock response doesn't match real Response object
const mockResponse = {
  json: () => Promise.resolve(data)
}; // Missing required properties!

// ✅ Solution: Create a helper function for proper response objects
const createMockResponse = (status: number, data: any): Response => {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers()
  } as unknown as Response;
};
```

### 4. Issue: Order of imports and mocks affecting types

```typescript
// 🚫 Problem: Mocking before imports loses type information
jest.mock('./myModule');
import { myFunction } from './myModule'; // Types may be incorrect!

// ✅ Solution: Import first, then mock
import { myFunction } from './myModule';
const mockFn = jest.fn();
jest.mock('./myModule', () => ({
  myFunction: mockFn
}));
```

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

There are two recommended patterns for testing API services:

#### Method 1: Direct Mock Implementation

```typescript
// Mock the entire module with inline implementation
jest.mock('../../services/api', () => ({
  myService: {
    getData: jest.fn(),
    updateData: jest.fn()
  }
}));

// Import after mocking
import { myService } from '../../services/api';

it('handles API errors gracefully', async () => {
  // Setup mock to simulate a network error
  (myService.getData as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

  // Call the service function and verify error handling
  await expect(myService.getData()).rejects.toThrow('Network error');
});
```

#### Method 2: Named Mock Functions (Preferred)

```typescript
// Create typed mock functions - no imports needed
const mockGetData = jest.fn<Promise<DataType>, [string]>();
const mockUpdateData = jest.fn<Promise<void>, [string, DataPayload]>();

// Mock the module with our named functions
jest.mock('../../services/api', () => ({
  myService: {
    getData: mockGetData,
    updateData: mockUpdateData
  }
}));

it('handles API errors gracefully', async () => {
  // Setup mock to simulate a network error
  mockGetData.mockRejectedValueOnce(new Error('Network error'));

  // Call the mock function directly - cleaner and better typed
  await expect(mockGetData('some-id')).rejects.toThrow('Network error');
});
```

This approach is cleaner because:
1. No unnecessary imports that create "unused import" warnings
2. Explicit typing of mock functions that matches the real API
3. Direct use of mock functions without type assertions
4. Follows Jest's module mocking pattern correctly

#### Testing with Fetch API

When mocking the Fetch API:

```typescript
// Mock global fetch
global.fetch = jest.fn();

// Create a helper for mock responses
const createMockResponse = (status: number, data: any): Response => {
  return {
    status,
    ok: status >= 200 && status < 300,
    json: jest.fn().mockResolvedValue(data),
    text: jest.fn().mockResolvedValue(JSON.stringify(data)),
    headers: new Headers()
  } as unknown as Response;
};

it('fetches data successfully', async () => {
  // Setup the mock response
  (global.fetch as jest.Mock).mockResolvedValueOnce(
    createMockResponse(200, { success: true, data: [1, 2, 3] })
  );
  
  // Call the service function
  const result = await myService.getData();
  
  // Verify the result
  expect(result).toEqual([1, 2, 3]);
  
  // Verify fetch was called correctly
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/data',
    expect.objectContaining({
      method: 'GET'
    })
  );
});
```