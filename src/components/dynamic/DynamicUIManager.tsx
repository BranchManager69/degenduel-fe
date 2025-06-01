// src/components/dynamic/DynamicUIManager.tsx

/**
 * Enhanced Dynamic UI Manager - Production Ready
 * 
 * @description Advanced state management and rendering for AI-generated dynamic components
 * @author BranchManager69 + Claude Code
 * @version 2.0.0 - Production Ready
 * @created 2025-05-26
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UIAction, 
  ComponentState, 
  ComponentPlacement,
  ComponentEvent,
  ComponentPerformance,
  ComponentType
} from './types';
import { AdvancedLayoutManager, useLayout, getPlacementAnimations } from './AdvancedLayoutManager';
import DynamicComponentRenderer, { COMPONENT_REGISTRY } from './ComponentRegistry';

// Performance monitoring
const usePerformanceMonitor = () => {
  const performanceData = useRef<Map<string, ComponentPerformance>>(new Map());
  
  const recordRenderTime = useCallback((componentId: string, renderTime: number) => {
    const current = performanceData.current.get(componentId) || {
      renderTime: 0,
      dataLoadTime: 0,
      interactionLatency: 0,
      memoryUsage: 0,
      errorRate: 0
    };
    
    performanceData.current.set(componentId, {
      ...current,
      renderTime
    });
  }, []);

  const getPerformanceData = useCallback((componentId: string) => {
    return performanceData.current.get(componentId);
  }, []);

  return { recordRenderTime, getPerformanceData };
};

// Component event system
const useComponentEventSystem = () => {
  const [eventHandlers] = useState<Map<string, Set<(event: ComponentEvent) => void>>>(new Map());

  const subscribe = useCallback((eventType: string, handler: (event: ComponentEvent) => void) => {
    if (!eventHandlers.has(eventType)) {
      eventHandlers.set(eventType, new Set());
    }
    eventHandlers.get(eventType)!.add(handler);

    return () => {
      eventHandlers.get(eventType)?.delete(handler);
    };
  }, [eventHandlers]);

  const emit = useCallback((event: ComponentEvent) => {
    const handlers = eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }
  }, [eventHandlers]);

  return { subscribe, emit };
};

// Core DynamicUIManager Props
interface DynamicUIManagerProps {
  className?: string;
  maxComponents?: number;
  enablePerformanceMonitoring?: boolean;
  onComponentError?: (componentId: string, error: Error) => void;
  onComponentInteraction?: (componentId: string, type: string, payload?: any) => void;
}

interface DynamicUIManagerHandle {
  handleUIAction: (action: UIAction) => void;
  getActiveComponents: () => ComponentState[];
  removeComponent: (componentId: string) => void;
  updateComponent: (componentId: string, data: any) => void;
  clearAllComponents: () => void;
  getComponentState: (componentId: string) => ComponentState | undefined;
}

// Internal component wrapper for lifecycle management
interface ComponentWrapperProps {
  componentState: ComponentState;
  onUpdate: (id: string, data: any) => void;
  onClose: (id: string) => void;
  onInteraction: (id: string, type: string, payload?: any) => void;
  onError: (id: string, error: Error) => void;
  performanceMonitor: ReturnType<typeof usePerformanceMonitor>;
}

const ComponentWrapper: React.FC<ComponentWrapperProps> = ({
  componentState,
  onUpdate,
  onClose,
  onInteraction,
  onError,
  performanceMonitor
}) => {
  const renderStartTime = useRef<number>(Date.now());
  
  useEffect(() => {
    const renderTime = Date.now() - renderStartTime.current;
    performanceMonitor.recordRenderTime(componentState.id, renderTime);
  }, [componentState.id, performanceMonitor]);

  const animations = getPlacementAnimations(
    componentState.placement, 
    componentState.config.animation
  );

  // Handle responsive behavior
  const { breakpoint } = useLayout();
  const responsiveConfig = componentState.config.responsive?.[breakpoint] || {};
  const effectiveConfig = { ...componentState.config, ...responsiveConfig };

  return (
    <motion.div
      key={componentState.id}
      layout
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{
        duration: 0.3,
        ease: "easeInOut"
      }}
      className={`component-wrapper component-${componentState.placement}`}
      style={{
        ...effectiveConfig.layout,
        zIndex: effectiveConfig.layout?.zIndex || getDefaultZIndex(componentState.placement)
      }}
    >
      <DynamicComponentRenderer
        type={componentState.type as any}
        id={componentState.id}
        data={componentState.data}
        title={effectiveConfig.title}
        closeable={effectiveConfig.interactions?.closeable ?? effectiveConfig.closeable}
        onClose={() => onClose(componentState.id)}
        onUpdate={(newData) => onUpdate(componentState.id, newData)}
        onInteraction={(type, payload) => onInteraction(componentState.id, type, payload)}
        onError={(error) => onError(componentState.id, error)}
        state={componentState.lifecycle}
        className="w-full h-full"
      />
    </motion.div>
  );
};

// Helper function for default z-index based on placement
const getDefaultZIndex = (placement: ComponentPlacement): number => {
  const zIndexMap: Record<ComponentPlacement, number> = {
    'below_terminal': 10,
    'above_terminal': 10,
    'main_view': 20,
    'sidebar_left': 30,
    'sidebar_right': 30,
    'sidebar': 30,
    'inline': 10,
    'floating': 40,
    'modal': 50,
    'fullscreen': 60
  };
  
  return zIndexMap[placement] || 10;
};

// Main DynamicUIManager component
const DynamicUIManagerCore = React.forwardRef<DynamicUIManagerHandle, DynamicUIManagerProps>(({
  className = '',
  maxComponents = 20,
  enablePerformanceMonitoring = true,
  onComponentError,
  onComponentInteraction
}, ref) => {
  const layoutManager = useLayout();
  const performanceMonitor = usePerformanceMonitor();
  const eventSystem = useComponentEventSystem();
  
  // Component state management
  const [componentStates, setComponentStates] = useState<Map<string, ComponentState>>(new Map());
  
  // Auto-cleanup timer references
  const cleanupTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Create component state from UI action
  const createComponentState = useCallback((action: UIAction): ComponentState => {
    return {
      id: action.id,
      type: action.component,
      placement: action.placement || 'below_terminal',
      lifecycle: 'initializing',
      data: action.data || {},
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        interactionCount: 0,
        errorCount: 0
      },
      config: action
    };
  }, []);

  // Handle UI actions from AI
  const handleUIAction = useCallback((action: UIAction) => {
    console.log('[DynamicUIManager] Processing UI action:', {
      type: action.type,
      component: action.component,
      id: action.id,
      placement: action.placement,
      dataKeys: action.data ? Object.keys(action.data) : [],
      hasTitle: !!action.title,
      timestamp: new Date().toISOString()
    });

    switch (action.type) {
      case 'create_component':
        // Validate component type
        if (!COMPONENT_REGISTRY[action.component as ComponentType]) {
          console.error('[DynamicUIManager] Unknown component type:', action.component);
          console.log('[DynamicUIManager] Available components:', Object.keys(COMPONENT_REGISTRY));
          return;
        }

        setComponentStates(prev => {
          const newStates = new Map(prev);
          
          // Check max components limit
          if (newStates.size >= maxComponents) {
            console.warn('[DynamicUIManager] Max components limit reached, removing oldest');
            const oldestId = Array.from(newStates.keys())[0];
            newStates.delete(oldestId);
            layoutManager.unregisterComponent(oldestId);
          }

          // Remove existing component with same ID
          if (newStates.has(action.id)) {
            console.log('[DynamicUIManager] Replacing existing component:', action.id);
            layoutManager.unregisterComponent(action.id);
          }

          try {
            // Create new component state
            const componentState = createComponentState(action);
            newStates.set(action.id, componentState);
            
            // Register with layout manager
            layoutManager.registerComponent(componentState);
            console.log('[DynamicUIManager] Successfully created component:', action.id);

            // Set up auto-removal if duration specified
            if (action.duration && action.duration > 0) {
              const timer = setTimeout(() => {
                handleUIAction({ type: 'remove_component', component: action.component, id: action.id });
              }, action.duration * 1000);
              
              cleanupTimers.current.set(action.id, timer);
              console.log('[DynamicUIManager] Auto-removal scheduled for component:', action.id, 'in', action.duration, 'seconds');
            }
          } catch (error) {
            console.error('[DynamicUIManager] Failed to create component:', error);
            return prev;
          }

          return newStates;
        });
        break;

      case 'update_component':
        setComponentStates(prev => {
          const newStates = new Map(prev);
          const existing = newStates.get(action.id);
          
          if (existing) {
            const updated: ComponentState = {
              ...existing,
              data: { ...existing.data, ...action.data },
              lifecycle: 'updating',
              metadata: {
                ...existing.metadata,
                lastUpdated: new Date()
              }
            };
            newStates.set(action.id, updated);
            
            // Update lifecycle back to active after brief update state
            setTimeout(() => {
              setComponentStates(current => {
                const newCurrent = new Map(current);
                const comp = newCurrent.get(action.id);
                if (comp && comp.lifecycle === 'updating') {
                  newCurrent.set(action.id, { ...comp, lifecycle: 'active' });
                }
                return newCurrent;
              });
            }, 100);
          }
          
          return newStates;
        });
        break;

      case 'replace_component':
        setComponentStates(prev => {
          const newStates = new Map(prev);
          const existing = newStates.get(action.id);
          
          if (existing) {
            layoutManager.unregisterComponent(action.id);
            const newComponent = createComponentState(action);
            newStates.set(action.id, newComponent);
            layoutManager.registerComponent(newComponent);
          }
          
          return newStates;
        });
        break;

      case 'remove_component':
        setComponentStates(prev => {
          const newStates = new Map(prev);
          const existing = newStates.get(action.id);
          
          if (existing) {
            // Clear any cleanup timer
            const timer = cleanupTimers.current.get(action.id);
            if (timer) {
              clearTimeout(timer);
              cleanupTimers.current.delete(action.id);
            }
            
            // Set removing lifecycle for animation
            newStates.set(action.id, { ...existing, lifecycle: 'removing' });
            layoutManager.unregisterComponent(action.id);
            
            // Actually remove after animation
            setTimeout(() => {
              setComponentStates(current => {
                const newCurrent = new Map(current);
                newCurrent.delete(action.id);
                return newCurrent;
              });
            }, 300);
          }
          
          return newStates;
        });
        break;

      default:
        console.warn('[DynamicUIManager] Unknown UI action type:', action.type);
    }

    // Emit event
    eventSystem.emit({
      type: 'ui_action_processed',
      sourceId: 'ui_manager',
      payload: action,
      timestamp: new Date()
    });
  }, [
    maxComponents, 
    createComponentState, 
    layoutManager, 
    eventSystem
  ]);

  // Component interaction handlers
  const handleComponentUpdate = useCallback((componentId: string, newData: any) => {
    setComponentStates(prev => {
      const newStates = new Map(prev);
      const existing = newStates.get(componentId);
      
      if (existing) {
        newStates.set(componentId, {
          ...existing,
          data: { ...existing.data, ...newData },
          metadata: {
            ...existing.metadata,
            lastUpdated: new Date(),
            interactionCount: existing.metadata.interactionCount + 1
          }
        });
      }
      
      return newStates;
    });
    
    if (onComponentInteraction) {
      onComponentInteraction(componentId, 'update', newData);
    }
  }, [onComponentInteraction]);

  const handleComponentClose = useCallback((componentId: string) => {
    handleUIAction({ type: 'remove_component', component: '', id: componentId });
  }, [handleUIAction]);

  const handleComponentInteraction = useCallback((componentId: string, type: string, payload?: any) => {
    setComponentStates(prev => {
      const newStates = new Map(prev);
      const existing = newStates.get(componentId);
      
      if (existing) {
        newStates.set(componentId, {
          ...existing,
          metadata: {
            ...existing.metadata,
            interactionCount: existing.metadata.interactionCount + 1
          }
        });
      }
      
      return newStates;
    });
    
    if (onComponentInteraction) {
      onComponentInteraction(componentId, type, payload);
    }
  }, [onComponentInteraction]);

  const handleComponentError = useCallback((componentId: string, error: Error) => {
    console.error(`[DynamicUIManager] Component ${componentId} error:`, error);
    
    setComponentStates(prev => {
      const newStates = new Map(prev);
      const existing = newStates.get(componentId);
      
      if (existing) {
        newStates.set(componentId, {
          ...existing,
          lifecycle: 'error',
          metadata: {
            ...existing.metadata,
            errorCount: existing.metadata.errorCount + 1
          }
        });
      }
      
      return newStates;
    });
    
    if (onComponentError) {
      onComponentError(componentId, error);
    }
  }, [onComponentError]);

  // Public API methods
  const getActiveComponents = useCallback((): ComponentState[] => {
    return Array.from(componentStates.values());
  }, [componentStates]);

  const removeComponent = useCallback((componentId: string) => {
    handleUIAction({ type: 'remove_component', component: '', id: componentId });
  }, [handleUIAction]);

  const updateComponent = useCallback((componentId: string, data: any) => {
    handleUIAction({ type: 'update_component', component: '', id: componentId, data });
  }, [handleUIAction]);

  const clearAllComponents = useCallback(() => {
    componentStates.forEach((_, id) => {
      handleUIAction({ type: 'remove_component', component: '', id });
    });
  }, [componentStates, handleUIAction]);

  const getComponentState = useCallback((componentId: string): ComponentState | undefined => {
    return componentStates.get(componentId);
  }, [componentStates]);

  // Group components by placement for rendering
  const componentsByPlacement = useMemo(() => {
    const groups: Record<ComponentPlacement, ComponentState[]> = {
      'below_terminal': [],
      'above_terminal': [],
      'main_view': [],
      'sidebar_left': [],
      'sidebar_right': [],
      'sidebar': [],
      'modal': [],
      'fullscreen': [],
      'inline': [],
      'floating': []
    };

    componentStates.forEach(comp => {
      if (comp.lifecycle !== 'removing') {
        groups[comp.placement].push(comp);
      }
    });

    return groups;
  }, [componentStates]);

  // Render components for specific placement
  const renderComponentsForPlacement = useCallback((placement: ComponentPlacement) => {
    const components = componentsByPlacement[placement];
    if (!components.length) return null;

    return (
      <div className={`dynamic-components-${placement} space-y-4`}>
        <AnimatePresence mode="popLayout">
          {components.map((componentState) => (
            <ComponentWrapper
              key={componentState.id}
              componentState={componentState}
              onUpdate={handleComponentUpdate}
              onClose={handleComponentClose}
              onInteraction={handleComponentInteraction}
              onError={handleComponentError}
              performanceMonitor={performanceMonitor}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }, [
    componentsByPlacement,
    handleComponentUpdate,
    handleComponentClose,
    handleComponentInteraction,
    handleComponentError,
    performanceMonitor
  ]);

  // Expose public API via ref
  React.useImperativeHandle(ref, () => ({
    handleUIAction,
    getActiveComponents,
    removeComponent,
    updateComponent,
    clearAllComponents,
    getComponentState
  }), [
    handleUIAction,
    getActiveComponents,
    removeComponent,
    updateComponent,
    clearAllComponents,
    getComponentState
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers.current.forEach(timer => clearTimeout(timer));
      cleanupTimers.current.clear();
    };
  }, []);

  return (
    <div className={`dynamic-ui-manager ${className}`}>
      {/* Below Terminal Components */}
      {renderComponentsForPlacement('below_terminal')}
      
      {/* Above Terminal Components */}
      {renderComponentsForPlacement('above_terminal')}

      {/* Main View Takeover */}
      {componentsByPlacement.main_view.length > 0 && (
        <div className="fixed inset-0 z-20 bg-darkGrey-dark">
          {renderComponentsForPlacement('main_view')}
        </div>
      )}

      {/* Sidebar Components */}
      {layoutManager.layoutState.sidebars.left.open && (
        <div 
          className="fixed left-0 top-0 bottom-0 z-30 bg-darkGrey-dark/95 backdrop-blur-sm border-r border-mauve/20"
          style={{ width: layoutManager.layoutState.sidebars.left.width }}
        >
          {renderComponentsForPlacement('sidebar_left')}
        </div>
      )}
      
      {layoutManager.layoutState.sidebars.right.open && (
        <div 
          className="fixed right-0 top-0 bottom-0 z-30 bg-darkGrey-dark/95 backdrop-blur-sm border-l border-mauve/20"
          style={{ width: layoutManager.layoutState.sidebars.right.width }}
        >
          {renderComponentsForPlacement('sidebar_right')}
        </div>
      )}

      {/* Modal Components */}
      {componentsByPlacement.modal.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-4xl max-h-[90vh] overflow-auto">
            {renderComponentsForPlacement('modal')}
          </div>
        </div>
      )}

      {/* Fullscreen Components */}
      {componentsByPlacement.fullscreen.length > 0 && (
        <div className="fixed inset-0 z-60 bg-darkGrey-dark">
          {renderComponentsForPlacement('fullscreen')}
        </div>
      )}

      {/* Floating Components */}
      <div className="fixed top-4 right-4 z-40 space-y-4 max-w-sm">
        {renderComponentsForPlacement('floating')}
      </div>

      {/* Inline Components */}
      {renderComponentsForPlacement('inline')}

      {/* Development Debug Panel */}
      {process.env.NODE_ENV === 'development' && enablePerformanceMonitoring && (
        <div className="fixed bottom-4 left-4 bg-black/80 p-3 rounded text-xs text-white font-mono max-w-sm">
          <div className="font-bold mb-1">Dynamic Components ({componentStates.size})</div>
          {Array.from(componentStates.values()).map(comp => (
            <div key={comp.id} className="text-green-400 flex justify-between">
              <span>{comp.type}:{comp.id.slice(-8)}</span>
              <span className="text-blue-400">{comp.placement}</span>
              <span className="text-yellow-400">{comp.lifecycle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Main wrapper component with layout manager
const DynamicUIManager = React.forwardRef<DynamicUIManagerHandle, DynamicUIManagerProps>((props, ref) => {
  return (
    <AdvancedLayoutManager>
      <DynamicUIManagerCore {...props} ref={ref} />
    </AdvancedLayoutManager>
  );
});

// Create global handler for external access
let globalUIHandler: ((action: UIAction) => void) | null = null;

export const setGlobalUIHandler = (handler: (action: UIAction) => void) => {
  globalUIHandler = handler;
};

export const triggerUIAction = (action: UIAction) => {
  if (globalUIHandler) {
    globalUIHandler(action);
  } else {
    console.warn('[DynamicUIManager] No global UI handler set. UI action ignored:', action);
  }
};

export { DynamicUIManager, AdvancedLayoutManager };
export default DynamicUIManager;