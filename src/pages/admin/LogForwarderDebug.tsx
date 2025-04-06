// src/pages/admin/LogForwarderDebug.tsx

/**
 * This is used to debug the log forwarder.
 * @author @BranchManager69
 * @since 2025-04-02
 */

import React, { useEffect, useRef, useState } from 'react';
import { MessageType, TopicType, useUnifiedWebSocket } from '../../hooks/websocket/WebSocketManager';
import { clientLogger, LogLevel, sendLogsNow } from '../../utils/clientLogForwarder';

// LogForwarderDebug component
const LogForwarderDebug: React.FC = () => {
  const [message, setMessage] = useState('');
  const [logLevel, setLogLevel] = useState<LogLevel>(LogLevel.INFO);
  const [context, setContext] = useState('{}');
  const [status, setStatus] = useState('');
  const [receivedLogs, setReceivedLogs] = useState<any[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  
  // Reference for auto-scrolling log container
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Set up WebSocket listener for logs
  const { isConnected, connectionState } = useUnifiedWebSocket(
    'log-forwarder-debug',
    [MessageType.DATA, MessageType.ACKNOWLEDGMENT, MessageType.LOGS],
    (message) => {
      if (message.type === MessageType.ACKNOWLEDGMENT && message.topic === TopicType.LOGS) {
        // Update status when logs are acknowledged
        setStatus(`Server acknowledged log receipt: ${message.message || 'OK'} (${message.count || 0} logs)`);
      } else if ((message.type === MessageType.DATA && message.topic === TopicType.LOGS && message.data) || 
                (message.type === MessageType.LOGS && message.logs)) {
        // Add received logs to the display - handle both formats
        const logsData = message.logs || message.data || [];
        setReceivedLogs(prev => [...prev, ...logsData].slice(-100));
      }
    },
    [TopicType.LOGS]
  );
  
  // Update connection status
  useEffect(() => {
    setWsConnected(isConnected);
  }, [isConnected, connectionState]);
  
  // Auto-scroll to bottom of log container
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [receivedLogs]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Parse context
      const parsedContext = context ? JSON.parse(context) : {};
      
      // Send log based on selected level
      switch (logLevel) {
        case LogLevel.DEBUG:
          clientLogger.debug(message, parsedContext);
          break;
        case LogLevel.INFO:
          clientLogger.info(message, parsedContext);
          break;
        case LogLevel.WARN:
          clientLogger.warn(message, parsedContext);
          break;
        case LogLevel.ERROR:
          clientLogger.error(message, parsedContext);
          break;
        case LogLevel.FATAL:
          clientLogger.fatal(message, parsedContext);
          break;
      }

      // Force send logs immediately
      sendLogsNow();
      
      setStatus(`Log sent: ${logLevel} - ${message}`);
      setMessage('');
    } catch (err) {
      setStatus(`Error: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  // Trigger an error
  const triggerError = () => {
    try {
      // Intentionally cause an error
      throw new Error('Manually triggered test error');
    } catch (err) {
      console.error('Test error:', err);
      setStatus('Error triggered. Check console and server logs.');
    }
  };

  // Trigger an unhandled error
  const triggerUnhandledError = () => {
    // This will cause an unhandled error
    setTimeout(() => {
      // @ts-ignore - Intentional error
      nonExistentFunction();
    }, 100);
    setStatus('Unhandled error triggered. Check console and server logs.');
  };

  // Trigger a promise rejection
  const triggerPromiseRejection = () => {
    // This will cause an unhandled promise rejection
    Promise.reject(new Error('Test unhandled promise rejection'));
    setStatus('Promise rejection triggered. Check console and server logs.');
  };

  // Render the component
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-6">Client Log Forwarder Debug</h1>
      
      <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Send Custom Log</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">Log Level:</label>
            <select 
              className="p-2 border rounded w-full"
              value={logLevel}
              onChange={(e) => setLogLevel(e.target.value as LogLevel)}
            >
              <option value={LogLevel.DEBUG}>Debug</option>
              <option value={LogLevel.INFO}>Info</option>
              <option value={LogLevel.WARN}>Warning</option>
              <option value={LogLevel.ERROR}>Error</option>
              <option value={LogLevel.FATAL}>Fatal</option>
            </select>
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Message:</label>
            <input 
              type="text" 
              className="p-2 border rounded w-full"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block mb-2">Context (JSON):</label>
            <textarea 
              className="p-2 border rounded w-full"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={5}
            />
          </div>
          
          <button 
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send Log
          </button>
        </form>
      </div>
      
      <div className="mb-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Test Error Capture</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={triggerError}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Trigger Caught Error
          </button>
          
          <button 
            onClick={triggerUnhandledError}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Trigger Unhandled Error
          </button>
          
          <button 
            onClick={triggerPromiseRejection}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
          >
            Trigger Promise Rejection
          </button>
        </div>
      </div>
      
      {status && (
        <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg">
          <p>{status}</p>
        </div>
      )}
      
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Live Log Stream</h2>
          <div className="flex items-center space-x-2">
            <span className={`h-3 w-3 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
            <span>{wsConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        
        <div 
          ref={logContainerRef}
          className="h-80 overflow-y-auto bg-black text-green-400 p-4 font-mono text-sm rounded"
        >
          {receivedLogs.length === 0 ? (
            <div className="text-gray-500 italic">No logs received yet. Send some logs to see them appear here.</div>
          ) : (
            receivedLogs.map((log, index) => (
              <div key={index} className="mb-2">
                <div className={`
                  ${log.level === 'error' || log.level === 'fatal' ? 'text-red-400' : ''}
                  ${log.level === 'warn' ? 'text-yellow-400' : ''}
                  ${log.level === 'info' ? 'text-blue-400' : ''}
                `}>
                  [{new Date(log.timestamp).toLocaleTimeString()}] [{log.level.toUpperCase()}] {log.message}
                </div>
                {log.stackTrace && (
                  <div className="text-gray-500 ml-4 text-xs whitespace-pre-wrap">
                    {log.stackTrace}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Implementation Details</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>Auto-captures console.warn and console.error calls</li>
          <li>Auto-captures unhandled errors and promise rejections</li>
          <li>Sends logs via WebSocket when connected (topic: logs, action: client-logs)</li>
          <li>Falls back to REST API when WebSocket is unavailable (/api/logs/client endpoint)</li>
          <li>Batches logs every 10 seconds to reduce network traffic</li>
          <li>Sends errors immediately without waiting for batch</li>
          <li>Preserves stack traces and additional context</li>
          <li>Includes user and session information when available</li>
        </ul>
      </div>
    </div>
  );
};

export default LogForwarderDebug;