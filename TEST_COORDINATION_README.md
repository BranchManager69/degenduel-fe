# 🗡️ Duel Test Coordination - Quick Start

## Overview
This guide helps coordinate comprehensive duel (contest) testing between frontend and backend teams.

## Quick Commands

### For Frontend Team
```bash
# Run full coordinated test suite
npm run test:duel:coordinate

# Run individual phases
npm run test:duel:setup     # Pre-test setup only
npm run test:duel:phase1    # Basic contest flow
npm run test:duel:phase2    # Stress testing
npm run test:duel:phase3    # Error scenarios
npm run test:duel:phase4    # Integration points

# Run existing contest tests
npm run test:contest-flow
npm run test:contest-flow:free
npm run test:tokens
```

### For Backend Team
Recommended monitoring commands during test:
```bash
# Monitor API logs
tail -f /var/log/degenduel-api.log

# Monitor database performance
watch -n 5 'mysql -e "SHOW PROCESSLIST" degenduel_db'

# Monitor WebSocket connections
netstat -an | grep :3001  # or your WS port

# Monitor system resources
htop
```

## Test Schedule (Suggested)
```
10:00 AM - 📋 Pre-test setup and verification
10:30 AM - 🎯 Phase 1: Basic contest flow (30 min)
11:00 AM - 💪 Phase 2: Stress testing (45 min)  
11:45 AM - ⚠️  Phase 3: Error scenarios (30 min)
12:15 PM - 🔗 Phase 4: Integration testing (30 min)
12:45 PM - 📊 Post-test review and reporting
```

## What Gets Tested

### ✅ Frontend Responsibilities
- Contest browser and discovery
- Portfolio selection interface
- Real-time UI updates
- WebSocket connection handling
- Wallet integration
- Error message display

### ✅ Backend Responsibilities  
- Contest creation and management APIs
- Real-time portfolio calculations
- WebSocket message broadcasting
- Database performance under load
- Payment processing
- Prize distribution

### ✅ Integration Points
- API response times and data format
- WebSocket event synchronization
- Solana blockchain integration
- Price feed accuracy
- Database consistency

## Communication During Test

### Slack Channels
- Create: `#duel-test-coordination`
- Use: Real-time updates and issue reporting

### Shared Documents
- **Test Plan**: `FULL_DUEL_TEST_PLAN.md`
- **Issue Tracking**: Google Doc or GitHub Issues
- **Results**: Auto-generated test reports

### Status Updates
Every 15 minutes during active testing:
- Frontend: UI state, user flow progress
- Backend: Server performance, database load
- Issues: Any blockers or unexpected behavior

## Key Metrics to Watch

### Performance Targets
- **API Response**: < 3 seconds
- **WebSocket Latency**: < 1 second  
- **Page Load**: < 5 seconds
- **Contest Creation**: < 2 seconds
- **Portfolio Calculation**: < 1 second

### Load Targets
- **Concurrent Users**: 20+ simultaneous
- **Contest Participants**: 10+ per contest
- **WebSocket Connections**: Stable during 30+ min sessions

## Emergency Protocols

### If Critical Issues Arise
1. **Stop current phase** immediately
2. **Document the issue** with:
   - Exact time and test case
   - Frontend UI state
   - Backend logs
   - Browser console errors
   - WebSocket message logs
3. **Triage severity**:
   - 🔴 Critical: Blocks all testing
   - 🟡 High: Affects major functionality  
   - 🟢 Medium: Minor issues, can continue
4. **Decide**: Fix now or document for later

### Rollback Plan
If issues require immediate fixes:
- Frontend: Git checkout to last stable commit
- Backend: Revert to previous deployment
- Database: Have backup/restore plan ready

## Quick Troubleshooting

### Common Issues
```bash
# WebSocket connection fails
Check: WS_URL environment variable
Check: Backend WebSocket server running
Check: Firewall/proxy settings

# API calls timeout
Check: API_URL environment variable  
Check: Backend API server running
Check: Database connectivity
Check: Network latency

# Test data conflicts
Run: npm run test:duel:setup
Clear: Browser cache and localStorage
Reset: Test database to clean state
```

### Logs to Share
When reporting issues, include:
- **Frontend**: Browser console logs
- **Backend**: API server logs + database logs
- **WebSocket**: Connection and message logs
- **Network**: Chrome DevTools Network tab
- **Test Script**: Output from test coordinator

## Success Criteria

### Must Pass Before Production
- ✅ Users can create and join contests
- ✅ Real-time portfolio tracking works
- ✅ WebSocket connections remain stable
- ✅ Payment processing works (paid contests)
- ✅ Results calculation is accurate
- ✅ System handles concurrent users gracefully

### Performance Must Meet
- ✅ All API responses < 3 seconds
- ✅ WebSocket messages < 1 second latency
- ✅ System supports 20+ concurrent users
- ✅ No memory leaks in 30+ minute sessions

## Post-Test Actions

### Immediate (Same Day)
1. Prioritize and assign found issues
2. Generate comprehensive test report
3. Plan hot fixes for critical issues
4. Schedule follow-up testing if needed

### Follow-up (2-3 Days)
1. Verify critical fixes work
2. Update documentation
3. Plan production deployment
4. Set up enhanced monitoring

---

## Questions?

**Frontend Team**: Check existing test files in `src/tests/contest-flow/`  
**Backend Team**: What monitoring tools will you use?  
**DevOps**: Infrastructure ready for load testing?  
**QA**: What additional scenarios should we test?

**Ready to test?** Run `npm run test:duel:coordinate` and let's go! 🚀 