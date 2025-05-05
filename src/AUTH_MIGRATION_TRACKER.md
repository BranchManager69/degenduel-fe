# Authentication System Migration Tracker

Use this document to track the progress of migrating components from the old authentication system to the new unified system.

## Setup Tasks

- [x] Create AuthService.ts
- [x] Create UnifiedAuthContext.tsx
- [x] Create UnifiedWebSocketContext.tsx
- [x] Create route guard components
- [x] Create tests for new components
- [x] Create feature flag system
- [x] Create migration hook (useMigratedAuth)
- [x] Setup migration dashboard (AuthSystemTestPage)
- [x] Create feature toggle component (AuthSystemToggle)

## TypeScript Issues

- [x] Resolve file casing conflict between authService.ts and AuthService.ts (via services/index.ts)
- [x] Update User type to include auth-related properties
- [ ] Fix test mocking issues
- [ ] Remove unused variables

## Core Components

- [ ] Login functionality
  - [ ] LoginPage.tsx
  - [ ] ConnectWalletButton.tsx
  - [ ] LoginOptions.tsx
  - [ ] PrivyLoginButton.tsx
  - [ ] TwitterLoginButton.tsx

- [ ] Route guards
  - [x] Created AuthenticatedRoute.migrated.tsx
  - [x] Created AdminRoute.migrated.tsx
  - [x] Created SuperAdminRoute.migrated.tsx

## Pages By Section

### Authentication Pages

- [ ] LoginPage

### Public Pages

- [ ] LandingPage
- [ ] PublicProfile
- [ ] ContestPages
- [ ] TokensPages

### Authenticated Pages

- [ ] MyContestsPage
- [ ] MyPortfoliosPage
- [ ] NotificationsPage
- [ ] PrivateProfilePage
- [ ] WalletPage
- [ ] AffiliatePage
- [ ] ContestCreditsPage

### Admin Pages

- [ ] AdminDashboard
- [ ] ConnectionDebugger
- [ ] SystemReports
- [ ] VanityWalletManagementPage

### SuperAdmin Pages

- [ ] SuperAdminDashboard
- [ ] ServiceControlPage
- [ ] WalletMonitoring

## WebSocket Integration

- [ ] Update WebSocket hook imports
- [ ] Test WebSocket authentication
- [ ] Verify subscriptions work correctly

## Final Steps

- [ ] Remove old auth files
- [ ] Rename App.unified.tsx to App.tsx
- [ ] Run comprehensive tests
- [ ] Update documentation

### Admin Pages

- [x] AdminDashboard (Added AuthSystemTestPage link)
- [ ] ConnectionDebugger
- [ ] SystemReports
- [ ] VanityWalletManagementPage
- [x] Added AuthSystemTestPage (for migration testing)
- [x] Added AuthSystemTestPage to App.tsx routes

## Next Steps

See `AUTH_NEXT_STEPS.md` for detailed information on the next steps in the migration process.

## Migration Progress

| Category | Total Items | Completed | Percentage |
|----------|-------------|-----------|------------|
| Setup | 9 | 9 | 100% |
| TypeScript Issues | 4 | 2 | 50% |
| Core Components | 8 | 3 | 37.5% |
| Pages | 17 | 3 | 17.6% |
| WebSocket | 3 | 0 | 0% |
| Final Steps | 4 | 0 | 0% |
| **OVERALL** | **45** | **17** | **37.8%** |

## Notes

- When migrating a component, remember to:
  - Update import from `useAuth` to `useMigratedAuth`
  - Test with both feature flag settings
  - Update any references to `loading` to use `isLoading` (both available)
  - Update WebSocket imports if needed

## Last Updated

Date: 2025-05-05