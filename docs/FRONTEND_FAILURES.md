# DegenDuel Frontend Failure Documentation

## Critical Issues

### API Connection (502 Bad Gateway)

- ❌ All API endpoints returning 502 Bad Gateway
- ❌ Port mismatch (56347 vs configured 3006)
- ❌ Proxy configuration issues
- ❌ Affected endpoints:
  - `/api/auth/session`
  - `/api/status`
  - `/api/contests`
  - `/api/tokens`
  - `/api/admin/maintenance/status`

### Authentication Loop

- ❌ Multiple simultaneous auth checks
- ❌ Session checks failing with 502
- ❌ Visibility/online status triggers causing duplicate checks

### Component Failures

- ❌ Header component failing to load contests
- ❌ TokenVerse failing to update token data
- ❌ ServiceStatusBanner failing to check service status
- ❌ Footer failing to check server status

## Error Log Examples

### API Gateway Failures

```log
GET http://localhost:56347/api/auth/session 502 (Bad Gateway)
GET http://localhost:56347/api/status 502 (Bad Gateway)
GET http://localhost:56347/api/contests 502 (Bad Gateway)
GET http://localhost:56347/api/tokens 502 (Bad Gateway)
```

### Component Errors

```log
Failed to load contests: Error: API Error: Bad Gateway
Failed to update token data: Error: API Error: Bad Gateway
Failed to check service status: Error: API Error: Bad Gateway
```

## Framework Warnings

- ⚠️ Multiple Three.js instances being imported
- ⚠️ Buffer module externalization
- ⚠️ React Router v7 migration warnings:
  - `v7_startTransition`
  - `v7_relativeSplatPath`
- ⚠️ Manifest syntax error
- ⚠️ Message port closed warnings

## Current State

- 🔴 API Gateway completely down (502 errors)
- 🔴 Authentication system broken
- 🔴 All data fetching failing
- 🔴 Component cascade failures
- 🔴 Multiple concurrent errors

## Environment Info

```
API_URL configuration in use: {
  environment: 'development',
  apiUrl: 'http://localhost:56347/api',
  wsUrl: 'ws://localhost:56347/portfolio',
  port: '3006',
  hostname: 'localhost'
}
```
