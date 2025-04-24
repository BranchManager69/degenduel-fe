# DegenDuel Testing Guide

## Overview

This guide outlines our testing strategy for both frontend and backend components of DegenDuel. It serves as a reference for implementing tests across different parts of the application.

## Frontend Testing

### Setup

1. **Dependencies**

   ```json
   {
     "devDependencies": {
       "@testing-library/jest-dom": "^6.6.3",
       "@testing-library/react": "^16.2.0",
       "jest": "^29.7.0",
       "ts-jest": "^29.2.5"
     }
   }
   ```

2. **Configuration Files**
   ```typescript
   // jest.config.ts
   {
     preset: "ts-jest",
     testEnvironment: "jsdom",
     setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
     // ... other config
   }
   ```

### Test Types

1. **Hook Tests**

   ```typescript
   import { renderHook, act } from "@testing-library/react";

   describe("useMyHook", () => {
     it("initializes correctly", () => {
       const { result } = renderHook(() => useMyHook());
       expect(result.current.value).toBe(expectedValue);
     });
   });
   ```

2. **Component Tests**

   ```typescript
   import { render, screen, fireEvent } from "@testing-library/react";

   describe("MyComponent", () => {
     it("renders correctly", () => {
       render(<MyComponent />);
       expect(screen.getByText("Expected Text")).toBeInTheDocument();
     });
   });
   ```

3. **Context Tests**

   ```typescript
   const wrapper = ({ children }) => (
     <MyContext.Provider value={mockValue}>{children}</MyContext.Provider>
   );

   const { result } = renderHook(() => useMyHook(), { wrapper });
   ```

### Mocking Strategies

1. **API Mocking**

   ```typescript
   jest.mock("../services/api", () => ({
     api: {
       fetch: jest.fn().mockImplementation((path) => {
         // Return mock responses based on path
       }),
     },
   }));
   ```

2. **LocalStorage Mocking**

   ```typescript
   const mockStorage = {
     getItem: jest.fn(),
     setItem: jest.fn(),
     removeItem: jest.fn(),
   };

   Object.defineProperty(window, "localStorage", { value: mockStorage });
   ```

3. **Router Mocking**
   ```typescript
   const wrapper = ({ children }) => (
     <MemoryRouter initialEntries={["/initial-route"]}>{children}</MemoryRouter>
   );
   ```

### Best Practices

1. **Test Structure**

   ```typescript
   describe("Feature", () => {
     beforeEach(() => {
       // Setup
     });

     afterEach(() => {
       // Cleanup
     });

     it("should do something", () => {
       // Test
     });
   });
   ```

2. **Async Testing**
   ```typescript
   it("handles async operations", async () => {
     await act(async () => {
       // Perform async action
     });

     expect(result).toBe(expected);
   });
   ```

## Backend Testing

### Integration Tests

1. **API Endpoint Testing**

   ```javascript
   describe("POST /api/referrals/conversion", () => {
     it("tracks conversion successfully", async () => {
       const response = await request(app)
         .post("/api/referrals/conversion")
         .send({
           referralCode: "TEST123",
           sessionId: "test-session",
         });

       expect(response.status).toBe(200);
       expect(response.body.success).toBe(true);
     });
   });
   ```

2. **Database Testing**
   ```javascript
   describe("Referral Repository", () => {
     beforeEach(async () => {
       await db.clear();
     });

     it("creates referral record", async () => {
       const result = await ReferralRepo.create({
         referrerCode: "TEST123",
         sessionId: "test-session",
       });

       expect(result).toBeDefined();
     });
   });
   ```

### Unit Testing Backend Services

```javascript
describe("ReferralService", () => {
  it("validates referral code", () => {
    const result = ReferralService.validateCode("TEST123");
    expect(result.isValid).toBe(true);
  });
});
```

## Test Coverage

### Coverage Goals

- Frontend Components: 70%
- Hooks: 80%
- Backend Services: 85%
- API Endpoints: 90%

### Running Coverage Reports

```bash
# Frontend
npm test -- --coverage

# Backend
npm run test:coverage
```

## Common Patterns

### 1. Testing Error States

```typescript
it("handles errors gracefully", async () => {
  // Mock API failure
  api.fetch.mockRejectedValueOnce(new Error("Network error"));

  // Verify error handling
  await expect(async () => {
    await result.current.someAction();
  }).not.toThrow();
});
```

### 2. Testing Loading States

```typescript
it("shows loading state", async () => {
  const { result } = renderHook(() => useMyHook());

  act(() => {
    result.current.startLoading();
  });

  expect(result.current.isLoading).toBe(true);
});
```

### 3. Testing User Interactions

```typescript
it("responds to user input", async () => {
  render(<MyComponent />);

  fireEvent.click(screen.getByRole("button"));

  expect(screen.getByText("Clicked!")).toBeInTheDocument();
});
```

## Tips for Writing Tests

1. **Test Isolation**

   - Each test should be independent
   - Reset state between tests
   - Mock external dependencies

2. **Meaningful Assertions**

   - Test behavior, not implementation
   - Focus on user-facing functionality
   - Include edge cases

3. **Maintainable Tests**
   - Keep tests simple and readable
   - Use descriptive test names
   - Group related tests together

## Debugging Tests

### Common Issues

1. **Async Testing Problems**

   - Use `act()` for state updates
   - Await async operations
   - Check for unhandled promises

2. **Context Issues**

   - Verify provider wrappers
   - Check context values
   - Test context updates

3. **Mock Issues**
   - Clear mocks between tests
   - Verify mock calls
   - Check mock implementations

## Resources

1. **Documentation**

   - [Jest Docs](https://jestjs.io/docs/getting-started)
   - [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
   - [Testing Library Queries](https://testing-library.com/docs/queries/about)

2. **Best Practices**
   - [Kent C. Dodds' Blog](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
   - [Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications)

## Next Steps

1. **Expanding Coverage**

   - Identify untested components
   - Add tests for critical paths
   - Implement integration tests

2. **Automation**

   - Set up CI/CD testing
   - Implement pre-commit hooks
   - Automate coverage reports

3. **Maintenance**
   - Regular test reviews
   - Update outdated tests
   - Refactor as needed
