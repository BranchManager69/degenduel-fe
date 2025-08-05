# AI Analysis Notifications - Frontend Implementation Guide

## Overview
The AI service broadcasts real-time analysis notifications that admin users can receive via WebSocket. Here's exactly how to implement this.

## Message Structure
The AI service sends messages with this structure:
```javascript
{
  type: 'ROLE_BROADCAST',
  category: 'ai_analysis',
  action: 'new_admin_action_analysis' | 'new_error_analysis' | 'new_service_log_analysis',
  data: {
    id: 123,
    summary: "AI analysis summary...",
    analyzed_at: "2025-08-05T08:34:55.082Z",
    action_count: 157270, // or error_count, log_count
    top_actions: [...] // varies by analysis type
  }
}
```

## Implementation Steps

### Step 1: Add Message Handler to WebSocket Context

In `src/contexts/UnifiedWebSocketContext.tsx`, add handler for AI analysis messages:

```typescript
// Add to the message handler switch statement
case 'ROLE_BROADCAST':
  if (message.category === 'ai_analysis') {
    handleAIAnalysisNotification(message);
  }
  break;

// Add the handler function
const handleAIAnalysisNotification = (message: any) => {
  const { action, data } = message;
  
  // Create notification based on analysis type
  let notificationTitle = '';
  let notificationMessage = '';
  
  switch (action) {
    case 'new_admin_action_analysis':
      notificationTitle = '🔐 Admin Activity Analysis';
      notificationMessage = `${data.action_count} admin actions analyzed`;
      break;
    case 'new_error_analysis':
      notificationTitle = '🚨 Client Error Analysis';
      notificationMessage = `${data.error_count} errors analyzed`;
      break;
    case 'new_service_log_analysis':
      notificationTitle = '🛠️ Service Log Analysis';
      notificationMessage = `${data.log_count} logs analyzed for ${data.service}`;
      break;
  }
  
  // Show toast notification
  showToast({
    title: notificationTitle,
    message: notificationMessage,
    type: 'info',
    duration: 10000,
    data: data // Include full data for click handler
  });
  
  // Store in admin notifications list
  addAdminNotification({
    id: data.id,
    type: action,
    title: notificationTitle,
    summary: data.summary,
    timestamp: data.analyzed_at,
    data: data
  });
};
```

### Step 2: Create Admin Notification Component

Create `src/components/admin/AIAnalysisNotifications.tsx`:

```typescript
import React, { useState } from 'react';
import { useUnifiedWebSocket } from '../../contexts/UnifiedWebSocketContext';

interface AIAnalysisNotification {
  id: number;
  type: string;
  title: string;
  summary: string;
  timestamp: string;
  data: any;
}

export const AIAnalysisNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<AIAnalysisNotification[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<AIAnalysisNotification | null>(null);

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4">🤖 AI Analysis Notifications</h3>
      
      {notifications.length === 0 ? (
        <p className="text-gray-500">No AI analyses received yet</p>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className="border rounded p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => setSelectedNotification(notification)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {notification.summary.substring(0, 100)}...
                  </p>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal for full analysis */}
      {selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-semibold">{selectedNotification.title}</h3>
              <button 
                onClick={() => setSelectedNotification(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap bg-gray-50 p-4 rounded">
                {selectedNotification.summary}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

### Step 3: Add to Admin Dashboard

In your admin dashboard page, add:

```typescript
import { AIAnalysisNotifications } from '../components/admin/AIAnalysisNotifications';

// In your admin dashboard component
<AIAnalysisNotifications />
```

### Step 4: Ensure WebSocket Authentication

Make sure your WebSocket connection includes admin authentication so you receive ROLE_BROADCAST messages:

```typescript
// In UnifiedWebSocketContext, ensure auth token is sent
const connectWebSocket = () => {
  const authToken = getAuthToken(); // Your auth token
  // WebSocket connection should include this token
};
```

## Testing

To test notifications:
1. Run the AI analysis test: `node test-all-ai-analyzers.js`  
2. Check browser console for WebSocket messages
3. Verify notifications appear in admin interface

## Message Types Reference

### Admin Action Analysis
```javascript
{
  category: 'ai_analysis',
  action: 'new_admin_action_analysis',
  data: {
    id: 65,
    summary: "Summary of Admin Activity...",
    analyzed_at: "2025-08-05T08:34:55.082Z",
    action_count: 157270,
    top_actions: [
      { action: "WALLET_RECLAIM_CYCLE_START", count: 68789 }
    ]
  }
}
```

### Client Error Analysis  
```javascript
{
  category: 'ai_analysis', 
  action: 'new_error_analysis',
  data: {
    id: 932,
    summary: "Summary of Client Errors...",
    analyzed_at: "2025-08-05T08:34:42.388Z", 
    error_count: 4,
    severity_distribution: { "error": 3, "warning": 1 }
  }
}
```

### Service Log Analysis
```javascript
{
  category: 'ai_analysis',
  action: 'new_service_log_analysis', 
  data: {
    id: 712,
    service: "discord_notification_service",
    summary: "Analysis of service logs...",
    analyzed_at: "2025-08-05T08:34:42.388Z",
    log_count: 346,
    health_status: "healthy"
  }
}
```