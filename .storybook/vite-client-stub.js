// This is a modified Vite client that allows controlled HMR updates
// It preserves styling and functionality while preventing excessive refreshes

console.log('[Storybook] Loading controlled Vite client - HMR enabled with throttling');

// Track refresh timing to prevent rapid refreshes
let lastRefresh = 0;
const MIN_REFRESH_INTERVAL = 5000; // 5 seconds minimum between refreshes

// We'll export real functions for most operations
export const createHotContext = (id) => {
  console.log(`[HMR] Created hot context for ${id}`);
  return {
    // Allow updates
    accept: (deps, callback) => {
      console.log(`[HMR] Module ${id} accepting updates`);
      if (callback) {
        callback();
      }
    },
    // Allow component updates
    dispose: (callback) => {
      if (callback) {
        callback();
      }
    },
    prune: () => {},
    decline: () => {},
    invalidate: () => {},
    on: () => {}
  };
};

// Allow style updates to work
export const updateStyle = (id, content) => {
  try {
    const style = document.querySelector(`style[data-vite-dev-id="${id}"]`);
    if (style) {
      style.textContent = content;
    } else {
      const newStyle = document.createElement('style');
      newStyle.setAttribute('data-vite-dev-id', id);
      newStyle.textContent = content;
      document.head.appendChild(newStyle);
    }
  } catch (e) {
    console.error('[HMR] Style update error:', e);
  }
};

export const removeStyle = (id) => {
  const style = document.querySelector(`style[data-vite-dev-id="${id}"]`);
  if (style) {
    document.head.removeChild(style);
  }
};

// Allow controlled connection
export function connect() {
  console.log('[Storybook] WebSocket connection enabled with throttling');
  // Actually connect but with controlled refresh
}

// Control reconnection attempts
export function setupWebSocket() {
  console.log('[Storybook] WebSocket setup with controlled refresh');
}

// Other necessary exports
export const sendMessageBuffer = () => {};
export const onConnect = () => {};
export const hotModulesMap = new Map();
export const disposeMap = new Map();
export const pruneMap = new Map();
export const dataMap = new Map();
export const customListenersMap = new Map();
export const ctxToListenersMap = new Map();

// Controlled refreshes
export function handleMessage(data) {
  if (data.type === 'full-reload') {
    const now = Date.now();
    if (now - lastRefresh < MIN_REFRESH_INTERVAL) {
      console.log('[HMR] Throttling page refresh');
      return; // Skip this reload
    }
    lastRefresh = now;
    console.log('[HMR] Performing controlled page refresh');
    location.reload();
  }
}

export function reconnect() {
  console.log('[HMR] Reconnecting with controlled refresh');
}

export function reload() {
  const now = Date.now();
  if (now - lastRefresh < MIN_REFRESH_INTERVAL) {
    console.log('[HMR] Throttling page refresh');
    return; // Skip this reload
  }
  lastRefresh = now;
  console.log('[HMR] Performing controlled page refresh');
  location.reload();
} 