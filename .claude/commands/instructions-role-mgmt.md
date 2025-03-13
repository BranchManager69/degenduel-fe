# Role Management Frontend Integration Instructions

Complete documentation for new Role Management endpoints, designed to solve the need of
superadmins being able to manage user roles in real time from the frontend.

## User Role Management API Documentation

Overview

The Role Management API allows superadmins to manage user roles in the DegenDuel platform. This includes viewing, updating, and in
emergency situations, revoking admin privileges.

Base URL

All endpoints are prefixed with: /api/admin/role

Authentication

All endpoints require:
- Valid JWT authentication via cookies
- Superadmin role privileges

## API Endpoints

### 1. List Users with Roles

Endpoint: GET /api/admin/role/list

Description: Retrieves a paginated list of users with their role information.

Query Parameters:
- role (optional): Filter by specific role (user, admin, or superadmin)
- page (optional): Page number for pagination (default: 1)
- limit (optional): Number of items per page (default: 20)
- search (optional): Search users by wallet address, username, or nickname

Success Response (200 OK):
{
"success": true,
"data": [
    {
    "id": 123,
    "wallet_address": "0x123...",
    "username": "user123",
    "nickname": "CryptoKing",
    "role": "admin",
    "created_at": "2023-01-01T00:00:00Z",
    "last_login": "2023-02-01T00:00:00Z",
    "is_banned": false
    },
    // More users...
],
"pagination": {
    "page": 1,
    "limit": 20,
    "totalItems": 45,
    "totalPages": 3
}
}

Error Responses:
- 401 Unauthorized: Invalid or missing authentication
- 403 Forbidden: User lacks superadmin privileges
- 500 Server Error:
{
"success": false,
"error": "Failed to get users"
}

### 2. Get User Role Details

Endpoint: GET /api/admin/role/:walletAddress

Description: Retrieves detailed information about a specific user's role, including role change history.

Path Parameters:
- walletAddress: The wallet address of the user

Success Response (200 OK):
{
"success": true,
"data": {
    "id": 123,
    "wallet_address": "0x123...",
    "username": "user123",
    "nickname": "CryptoKing",
    "role": "admin",
    "created_at": "2023-01-01T00:00:00Z",
    "last_login": "2023-02-01T00:00:00Z",
    "is_banned": false,
    "ban_reason": null,
    "user_stats": {
    "contests_entered": 10,
    "contests_won": 2,
    "total_prize_money": "500000000"
    },
    "admin_logs": [
    {
        "action": "GRANT_ADMIN",
        "created_at": "2023-01-15T00:00:00Z"
    },
    // More log entries...
    ]
}
}

Error Responses:
- 401 Unauthorized: Invalid or missing authentication
- 403 Forbidden: User lacks superadmin privileges
- 404 Not Found:
{
"success": false,
"error": "User not found"
}
- 500 Server Error:
{
"success": false,
"error": "Failed to get user details"
}

### 3. Update User Role

Endpoint: POST /api/admin/role/update

Description: Updates a user's role (promote to admin/superadmin or demote to user/admin).

Request Body:
{
"wallet_address": "0x123...",
"role": "admin",
"reason": "Promoted for moderation duties" // Optional, defaults to "Role updated by superadmin"
}

Success Response (200 OK):
{
"success": true,
"message": "User role updated to admin successfully",
"data": {
    "id": 123,
    "wallet_address": "0x123...",
    "username": "user123",
    "nickname": "CryptoKing",
    "role": "admin"
}
}

Error Responses:
- 400 Bad Request: Missing required parameters or invalid role
{
"success": false,
"error": "Wallet address and role are required"
}
- OR
{
"success": false,
"error": "Invalid role. Must be one of: user, admin, superadmin"
}
- 401 Unauthorized: Invalid or missing authentication
- 403 Forbidden: Attempting to downgrade own superadmin role
{
"success": false,
"error": "You cannot downgrade your own superadmin role"
}
- 404 Not Found: User not found
{
"success": false,
"error": "User not found"
}
- 500 Server Error:
{
"success": false,
"error": "Failed to update user role"
}

### 4. Emergency Revoke All Admin Privileges

Endpoint: POST /api/admin/role/revoke-all-admins

Description: Emergency endpoint to revoke all admin and superadmin privileges except for the current superadmin.

Request Body:
{
"confirmation": "CONFIRM_REVOKE_ALL_ADMINS",
"reason": "Security breach detected - emergency lockdown"
}

Success Response (200 OK):
{
"success": true,
"message": "Emergency admin revocation executed successfully",
"affected_users": 12,
"revoked_admins": 10,
"revoked_superadmins": 2
}

Error Responses:
- 400 Bad Request: Invalid confirmation code or insufficient reason
{
"success": false,
"error": "Invalid confirmation code. Must be \"CONFIRM_REVOKE_ALL_ADMINS\""
}
- OR
{
"success": false,
"error": "A detailed reason (minimum 10 characters) is required for this action"
}
- 401 Unauthorized: Invalid or missing authentication
- 403 Forbidden: User lacks superadmin privileges
- 500 Server Error:
{
"success": false,
"error": "Failed to execute emergency revocation"
}

## Important Notes for Frontend Developers

### 1. Role Change Tracking:
- All role changes are recorded in the admin_logs table
- The following action types are used:
    - GRANT_ADMIN: When promoting from user to admin
    - REVOKE_ADMIN: When demoting from admin to user
    - GRANT_SUPERADMIN: When promoting to superadmin (from any role)
    - REVOKE_SUPERADMIN: When demoting from superadmin (to any role)
    - ROLE_CHANGE: For other role changes
    - EMERGENCY_REVOKE_ALL_ADMINS: For emergency mass revocations

### 2. Security Safeguards:
- Superadmins cannot downgrade their own role (prevents accidental loss of access)
- Emergency revocation requires explicit confirmation code
- Detailed reasons are required for emergency actions
- The current superadmin making the request is never affected by emergency revocation

### 3. Pagination Implementation:
- The list endpoint supports standard pagination with page and limit parameters
- Response includes pagination metadata for implementing pagination controls

### 4. Implementation Recommendations:
- Create a user management dashboard with role filtering capabilities
- Include confirmation dialogs for role changes, especially for superadmin promotions
- Implement emergency revocation as a "break glass" feature with multiple confirmations

Ask any questions beforehand if you have any.