# Ban on Sight Feature Documentation

## Overview

The "Ban on Sight" feature enhances admin moderation capabilities by allowing administrators to quickly ban users directly from user profiles, activity logs, and monitoring panels without having to navigate to a separate ban management interface. This creates a more efficient moderation workflow for quickly addressing problematic users.

## Components

### 1. BanOnSightButton

A versatile button component with two variants:
- **Button variant**: Full text button with "Ban on Sight" label
- **Icon variant**: Compact circular icon with ban symbol

```tsx
<BanOnSightButton
  user={{
    wallet_address: "user_wallet_address",
    nickname: "optional_user_nickname",
    is_banned: false // Current ban status
  }}
  size="md" // sm, md, lg
  variant="button" // button or icon
  onSuccess={() => {}} // Callback after successful ban
/>
```

### 2. BanIPButton

Similar component for banning IP addresses directly from admin interfaces:

```tsx
<BanIPButton
  ipAddress="123.45.67.89"
  size="md" // sm, md, lg
  variant="button" // button or icon
  onSuccess={() => {}} // Callback after successful ban
/>
```

## Integration Points

The "Ban on Sight" functionality has been integrated in the following locations:

1. **Public User Profiles**
   - Button appears on user profile pages for admins
   - Allows immediate banning when viewing suspicious user profiles
   - Only visible to users with admin permissions

2. **Activity Monitor & Logs**
   - Ban buttons appear inline in activity tables
   - Associated with specific user actions
   - Ban IP buttons for IP addresses in logs

3. **User Activity Map**
   - Ban buttons appear when hovering over active users
   - Located in admin monitoring panels

## Implementation Details

- The ban functionality uses the existing ban API endpoints
- Same ban modal is used as in the dedicated ban management page
- Role-based visibility ensures only admins can see ban buttons
- Success callbacks refresh the current view after ban action

## Benefits

- Reduced moderation time by eliminating navigation to dedicated ban interface
- Contextual banning where suspicious activity is first observed
- Consolidated user experience with consistent ban UI across the platform
- Built-in IP ban capability for targeting entire malicious networks

## Permissions

Only users with ADMIN or SUPERADMIN roles can see and use the Ban on Sight buttons.

## Technical Decisions

1. **Component Reusability**  
   The BanOnSightButton is designed to be highly reusable and can be placed in any component that displays user information.

2. **Admin Permission Check**  
   The component relies on the current user's role from the application store to determine if the ban buttons should be visible.

3. **Success Callback Pattern**  
   Each component accepts an onSuccess callback to allow the parent component to refresh or update after a successful ban action.

4. **Error Handling**  
   Ban errors are displayed within the modal and don't disrupt the parent component's UI flow.

## Future Enhancements

1. **Enhanced contextual information**  
   Future updates could include more context in the ban modal, such as user's recent actions or past violations.

2. **Temporary ban options**  
   Add quick selection for temporary ban durations (1 day, 1 week, etc.).

3. **Auto-suggested ban reasons**  
   Based on the context where the ban button was clicked, suggest appropriate ban reasons.

4. **Quick ban options**  
   Shortcuts for common ban scenarios with pre-filled reasons.

5. **Audit logging**  
   Enhanced audit logging specific to the ban on sight feature to track where bans are being initiated.