import React, { useCallback, useEffect, useState } from 'react';

// Hook to check if performance mode is active (for other components)
export const usePerformanceMode = () => {
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);
  
  useEffect(() => {
    const checkPerformanceMode = () => {
      const saved = localStorage.getItem('performance-mode');
      const enabled = saved === 'true';
      setIsPerformanceMode(enabled);
    };
    
    checkPerformanceMode();
    
    // Listen for storage changes (when user toggles in another tab)
    window.addEventListener('storage', checkPerformanceMode);
    
    return () => window.removeEventListener('storage', checkPerformanceMode);
  }, []);
  
  return isPerformanceMode;
};

// Smart Performance Toggle - only shows when needed, positioned bottom right
export const SmartPerformanceToggle: React.FC = () => {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [shouldShow, setShouldShow] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [currentFPS, setCurrentFPS] = useState(60);
  const [avgFPS, setAvgFPS] = useState(60);
  const [lowFPSCount, setLowFPSCount] = useState(0);
  const [isMonitoringActive, setIsMonitoringActive] = useState(false);

  // FPS monitoring with grace period and less aggressive updates
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsHistory: number[] = [];
    let animationId: number;
    let measurementCount = 0;

    // Wait 8 seconds after component mount before starting monitoring
    // This gives the page time to settle and animations to complete
    const startMonitoringTimer = setTimeout(() => {
      setIsMonitoringActive(true);
    }, 8000);

    const measureFPS = (currentTime: number) => {
      frameCount++;
      
      // Only measure every 3 seconds instead of every second to reduce flashing
      if (currentTime - lastTime >= 3000) {
        if (isMonitoringActive) {
          const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
          setCurrentFPS(fps);
          measurementCount++;
          
          // Only start tracking after a few measurements to ensure stability
          if (measurementCount > 2) {
            // Keep track of FPS history (last 6 measurements = ~18 seconds)
            fpsHistory.push(fps);
            if (fpsHistory.length > 6) {
              fpsHistory.shift();
            }
            
            // Calculate average FPS
            const average = fpsHistory.reduce((a, b) => a + b, 0) / fpsHistory.length;
            setAvgFPS(Math.round(average));
            
            // Count low FPS occurrences - much more conservative thresholds
            if (fps < 25) { // Only consider truly poor performance
              setLowFPSCount(prev => prev + 1);
            } else if (fps > 35) { // Reset count more aggressively when performance improves
              setLowFPSCount(prev => Math.max(0, prev - 2));
            }
          }
        }
        
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    animationId = requestAnimationFrame(measureFPS);
    
    return () => {
      clearTimeout(startMonitoringTimer);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isMonitoringActive]);

  // Smart showing logic with more conservative thresholds and debouncing
  useEffect(() => {
    // Don't show anything until monitoring is active
    if (!isMonitoringActive) {
      setShouldShow(false);
      return;
    }

    // Check if user has dismissed recently (within 4 hours for performance issues)
    const dismissedTime = localStorage.getItem('performance-toggle-dismissed');
    const dismissed = dismissedTime && (Date.now() - parseInt(dismissedTime)) < 4 * 60 * 60 * 1000; // 4 hours
    setIsDismissed(!!dismissed);
    
    // Much more conservative criteria - only show for genuinely poor performance:
    // 1. Average FPS below 30 (not 45), AND
    // 2. Must have sustained poor performance (5+ low FPS instances), OR
    // 3. Current FPS is extremely low (below 15)
    const hasRealPerformanceIssues = (avgFPS < 30 && lowFPSCount >= 5) || currentFPS < 15;
    const shouldDisplay = !dismissed && hasRealPerformanceIssues && !performanceMode;
    
    // Debounce the showing to prevent flashing - only change state every 6 seconds
    const debounceTimer = setTimeout(() => {
      setShouldShow(shouldDisplay);
    }, 2000);
    
    return () => clearTimeout(debounceTimer);
  }, [avgFPS, lowFPSCount, currentFPS, performanceMode, isMonitoringActive]);

  // Load performance mode preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('performance-mode');
    const enabled = saved === 'true';
    setPerformanceMode(enabled);
    
    // Apply immediately to body
    if (enabled) {
      document.body.classList.add('performance-mode');
    }
  }, []);

  // Toggle performance mode
  const togglePerformanceMode = useCallback(() => {
    const newMode = !performanceMode;
    setPerformanceMode(newMode);
    localStorage.setItem('performance-mode', newMode.toString());
    
    // Apply to body immediately
    if (newMode) {
      document.body.classList.add('performance-mode');
      setShouldShow(false); // Hide after enabling
      setLowFPSCount(0); // Reset counter
    } else {
      document.body.classList.remove('performance-mode');
    }
  }, [performanceMode]);

  // Dismiss the toggle for 1 hour
  const dismissToggle = useCallback(() => {
    localStorage.setItem('performance-toggle-dismissed', Date.now().toString());
    setIsDismissed(true);
    setShouldShow(false);
    setLowFPSCount(0); // Reset counter
  }, []);

  // Don't render if not needed
  if (!shouldShow || isDismissed) return null;

  const getPerformanceMessage = () => {
    if (currentFPS < 20) return 'Very Low FPS Detected';
    if (avgFPS < 30) return 'Poor Performance Detected';
    if (avgFPS < 45) return 'Choppy Frame Rate';
    return 'Performance Issues Detected';
  };

  const getPerformanceIcon = () => {
    if (currentFPS < 20) return '🔴';
    if (avgFPS < 30) return '🟠';
    return '🟡';
  };

  return (
    <div className="fixed bottom-16 right-4 z-50">
      <div className="bg-gray-900/95 backdrop-blur-sm border border-orange-500/40 rounded-xl p-3 shadow-xl max-w-xs animate-pulse">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <span className="text-sm">{getPerformanceIcon()}</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-white mb-1">
              {getPerformanceMessage()}
            </div>
            <div className="text-xs text-gray-400 mb-2">
              Current: {currentFPS} FPS • Avg: {avgFPS} FPS
            </div>
            <div className="text-xs text-orange-300 mb-3">
              Enable Performance Mode to reduce animations and improve frame rate
            </div>
            <div className="flex gap-2">
              <button
                onClick={togglePerformanceMode}
                className="flex-1 bg-orange-600 hover:bg-orange-500 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
              >
                Fix Performance
              </button>
              <button
                onClick={dismissToggle}
                className="text-gray-400 hover:text-gray-300 text-xs px-2 transition-colors"
                title="Hide for 1 hour"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Inline version for Footer integration
export const PerformanceToggleInline: React.FC = () => {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load performance mode preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('performance-mode');
    const enabled = saved === 'true';
    setPerformanceMode(enabled);
    
    // Apply immediately to body
    if (enabled) {
      document.body.classList.add('performance-mode');
    }
  }, []);

  // Toggle performance mode
  const togglePerformanceMode = useCallback(() => {
    const newMode = !performanceMode;
    setPerformanceMode(newMode);
    localStorage.setItem('performance-mode', newMode.toString());
    
    // Apply to body immediately
    if (newMode) {
      document.body.classList.add('performance-mode');
    } else {
      document.body.classList.remove('performance-mode');
    }
  }, [performanceMode]);

  // Keyboard shortcut (Ctrl/Cmd + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformanceMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePerformanceMode]);

  return (
    <button
      onClick={togglePerformanceMode}
      className={`
        flex items-center gap-1 px-2 py-1 rounded text-xs font-medium border transition-all duration-200
        ${performanceMode 
          ? 'bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30' 
          : 'bg-gray-700/60 border-gray-600/40 text-gray-400 hover:bg-gray-600/60'
        }
        ${isMobile && !performanceMode ? 'border-orange-400/40 text-orange-300' : ''}
      `}
      title={
        performanceMode 
          ? 'Disable Performance Mode (Ctrl+Shift+P)' 
          : `Enable Performance Mode - Reduces lag (Ctrl+Shift+P)${isMobile ? ' | Recommended for mobile' : ''}`
      }
    >
      <span className="text-[10px]">
        {performanceMode ? '🚀' : (isMobile ? '📱' : '🐌')}
      </span>
      <span className="hidden sm:inline">
        {performanceMode ? 'Fast' : (isMobile ? 'Mobile' : 'Laggy?')}
      </span>
    </button>
  );
};

