# 🎯 Didi Page-Aware Context System

## Overview

Didi now has **full page awareness** and can respond differently based on which page the user is currently viewing. This allows for much more contextual and helpful responses.

---

## 🚀 What's New

### **Before: Generic Context**
```javascript
ui_context: {
  page: 'terminal', // Always "terminal" regardless of actual page
  ...
}
```

### **After: Page-Specific Context**
```javascript
ui_context: {
  page: 'tokens',              // Actual page type
  pageType: 'token_listing',   // Specific page variant
  pathname: '/tokens',         // Full URL path
  pageSpecificContext: {       // Page-specific capabilities
    canSearch: true,
    canFilter: true,
    tools: ['token_lookup', 'price_analysis']
  }
}
```

---

## 📊 Page Context Mapping

### **Tokens Page** (`/tokens/*`)
```javascript
{
  page: 'tokens',
  pageType: 'token_listing',
  specificContext: {
    canSearch: true,
    canFilter: true,
    tools: ['token_lookup', 'price_analysis']
  }
}
```
**Didi can**: Help search tokens, analyze prices, explain token metrics

### **Contest Pages** (`/contest/*`)
```javascript
{
  page: 'contest',
  pageType: 'contest_lobby' | 'contest_results' | 'contest_detail',
  specificContext: {
    contestId: '123',
    canJoin: true,
    canViewPortfolios: true,
    tools: ['portfolio_lookup', 'contest_data']
  }
}
```
**Didi can**: Explain contest rules, show leaderboards, analyze portfolios

### **Landing Page** (`/`)
```javascript
{
  page: 'landing',
  pageType: 'homepage',
  specificContext: {
    showsMarketStats: true,
    showsHotTokens: true,
    tools: ['market_overview', 'trending_tokens']
  }
}
```
**Didi can**: Show trending tokens, explain platform features, market overview

### **Profile Pages** (`/profile/*`)
```javascript
{
  page: 'profile',
  pageType: 'private_profile' | 'public_profile',
  specificContext: {
    canEditProfile: true, // Only on private profile
    tools: ['user_stats', 'achievement_lookup']
  }
}
```
**Didi can**: Explain achievements, show user stats, help with profile settings

### **Admin Pages** (`/admin/*`)
```javascript
{
  page: 'admin',
  pageType: 'admin_dashboard',
  specificContext: {
    hasAdminAccess: true,
    tools: ['admin_tools', 'system_monitoring']
  }
}
```
**Didi can**: Help with admin tasks, system monitoring, user management

---

## 🎨 Example Responses by Page

### **On Tokens Page**
User: "Show me the top tokens"
Didi: "I can see you're browsing the tokens page. Here are the top performers currently displayed..."

### **On Contest Lobby**
User: "How do I win?"
Didi: "In this contest lobby, you need to select a portfolio that outperforms others. The current leader has +45.2%..."

### **On Landing Page**
User: "What is DegenDuel?"
Didi: "Welcome to DegenDuel! I see you're on our homepage. DegenDuel is a DeFi trading competition platform..."

---

## 🔧 Backend Requirements

### **What Backend Needs to Do**

1. **Read the enhanced ui_context fields**:
   - `page` - The main page category
   - `pageType` - Specific page variant
   - `pathname` - Full URL path
   - `pageSpecificContext` - Page-specific data and capabilities

2. **Include page context in system prompt**:
   ```javascript
   const systemPrompt = `You are Didi on DegenDuel.
   Current page: ${ui_context.page}
   Page type: ${ui_context.pageType}
   URL: ${ui_context.pathname}
   
   Page capabilities: ${JSON.stringify(ui_context.pageSpecificContext)}
   
   Tailor your responses to be helpful for this specific page context.`;
   ```

3. **Use page-specific tools**:
   - Check `pageSpecificContext.tools` array
   - Enable/disable tools based on current page
   - Prioritize relevant tools for the context

---

## 📝 Implementation Status

### **Frontend: ✅ COMPLETE**
- Page detection implemented
- Context generation working
- Sending full page context to backend

### **Backend: 🔄 NEEDS UPDATE**
Backend team needs to:
1. **Use the new ui_context fields** in system prompt
2. **Make Didi aware of current page** in responses
3. **Adjust tool selection** based on page context
4. **Test page-specific responses**

---

## 🚀 Benefits

1. **More Helpful Responses**: Didi knows what page you're on and can provide relevant help
2. **Context-Aware Tools**: Only suggests tools that make sense for current page
3. **Better User Experience**: No more generic responses when specific help is needed
4. **Smart Navigation**: Can guide users based on where they are
5. **Page-Specific Features**: Can explain features visible on current page

---

## 📊 Testing Examples

### **Test 1: Page Awareness**
```
Navigate to: /tokens
Ask Didi: "Where am I?"
Expected: "You're on the tokens page where you can browse and search for tokens..."
```

### **Test 2: Context-Specific Help**
```
Navigate to: /contest/lobby/123
Ask Didi: "How do I participate?"
Expected: "I see you're in contest lobby 123. To participate, you need to..."
```

### **Test 3: Tool Relevance**
```
Navigate to: /admin
Ask Didi: "Show me system status"
Expected: Uses admin_tools to show relevant system information
```

---

## 🎯 Next Steps

1. **Backend Integration**: Update AI service to use page context
2. **Testing**: Verify Didi responds differently on each page
3. **Enhancement**: Add more page-specific contexts as needed
4. **Documentation**: Update API docs with new context fields

---

*This makes Didi significantly more intelligent and helpful by understanding the user's current context!*