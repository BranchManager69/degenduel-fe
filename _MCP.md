# Frontend Implementation Guide - DegenDuel MCP Integration

## 🎯 **What This Is About**

The backend team has built an MCP (Model Context Protocol) server that lets AI assistants like Claude interact with DegenDuel. Now we need **frontend UI** so users can get their AI access tokens and connect their accounts.

## 📋 **What Frontend Needs to Build**

### **🔑 Primary Task: AI Access Token Management**

Add a new section to the **User Settings/Profile page** that lets users:
1. Generate their personal AI access token
2. Copy the token to clipboard
3. See instructions for using it with Claude Desktop
4. Regenerate token if needed

---

## **🎨 UI Component Specification**

### **Component: `MCPTokenSection`**
**Location**: Add to existing user settings/profile page

```jsx
// Example implementation - adapt to your design system
const MCPTokenSection = () => {
  const [token, setToken] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const fetchToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/mcp-token', {
        headers: { 'Authorization': `Bearer ${userSession.token}` }
      });
      const data = await response.json();
      setToken(data.mcp_token);
    } catch (error) {
      // Handle error with your existing error system
      console.error('Failed to fetch MCP token:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const copyToken = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const regenerateToken = async () => {
    // Call API to regenerate token
    setToken(null);
    await fetchToken();
  };
  
  return (
    <div className="mcp-token-section">
      <div className="section-header">
        <h3>🤖 AI Assistant Integration</h3>
        <p>Connect Claude or other AI assistants to your DegenDuel account for advanced trading analysis.</p>
      </div>
      
      {!token ? (
        <div className="token-generate">
          <button 
            onClick={fetchToken} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Generating...' : 'Get My AI Access Token'}
          </button>
        </div>
      ) : (
        <div className="token-display">
          <div className="token-field">
            <label>Your AI Access Token:</label>
            <div className="token-input-group">
              <input 
                type="password" 
                value={token} 
                readOnly 
                className="token-input"
                onClick={(e) => e.target.select()}
              />
              <button 
                onClick={copyToken} 
                className="btn-secondary"
              >
                {copied ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
          
          <div className="token-actions">
            <button 
              onClick={regenerateToken}
              className="btn-outline btn-small"
            >
              🔄 Regenerate Token
            </button>
          </div>
        </div>
      )}
      
      <MCPInstructions />
    </div>
  );
};
```

### **Component: `MCPInstructions`**
**Purpose**: Expandable help section