// Original fixed position version (keep for backward compatibility but simplified)
export const PerformanceToggle: React.FC = () => {
  const [performanceMode, setPerformanceMode] = useState(false);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
      
      // Auto-suggest performance mode on mobile if not already suggested
      if (mobile && !localStorage.getItem('performance-mode-suggested') && !localStorage.getItem('performance-mode')) {
        setShowSuggestion(true);
        setTimeout(() => {
          setShowSuggestion(false);
          localStorage.setItem('performance-mode-suggested', 'true');
        }, 6000);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load performance mode preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('performance-mode');
    const enabled = saved === 'true';
    setPerformanceMode(enabled);
    
    // Apply immediately to body
    if (enabled) {
      document.body.classList.add('performance-mode');
    }
  }, []);

  // Toggle performance mode
  const togglePerformanceMode = useCallback(() => {
    const newMode = !performanceMode;
    setPerformanceMode(newMode);
    localStorage.setItem('performance-mode', newMode.toString());
    
    // Apply to body immediately
    if (newMode) {
      document.body.classList.add('performance-mode');
      setShowSuggestion(false);
      localStorage.setItem('performance-mode-suggested', 'true');
    } else {
      document.body.classList.remove('performance-mode');
    }
  }, [performanceMode]);

  // Keyboard shortcut (Ctrl/Cmd + Shift + P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        togglePerformanceMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePerformanceMode]);

  return (
    <div className="fixed bottom-20 left-4 z-50">
      {/* Mobile suggestion tooltip */}
      {showSuggestion && (
        <div className="absolute bottom-full left-0 mb-2 p-3 bg-dark-800/95 border border-blue-500/50 rounded-lg text-sm text-blue-300 max-w-xs shadow-lg backdrop-blur-sm">
          <div className="font-medium mb-1">📱 Mobile Detected</div>
          <div className="text-xs text-blue-200">
            Enable Performance Mode for smoother experience on mobile devices!
          </div>
          <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-500/50"></div>
        </div>
      )}
      
      <button
        onClick={togglePerformanceMode}
        className={`
          px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-200
          ${performanceMode 
            ? 'bg-green-500/20 border-green-500/40 text-green-300 hover:bg-green-500/30' 
            : 'bg-gray-700/80 border-gray-600/40 text-gray-300 hover:bg-gray-600/80'
          }
          ${showSuggestion ? 'animate-pulse border-blue-500/60 bg-blue-500/20' : ''}
          ${isMobile && !performanceMode ? 'border-orange-400/40' : ''}
        `}
        title={
          performanceMode 
            ? 'Disable Performance Mode (Ctrl+Shift+P)' 
            : `Enable Performance Mode - Reduces lag (Ctrl+Shift+P)${isMobile ? ' | Recommended for mobile' : ''}`
        }
      >
        {performanceMode ? '🚀 Fast' : isMobile ? '📱 Mobile?' : '🐌 Laggy?'}
      </button>
    </div>
  );
}; 