# WebSocket Compression Issue

## Problem

Modern browsers automatically request WebSocket compression via the `Sec-WebSocket-Extensions: permessage-deflate` header during connection handshake. This can cause issues with WebSocket connections including:

1. Increased CPU usage
2. Memory leaks
3. Performance degradation with certain types of data
4. Connection stability issues

We've discovered that our frontend is affected by this browser behavior, as shown in the connection headers:

```
sec-websocket-extensions:
permessage-deflate; client_max_window_bits
```

## Solution

**This issue must be addressed on the server side.**

The client-side browser behavior cannot be disabled using the standard WebSocket API. The server must be configured to reject compression requests.

### Server-Side Configuration

For the backend team, here's how to disable WebSocket compression in common server implementations:

#### Node.js (ws library)
```javascript
const WebSocket = require('ws');

const wss = new WebSocket.Server({
  port: 8080,
  perMessageDeflate: false // Disable compression
});
```

#### Socket.IO
```javascript
const io = require('socket.io')(httpServer, {
  perMessageDeflate: false // Disable compression
});
```

#### Spring WebSocket (Java)
```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(myHandler(), "/myHandler")
               .setAllowedOrigins("*")
               .setHandshakeHandler(new MyHandshakeHandler());
    }
    
    public static class MyHandshakeHandler extends DefaultHandshakeHandler {
        @Override
        protected boolean checkHandshakeRequirements(ServerHttpRequest request,
                                               ServerHttpResponse response,
                                               List<WebSocketExtension> requestedExtensions,
                                               List<String> protocols) {
            // Return empty list to disable all extensions including compression
            requestedExtensions.clear();
            return super.checkHandshakeRequirements(request, response, requestedExtensions, protocols);
        }
    }
}
```

#### Flask-SocketIO (Python)
```python
from flask import Flask
from flask_socketio import SocketIO

app = Flask(__name__)
socketio = SocketIO(app, async_mode='eventlet', compression=False)
```

## Verification

After implementing the server-side change, you can verify that compression is disabled by:

1. Using Chrome DevTools Network tab
2. Finding WebSocket connections
3. Checking that the response headers do NOT include `Sec-WebSocket-Extensions: permessage-deflate`

## Impact

Disabling compression may slightly increase bandwidth usage but will likely improve connection stability and reduce CPU usage, particularly for frequent small messages which are common in our application.