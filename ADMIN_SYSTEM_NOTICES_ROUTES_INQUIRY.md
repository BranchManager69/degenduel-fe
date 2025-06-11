# Admin System Notices Routes - Location Inquiry

## Context
The frontend is trying to access admin endpoints for system notices management but receiving 404 errors. We need to locate where these routes were implemented.

## Frontend Expectations
The frontend is expecting these admin endpoints:
- `GET /api/admin/system-notices` - List all system notices
- `POST /api/admin/system-notices` - Create a new system notice
- `PUT /api/admin/system-notices/:id` - Update an existing system notice
- `DELETE /api/admin/system-notices/:id` - Delete a system notice
- `PATCH /api/admin/system-notices/:id/toggle-active` - Toggle active status

## Current Findings
1. ✅ The PUBLIC endpoint exists: `/api/system/system-notices/active` (in `/routes/system.js`)
2. ❌ The ADMIN endpoints are returning 404

## Leading Questions for Backend Team

### 1. Route File Location
**Question**: Did you create the admin system notices routes in a separate file, or did you add them to an existing admin routes file?

**Check these locations**:
- `/routes/admin/system-notices.js` (dedicated file?)
- `/routes/admin.js` (added to main admin routes?)
- `/routes/admin/system-settings.js` (added to system settings?)
- `/routes/admin/index.js` (consolidated admin routes?)

### 2. Route Registration
**Question**: Where did you register these admin routes in the main application? 

**Check**:
- In `app.js` or `server.js` - look for something like:
  ```javascript
  app.use('/api/admin/system-notices', systemNoticesRoutes);
  // or
  app.use('/api/admin', adminRoutes);
  ```

### 3. Controller Location
**Question**: Did you create a separate controller for admin system notices operations?

**Check these locations**:
- `/controllers/admin/systemNoticesController.js`
- `/controllers/adminController.js` (added methods here?)
- `/controllers/api/v1/adminSystemController.js`

### 4. Middleware Application
**Question**: Did you apply the correct admin authentication middleware to these routes?

**Expected pattern**:
```javascript
router.get('/system-notices', requireAuth, requireAdmin, async (req, res) => {
  // ... implementation
});
```

### 5. Database Operations
**Question**: Where did you implement the Prisma queries for these admin operations?

**Look for**:
- `prisma.system_notices.findMany()` (list all)
- `prisma.system_notices.create()` (create new)
- `prisma.system_notices.update()` (update existing)
- `prisma.system_notices.delete()` (delete)

### 6. Recent Commits
**Question**: Can you check your recent commits for when you added these admin routes?

**Git commands to help**:
```bash
# Search for system-notices in recent commits
git log --grep="system-notices" --oneline

# Search for files containing "system-notices" 
git grep -n "system-notices" -- "*.js"

# Check recent changes to admin routes
git log -p --since="1 week ago" -- routes/admin/
```

### 7. Testing Evidence
**Question**: Do you have any Postman collections, curl commands, or test files that show these endpoints working?

### 8. Alternative Implementation
**Question**: Is it possible you implemented these as WebSocket commands instead of REST endpoints? 

**Check**:
- WebSocket handlers for system notices
- Admin dashboard WebSocket events

## Quick Verification Steps

1. **Search entire backend for the routes**:
   ```bash
   grep -r "system-notices" /home/branchmanager/websites/degenduel/routes/
   ```

2. **Check if routes are behind a different path**:
   ```bash
   grep -r "findMany.*system_notices" /home/branchmanager/websites/degenduel/
   ```

3. **Look for the controller methods**:
   ```bash
   find /home/branchmanager/websites/degenduel -name "*.js" -exec grep -l "system_notices.*admin" {} \;
   ```

## Note to Backend Team
The frontend implementation is ready and tested. We just need to connect it to the correct backend endpoints. If these routes were implemented differently than expected, please provide:

1. The actual endpoint paths
2. The request/response format
3. Any special headers or authentication requirements

This will help us quickly update the frontend to match your implementation.