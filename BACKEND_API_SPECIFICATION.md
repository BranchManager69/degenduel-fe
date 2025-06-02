# Backend API Specification - Referral Sharing Endpoint

## Required Endpoint: POST /api/referrals/share

### Purpose
Track when users share contests through the referral system for analytics and gamification.

### Authentication
- **Required**: JWT token in Authorization header
- **Access**: Authenticated users only

### Request Format
```javascript
POST /api/referrals/share
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "platform": "twitter" | "discord" | "telegram",
  "referralCode": "FRIEND123",
  "contestId": "123",
  "contestName": "Epic Trading Battle"
}
```

### Response Formats

#### Success (200 OK)
```javascript
{
  "success": true,
  "message": "Share tracked successfully",
  "analytics": {
    "totalShares": 5,
    "platformShares": {
      "twitter": 2,
      "discord": 2,
      "telegram": 1
    }
  }
}
```

#### Error (400 Bad Request)
```javascript
{
  "success": false,
  "error": "Missing required fields",
  "required": ["platform", "referralCode", "contestId"]
}
```

#### Error (401 Unauthorized)
```javascript
{
  "success": false,
  "error": "Authentication required"
}
```

### Implementation Example (Node.js/Express)
```javascript
app.post('/api/referrals/share', authenticateToken, async (req, res) => {
  try {
    const { platform, referralCode, contestId, contestName } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!platform || !referralCode || !contestId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields",
        required: ["platform", "referralCode", "contestId"]
      });
    }

    // Log the share event
    await db.referralShares.create({
      userId,
      platform,
      referralCode,
      contestId,
      contestName,
      sharedAt: new Date()
    });

    // Get analytics for response
    const analytics = await db.referralShares.aggregate([
      { $match: { userId, referralCode } },
      { $group: { 
        _id: "$platform", 
        count: { $sum: 1 } 
      }}
    ]);

    res.json({
      success: true,
      message: "Share tracked successfully",
      analytics: {
        totalShares: analytics.reduce((sum, item) => sum + item.count, 0),
        platformShares: analytics.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
    });

  } catch (error) {
    console.error('Referral share tracking error:', error);
    res.status(500).json({
      success: false,
      error: "Internal server error"
    });
  }
});
```

### Database Schema (Optional)
```sql
CREATE TABLE referral_shares (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  platform VARCHAR(20) NOT NULL,
  referral_code VARCHAR(50) NOT NULL,
  contest_id VARCHAR(50) NOT NULL,
  contest_name VARCHAR(255),
  shared_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_referral_shares_user_code ON referral_shares(user_id, referral_code);
CREATE INDEX idx_referral_shares_contest ON referral_shares(contest_id);
```

### Notes
- This endpoint is for analytics only - no critical functionality depends on it
- If implementation is delayed, the frontend will gracefully handle 404 errors
- Consider implementing rate limiting (e.g., max 10 shares per minute per user)
- Platform analytics can be used for future gamification features

### Estimated Implementation Time
**15 minutes** - Simple logging endpoint with basic validation 