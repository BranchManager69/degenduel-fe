# Authentication Refactor File Tree

The following file tree shows the current structure of the `src/` directory, highlighting files related to the authentication system refactor. Files are marked as follows:

- 🔴 **DELETE** - Old auth system files that will be deleted after migration
- 🟢 **NEW** - New unified auth system files
- 🟡 **UPDATE** - Existing files that need to be updated to use the new system
- ⚪ Unmarked files are not directly affected by the auth refactor

```
src/
├── App.tsx 🟡 UPDATE (Needs replacing with App.unified.tsx)
├── App.unified.tsx 🟢 NEW (Ready to replace App.tsx)
├── AUTH_IMPLEMENTATION_NOTES.md 🟢 NEW (Documentation for implementation)
├── AUTH_MIGRATION_PLAN.md 🟢 NEW (Migration roadmap)
├── auth-migration.md 🟢 NEW (Developer guide for migration)
├── components/
│   ├── admin/
│   ├── achievements/
│   ├── animated-background/
│   ├── animated-guys/
│   ├── auth/ 🟡 UPDATE (Components need to use new auth context)
│   │   ├── BiometricAuthButton.tsx
│   │   ├── BiometricCredentialManager.tsx
│   │   ├── ConnectWalletButton.mock.tsx
│   │   ├── ConnectWalletButton.tsx
│   │   ├── ConsolidatedLoginButton.tsx
│   │   ├── InviteCodeInput.tsx
│   │   ├── LoginOptions.mock.tsx
│   │   ├── LoginOptions.tsx
│   │   ├── LoginOptionsButton.tsx
│   │   ├── PrivyLoginButton.mock.tsx
│   │   ├── PrivyLoginButton.tsx
│   │   ├── README.md
│   │   ├── TwitterLoginButton.mock.tsx
│   │   ├── TwitterLoginButton.tsx
│   │   └── WalletDebugger.tsx
│   ├── routes/ 🟡 UPDATE (Route guards need to use new auth context)
│   │   ├── AdminRoute.test.tsx
│   │   ├── AdminRoute.tsx 🟡 UPDATE (To be replaced by AdminRoute.unified.tsx)
│   │   ├── AdminRoute.unified.tsx 🟢 NEW (New route guard implementation)
│   │   ├── AdminRoute.unified.test.tsx 🟢 NEW (Tests for new route guard)
│   │   ├── AuthenticatedRoute.test.tsx
│   │   ├── AuthenticatedRoute.tsx 🟡 UPDATE (To be replaced by AuthenticatedRoute.unified.tsx)
│   │   ├── AuthenticatedRoute.unified.tsx 🟢 NEW (New route guard implementation)
│   │   ├── AuthenticatedRoute.unified.test.tsx 🟢 NEW (Tests for new route guard)
│   │   ├── MaintenanceGuard.tsx
│   │   ├── SuperAdminRoute.tsx 🟡 UPDATE (To be replaced by SuperAdminRoute.unified.tsx)
│   │   └── SuperAdminRoute.unified.tsx 🟢 NEW (New route guard implementation)
│   ├── shared/
│   ├── templates/
│   ├── toast/
│   ├── ui/
│   └── ... (other component directories)
├── config/
│   ├── adminPages.ts
│   ├── config.ts
│   └── env.ts
├── constants/
│   ├── fonts.ts
│   └── rates.ts
├── contexts/
│   ├── AuthContext.mock.ts 🔴 DELETE (Old auth context mock)
│   ├── AuthContext.test.tsx 🔴 DELETE (Old auth context tests)
│   ├── AuthContext.tsx 🔴 DELETE (Old auth context implementation)
│   ├── ContestContext.tsx
│   ├── PrivyAuthContext.mock.ts 🔴 DELETE (Old Privy auth context mock)
│   ├── PrivyAuthContext.tsx 🔴 DELETE (Old Privy auth context implementation)
│   ├── SolanaConnectionContext.tsx
│   ├── TokenDataContext.tsx
│   ├── TwitterAuthContext.tsx 🔴 DELETE (Old Twitter auth context implementation)
│   ├── UnifiedAuthContext.test.tsx 🟢 NEW (Tests for new unified auth context)
│   ├── UnifiedAuthContext.tsx 🟢 NEW (New unified auth context implementation)
│   ├── UnifiedWebSocketContext.test.tsx 🟢 NEW (Tests for new unified WebSocket context)
│   ├── UnifiedWebSocketContext.tsx 🟢 NEW (New unified WebSocket context implementation)
│   └── WebSocketContext.tsx 🔴 DELETE (Old WebSocket context implementation)
├── examples/
│   ├── AuthMigrationExample.tsx 🟢 NEW (Example showing migration in practice)
│   └── ... (other example files)
├── hooks/
│   ├── __HOOKS_MIGRATION_README.md
│   ├── __mocks__/
│   ├── useAffiliateSystem.ts
│   ├── useAuth.mock.ts 🔴 DELETE (Old auth hook mock)
│   ├── useAuth.test.ts 🔴 DELETE (Old auth hook tests)
│   ├── useAuth.ts 🔴 DELETE (Old auth hook implementation)
│   ├── useBaseWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│   ├── useBiometricAuth.ts 🟡 UPDATE (Will need to use the new auth service)
│   ├── useDebounce.ts
│   ├── useEnhancedAnalytics.ts
│   ├── useEnhancedDiagnostics.ts
│   ├── useInterval.ts
│   ├── useInviteSystem.ts
│   ├── useJupiterWallet.ts 🟡 UPDATE (Will need to use the new auth context)
│   ├── useReferral.test.tsx
│   ├── useReferral.ts
│   ├── useScrollFooter.ts
│   ├── useScrollHeader.ts
│   ├── useScrollTicker.ts
│   ├── useScrollbarVisibility.ts
│   ├── useSolanaTokenData.ts
│   ├── useSolanaWallet.ts 🟡 UPDATE (Will need to use the new auth context)
│   ├── useSolanaWalletData.ts
│   ├── useStandardizedTokenData.ts
│   ├── useTokenData.ts
│   ├── useUserContests.ts
│   ├── useWebSocketMonitor.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│   └── websocket/
│       ├── README.md
│       ├── V69_WEBSOCKET_HOOKS_REFERENCE.md
│       ├── __WEBSOCKET_STANDARDIZATION_GUIDE.md
│       ├── index.ts
│       ├── topic-hooks/ 🟡 UPDATE (Will need to use the new WebSocket context)
│       │   ├── useAchievements.ts
│       │   ├── useAnalytics.ts
│       │   ├── useCircuitBreaker.ts
│       │   ├── useContestChat.ts
│       │   ├── useContestScheduler.ts
│       │   ├── useContests.ts
│       │   ├── useLiquiditySim.ts
│       │   ├── useMarketData.ts
│       │   ├── useNotifications.ts
│       │   ├── usePortfolio.ts
│       │   ├── useRPCBenchmark.ts
│       │   ├── useServerStatus.ts
│       │   ├── useService.ts
│       │   ├── useSkyDuel.ts
│       │   ├── useSolanaBalance.ts
│       │   ├── useSystemSettings.ts
│       │   ├── useTerminalData.ts
│       │   ├── useTokenBalance.ts
│       │   ├── useTokenData.ts
│       │   ├── useVanityDashboard.ts
│       │   └── useWallet.ts
│       ├── types.ts
│       ├── useAchievementWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useAnalyticsWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useCircuitBreakerSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useContestChatWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useContestWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useNotificationWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── usePortfolioWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useRPCBenchmarkWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useServerStatusWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useServiceWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useSkyDuelWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useSystemSettingsWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useUnifiedWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useWalletWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       ├── useWebSocket.ts 🟡 UPDATE (Will need to use the new WebSocket context)
│       └── useWebSocketTopic.ts 🟡 UPDATE (Will need to use the new WebSocket context)
├── pages/ 🟡 UPDATE (All pages that use auth will need updating)
│   ├── admin/
│   │   ├── AdminChatDashboard.tsx
│   │   ├── AdminDashboard.tsx
│   │   ├── AdminDashboardExample.tsx
│   │   ├── AiTesting.tsx
│   │   ├── ClientErrorsPage.tsx
│   │   ├── ConnectionDebugger.tsx
│   │   ├── ContestImageBrowserPage.tsx
│   │   ├── ContestImageGeneratorPage.tsx
│   │   ├── ContestSchedulerPage.tsx
│   │   ├── ExamplePage.tsx
│   │   ├── LiquiditySimulatorPage.tsx
│   │   ├── LogForwarderDebug.tsx
│   │   ├── SkyDuelPage.tsx
│   │   ├── SystemReports.tsx
│   │   ├── VanityWalletManagementPage.tsx
│   │   ├── WalletManagementPage.tsx
│   │   ├── WebSocketHub.tsx
│   │   ├── WebSocketTesting.tsx
│   │   └── ip-ban/
│   │       └── IpBanManagementPage.tsx
│   ├── authenticated/ 🟡 UPDATE (Will need to use the new auth context)
│   │   ├── AffiliatePage.tsx
│   │   ├── ContestCreditsPage.tsx
│   │   ├── MyContestsPage.tsx
│   │   ├── MyPortfoliosPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── PortfolioTokenSelectionPage.tsx
│   │   ├── PrivateProfilePage.tsx
│   │   └── WalletPage.tsx
│   ├── examples/
│   │   ├── AdminChatExample.tsx
│   │   ├── ContestChatExample.tsx
│   │   ├── FloatingChatExample.tsx
│   │   └── SuperAdminChatExample.tsx
│   ├── public/
│   │   ├── WebSocketAPIPage.tsx
│   │   ├── contests/
│   │   │   ├── ContestBrowserPage.tsx
│   │   │   ├── ContestDetailPage.tsx
│   │   │   ├── ContestDetailPage.tsx.new
│   │   │   ├── ContestLobbyPage.tsx
│   │   │   └── ContestResultsPage.tsx
│   │   ├── game/
│   │   │   └── VirtualAgent.tsx
│   │   ├── general/
│   │   │   ├── BannedIP.tsx
│   │   │   ├── BannedUser.tsx
│   │   │   ├── BiometricAuthDemo.tsx 🟡 UPDATE (Will need to use the new auth context)
│   │   │   ├── BlinksDemo.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── FAQ.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx 🟡 UPDATE (Will need to use the new auth context)
│   │   │   ├── Maintenance.tsx
│   │   │   ├── NotFound.tsx
│   │   │   ├── PublicProfile.tsx
│   │   │   ├── SolanaBlockchainDemo.tsx
│   │   │   └── WebSocketAPITestPage.tsx
│   │   ├── leaderboards/
│   │   │   ├── ContestPerformanceRankings.tsx
│   │   │   ├── DegenLevelPage.tsx
│   │   │   ├── GlobalRankings.tsx
│   │   │   └── LeaderboardLanding.tsx
│   │   └── tokens/
│   │       ├── EnhancedTokensPage.tsx
│   │       ├── OptimizedTokensPage.tsx
│   │       ├── StoryTokensPage.tsx
│   │       ├── TokensPage.tsx
│   │       ├── TokensStandardizedTestPage.tsx
│   │       └── whitelist.tsx
│   └── superadmin/
│       ├── AmmSim.tsx
│       ├── AmmSimulation.tsx
│       ├── ApiPlayground.tsx
│       ├── CircuitBreakerPage.tsx
│       ├── ControlPanelHub.tsx
│       ├── ServiceCommandCenter.tsx
│       ├── ServiceControlPage.tsx
│       ├── ServiceSwitchboard.tsx
│       ├── SuperAdminDashboard.tsx
│       ├── WalletMonitoring.tsx
│       ├── WebSocketMonitoringHub.tsx
│       ├── WssPlayground.tsx
│       └── next-gen/
│           ├── UserAnalytics.tsx
│           └── UserDiagnostics.tsx
├── services/
│   ├── BIOMETRIC_AUTH_DOCUMENTATION.md
│   ├── AuthService.test.ts 🟢 NEW (Tests for new auth service)
│   ├── AuthService.ts 🟢 NEW (New unified auth service)
│   ├── BiometricAuthService.ts 🟡 UPDATE (Will need to use the new auth service)
│   ├── TokenManager.ts 🟡 UPDATE (May need improvements for the new auth system)
│   ├── adminService.ts
│   ├── ai.ts
│   ├── api/
│   │   ├── admin.test.ts
│   │   ├── admin.ts
│   │   ├── ai.d.ts
│   │   ├── auth.test.ts
│   │   ├── auth.ts 🟡 UPDATE (May need updates for the new auth system)
│   │   ├── balance.ts
│   │   ├── contests.test.ts
│   │   ├── contests.ts
│   │   ├── index.ts
│   │   ├── portfolio.ts
│   │   ├── stats.ts
│   │   ├── tokens.ts
│   │   ├── transactions.ts
│   │   ├── users.ts
│   │   ├── utils.mock.test.ts
│   │   ├── utils.test.ts
│   │   └── utils.ts
│   ├── authService.ts 🔴 DELETE (Old auth service implementation)
│   ├── authenticationService.ts 🔴 DELETE (Old authentication service implementation)
│   ├── clientLogService.ts
│   ├── contestService.ts
│   ├── contractAddressService.ts
│   ├── dd-api.test.ts
│   ├── dd-api.ts
│   ├── dexscreener.ts
│   ├── index.ts 🟢 NEW (Service exports file)
│   ├── releaseDateService.ts
│   ├── systemReportsService.ts
│   ├── terminalDataService.ts
│   └── userService.ts
├── store/
│   ├── __mocks__/
│   │   └── useStore.ts
│   └── useStore.ts 🟡 UPDATE (Will need to be compatible with the new auth system)
├── styles/
│   ├── color-schemes.css
│   ├── debug.css
│   ├── index.css
│   └── utilities.css
├── tests/
│   └── authFlow.test.tsx 🟡 UPDATE (Will need to use the new auth system)
├── types/
│   ├── admin.ts
│   ├── clientErrors.ts
│   ├── contest.ts
│   ├── degenduel-shared.d.ts
│   ├── index.ts
│   ├── leaderboard.ts
│   ├── log.ts
│   ├── profile.ts
│   ├── referral.types.ts
│   ├── shared-types.ts
│   ├── sort.ts
│   ├── systemReports.ts
│   ├── user.ts 🟡 UPDATE (Updated to include new auth-related properties)
│   └── window.d.ts
└── ... (other files)
```

## Migration Statistics

- 🟢 **NEW Files**: 12 new files implementing the unified auth system
- 🔴 **DELETE Files**: 8 files from the old auth system to be removed after migration
- 🟡 **UPDATE Files**: 43+ files that need updating to use the new auth system

## Migration Priority Groups

### High Priority
1. Core auth hooks in components (login/logout functionality)
2. Route guards (AuthenticatedRoute, AdminRoute, SuperAdminRoute)
3. Login page and authentication flows

### Medium Priority
1. WebSocket-related hooks and components
2. Admin and authenticated pages
3. User profile and wallet components

### Low Priority
1. Non-critical components that use auth state
2. Utility functions and helpers
3. Test files