```jsx
const MCPInstructions = () => {
  const [showInstructions, setShowInstructions] = useState(false);
  
  return (
    <div className="mcp-instructions">
      <button 
        onClick={() => setShowInstructions(!showInstructions)}
        className="instructions-toggle"
      >
        {showInstructions ? '▼' : '▶'} How to use with Claude Desktop
      </button>
      
      {showInstructions && (
        <div className="instructions-content">
          <h4>Setup Instructions:</h4>
          <ol>
            <li>Copy your AI Access Token above</li>
            <li>Open Claude Desktop</li>
            <li>Go to Settings → MCP Servers</li>
            <li>Add this configuration:</li>
          </ol>
          
          <pre className="code-block">
{`{
  "mcpServers": {
    "degenduel": {
      "command": "node",
      "args": ["/path/to/mcp-server/server.js"],
      "env": {
        "USER_TOKEN": "paste_your_token_here"
      }
    }
  }
}`}
          </pre>
          
          <div className="feature-list">
            <h4>What you can do:</h4>
            <ul>
              <li>📊 Ask Claude to analyze your contest performance</li>
              <li>🔍 Search and analyze any Solana token</li>
              <li>📈 Get market overviews and price trends</li>
              <li>🏆 Compare your strategies with top performers</li>
              <li>💰 Execute trades through conversation</li>
            </ul>
          </div>
          
          <div className="example-prompts">
            <h4>Example prompts to try:</h4>
            <div className="prompt-examples">
              <div className="prompt">"Show me my current contest performance"</div>
              <div className="prompt">"What are the top trending tokens today?"</div>
              <div className="prompt">"Analyze the top performers in Contest #47"</div>
              <div className="prompt">"Find me some promising new tokens under $1M market cap"</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

---

## **🔗 Backend API Integration**

### **Required API Endpoint**
The backend team needs to create: `GET /api/user/mcp-token`

**Request:**
```javascript
fetch('/api/user/mcp-token', {
  headers: { 
    'Authorization': `Bearer ${userSession.token}` 
  }
})
```

**Expected Response:**
```json
{
  "success": true,
  "mcp_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "1 year",
  "instructions": "Use this token with AI assistants to access your DegenDuel data"
}
```

**Optional**: `POST /api/user/mcp-token/regenerate` for token regeneration

---

## **📱 Design Guidelines**

### **Visual Design**
- **Theme**: Match existing DegenDuel design system
- **Icons**: Use robot/AI themed icons (🤖, 🧠, ⚡)
- **Colors**: Consider using accent colors for the AI section
- **Layout**: Should fit naturally into existing settings page

### **UX Considerations**
- **Token Security**: Show token as password field by default
- **Copy Feedback**: Clear visual feedback when token is copied
- **Help Text**: Make instructions easily accessible but not overwhelming
- **Error States**: Handle API failures gracefully
- **Loading States**: Show progress when generating tokens

### **Responsive Design**
- **Mobile**: Ensure token input and copy button work on mobile
- **Tablet**: Instructions should be readable on medium screens
- **Desktop**: Full feature set with expanded instructions

---

## **🔧 Implementation Checklist**

### **Phase 1: Basic Token Display** ⭐ **HIGH PRIORITY**
- [ ] Add `MCPTokenSection` component to user settings
- [ ] Implement token fetch and display
- [ ] Add copy-to-clipboard functionality
- [ ] Style to match existing design system

### **Phase 2: Enhanced UX** ⭐ **MEDIUM PRIORITY**
- [ ] Add `MCPInstructions` expandable section
- [ ] Implement token regeneration
- [ ] Add loading and error states
- [ ] Include example prompts and feature list

### **Phase 3: Polish** ⭐ **LOW PRIORITY**
- [ ] Add animations/transitions
- [ ] Improve mobile experience
- [ ] Add usage analytics (optional)
- [ ] A/B test instruction formats

---

## **🚀 Where to Add This**

### **Suggested Page Locations**
1. **User Settings/Profile** (Recommended) - Fits naturally with other account settings
2. **Dashboard** - Could add a small "Connect AI" widget
3. **Help/Support** - As part of advanced features documentation

### **Navigation Consideration**
- Add "AI Integration" or "Connect AI Assistant" to settings menu
- Consider adding a small AI badge/icon to indicate the feature

---

## **⚠️ Important Notes**

### **Security Reminders**
- **Never log tokens** in console or analytics
- **Treat tokens like passwords** - use password input fields
- **Clear clipboard** after reasonable time (optional)
- **Warn users** about token security in UI

### **Backend Dependencies**
- This feature requires the backend MCP token service to be implemented first
- Database schema needs `mcp_token` field added to User model
- Backend team should provide the API endpoint before frontend work begins

### **Testing Considerations**
- **Mock the API** for development/testing
- **Test copy functionality** across different browsers
- **Verify token format** matches expected JWT structure
- **Test error scenarios** (network failures, invalid tokens)

---

## **📞 Coordination with Backend**

### **What Backend Provides**
- [x] MCP server running on port 3007
- [ ] JWT token generation service  
- [ ] Database schema with `mcp_token` field
- [ ] API endpoint `/api/user/mcp-token`
- [ ] Token validation and regeneration logic

### **What Frontend Provides**
- [ ] User interface for token management
- [ ] Clear instructions for Claude Desktop setup
- [ ] Proper token security handling
- [ ] Integration with existing user session management

**Estimated Development Time**: 4-6 hours for complete implementation

---

💡 **Questions?** Ask the backend team about API endpoint availability or any technical details about token format/security requirements.