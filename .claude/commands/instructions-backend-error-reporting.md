# Instructions

## IMPORTANT

THESE INSTRUCTIONS ORIGINATE FROM THE ACTUAL BACKEND IMPLEMENTATION AND MUST BE FOLLOWED CLOSELY.

## Your Task

Implement the backend functionality.  Before creating any new pages or components, check to see if there are any that can be enhanced rather than starting anew.  If you have any questions, ask me beforehand.

# INSTRUCTIONS FROM BACKEND TEAM:

## Using the report-error endpoint

You can test the error reporting endpoint using curl or any HTTP client. Here's how to use it with curl:

```js
  curl -X POST http://localhost:3004/api/admin/websocket/report-error \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer YOUR_JWT_TOKEN" \
    -d '{
      "service": "/api/v69/ws/token-data",
      "error": "Test error message",
      "source": "admin_test"
    }'
```

  Replace YOUR_JWT_TOKEN with a valid admin JWT token. The response should look like:

```js
  {
    "success": true,
    "service": "/api/v69/ws/token-data",
    "error": "Test error message",
    "timestamp": "2025-03-11T12:34:56.789Z",
    "message": "Test error reported successfully"
  }
```

## Checking monitoring system:

  1. WebSocket Monitor: Connect to the monitor WebSocket at /api/v69/ws/monitor
  2. Admin Dashboard: Access your admin dashboard and navigate to system status/monitoring
  3. REST API: Use the errors endpoint (explained below)

## Retrieving errors through the API endpoint

You can retrieve errors using curl or any HTTP client:

### Get all recent errors (default limit of 20)
curl -X GET "http://localhost:3004/api/admin/websocket/errors" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

### Filter by source and limit to 5 errors
curl -X GET "http://localhost:3004/api/admin/websocket/errors?source=v69_websocket&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

### Filter by specific service
curl -X GET "http://localhost:3004/api/admin/websocket/errors?service=/api/v69/ws/token-data" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

The response will include the list of errors, their details, and counts:

```js
{
    "success": true,
    "errors": [
        {
        "service": "/api/v69/ws/token-data",
        "source": "admin_test",
        "status": "error",
        "error": "Test error message",
        "timestamp": "2025-03-11T12:34:56.789Z",
        "details": { ... },
        "metrics": { ... }
        },
        // More errors...
    ],
    "counts": {
        "total": 42,
        "filtered": 5,
        "bySource": {
        "v69_websocket": 25,
        "admin_test": 10,
        "websocket_server": 7
        }
    },
    "timestamp": "2025-03-11T12:35:00.000Z"
}
```

Here is a valid superadmin JWT for you to use:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXRfYWRkcmVzcyI6IkJQdVJoa2VDa29yN0R4TXJjUFZzQjRBZFc2UG1wNW9BQ2pWenBQYjcyTWhwIiwicm9sZSI6InN1cGVyYWRtaW4iLCJzZXNzaW9uX2lkIjoiNTYzMWJmMDg0ZjEyYmIxYzA2NTg0MmUwODQzN2FhNWEiLCJpYXQiOjE3NDE3NTE3NDYsImV4cCI6MTc0MTc1NTM0Nn0.fIZB0wti00zGn2knSNJv81Y0TjLr0eIk2dCi70b52WY
```