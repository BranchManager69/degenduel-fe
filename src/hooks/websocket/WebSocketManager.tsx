/**
 * WebSocketManager has been moved to the components directory
 * 
 * This file now re-exports the WebSocketManager component from 
 * the new location to maintain backward compatibility.
 */

import { WebSocketManager } from '../../components/websocket';
import { MessageType, TopicType, useUnifiedWebSocket } from './index';

// Re-export for backward compatibility
export { MessageType, TopicType, useUnifiedWebSocket };

export default WebSocketManager;