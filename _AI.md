# 🚀 **Frontend AI Streaming Implementation Guide**

## **📡 Available Endpoints**

### **1. Primary Streaming Endpoint**
```
POST /api/ai/stream
```

### **2. Alternative Streaming Endpoint** 
```
POST /api/ai/response/stream
```

## **📤 Request Format**

### **Headers:**
```javascript
{
  "Content-Type": "application/json",
  "Accept": "text/event-stream"  // Important for SSE
}
```

### **Request Body:**
```javascript
{
  "messages": [
    {
      "role": "user",
      "content": "Hello! Can you tell me about DegenDuel?"
    }
  ],
  "context": "terminal",           // Required: "terminal", "chat", "support"
  "loadout": "default",           // Optional: "default", "trading", "creative", etc.
  "stream": true,                 // Optional: defaults to true for streaming endpoints
  "max_tokens": 400,              // Optional: defaults to loadout setting
  "temperature": 0.6              // Optional: defaults to loadout setting
}
```

## **📥 Response Format (Server-Sent Events)**

### **Event Stream Structure:**
```
data: {"type":"chunk","content":"Hello! ","delta":"Hello! "}

data: {"type":"chunk","content":"DegenDuel ","delta":"DegenDuel "}

data: {"type":"chunk","content":"is a ","delta":"is a "}

data: {"type":"function_call","function":{"name":"getTokenPrice","arguments":{"symbol":"DUEL"}}}

data: {"type":"function_result","result":{"price":"$0.42","change":"+5.2%"}}

data: {"type":"chunk","content":"trading platform ","delta":"trading platform "}

data: {"type":"done","usage":{"input_tokens":15,"output_tokens":45,"total_tokens":60}}
```

## **🎯 Frontend Implementation Example**

### **JavaScript/TypeScript:**
```javascript
async function streamAIResponse(prompt) {
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    },
    body: JSON.stringify({
      messages: [
        { role: 'user', content: prompt }
      ],
      context: 'terminal',
      loadout: 'default'
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // Keep incomplete line in buffer

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          handleStreamEvent(data);
        } catch (e) {
          console.warn('Failed to parse SSE data:', line);
        }
      }
    }
  }
}

function handleStreamEvent(data) {
  switch (data.type) {
    case 'chunk':
      // Append text to terminal
      appendToTerminal(data.delta);
      break;
      
    case 'function_call':
      // Show function being called
      showFunctionCall(data.function.name, data.function.arguments);
      break;
      
    case 'function_result':
      // Show function result
      showFunctionResult(data.result);
      break;
      
    case 'done':
      // Stream complete
      onStreamComplete(data.usage);
      break;
      
    case 'error':
      // Handle error
      onStreamError(data.error);
      break;
  }
}
```

### **React Hook Example:**
```javascript
import { useState, useCallback } from 'react';

export function useAIStreaming() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [response, setResponse] = useState('');
  const [error, setError] = useState(null);

  const streamMessage = useCallback(async (prompt) => {
    setIsStreaming(true);
    setResponse('');
    setError(null);

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: prompt }],
          context: 'terminal'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'chunk') {
                setResponse(prev => prev + data.delta);
              } else if (data.type === 'done') {
                setIsStreaming(false);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn('Parse error:', e);
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
      setIsStreaming(false);
    }
  }, []);

  return { streamMessage, isStreaming, response, error };
}
```

## **🎨 Terminal Integration Example**

```javascript
// Terminal component integration
function Terminal() {
  const { streamMessage, isStreaming, response } = useAIStreaming();
  const [input, setInput] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    
    // Add user message to terminal
    addToTerminal(`> ${input}`, 'user');
    
    // Start AI streaming
    await streamMessage(input);
    setInput('');
  };

  return (
    <div className="terminal">
      <div className="terminal-output">
        {/* Terminal history */}
        <div className="ai-response">
          {response}
          {isStreaming && <span className="cursor">▋</span>}
        </div>
      </div>
      
      <form onSubmit={handleSubmit}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Didi anything..."
          disabled={isStreaming}
        />
      </form>
    </div>
  );
}
```

## **🔧 Error Handling**

### **Common Error Responses:**
```javascript
// Service disabled
{ "type": "error", "error": "AI service is not available" }

// Rate limited
{ "type": "error", "error": "Rate limit exceeded", "retry_after": 60 }

// Invalid request
{ "type": "error", "error": "Invalid message format" }

// OpenAI API error
{ "type": "error", "error": "AI service token function error" }
```

## **⚡ Key Implementation Notes**

1. **Always set `Accept: text/event-stream`** header
2. **Handle partial JSON** in the buffer properly
3. **Show loading state** while streaming
4. **Implement retry logic** for network errors
5. **Parse each SSE event** separately
6. **Handle function calls** if using terminal context

This should give you everything you need to implement AI streaming in your frontend!
