// src/components/dynamic/DynamicUIManager.tsx

/**
 * Dynamic UI Manager
 * 
 * @description State management and rendering for AI-generated dynamic components
 * @author BranchManager69 + Claude Code
 * @version 1.0.0
 * @created 2025-05-25
 */

import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UIAction } from './types';
import DynamicComponentRenderer from './ComponentRegistry';

interface DynamicUIManagerProps {
  className?: string;
}

interface DynamicUIManagerHandle {
  handleUIAction: (action: UIAction) => void;
}

const DynamicUIManager = React.forwardRef<DynamicUIManagerHandle, DynamicUIManagerProps>(({ className = '' }, ref) => {
  const [components, setComponents] = useState<UIAction[]>([]);

  // Handle UI actions from AI
  const handleUIAction = useCallback((action: UIAction) => {
    console.log('[DynamicUIManager] Processing UI action:', action);

    switch (action.type) {
      case 'create_component':
        setComponents(prev => {
          // Remove any existing component with the same ID
          const filtered = prev.filter(comp => comp.id !== action.id);
          return [...filtered, action];
        });
        break;

      case 'update_component':
        setComponents(prev => 
          prev.map(comp => 
            comp.id === action.id 
              ? { ...comp, data: { ...comp.data, ...action.data } }
              : comp
          )
        );
        break;

      case 'replace_component':
        setComponents(prev => 
          prev.map(comp => comp.id === action.id ? action : comp)
        );
        break;

      case 'remove_component':
        setComponents(prev => prev.filter(comp => comp.id !== action.id));
        break;

      default:
        console.warn('[DynamicUIManager] Unknown UI action type:', action.type);
    }

    // Auto-remove components with duration
    if (action.duration && action.duration > 0) {
      setTimeout(() => {
        setComponents(prev => prev.filter(comp => comp.id !== action.id));
      }, action.duration * 1000);
    }
  }, []);

  // Handle component close
  const handleComponentClose = useCallback((id: string) => {
    setComponents(prev => prev.filter(comp => comp.id !== id));
  }, []);

  // Handle component update from within component
  const handleComponentUpdate = useCallback((id: string, newData: any) => {
    setComponents(prev => 
      prev.map(comp => 
        comp.id === id 
          ? { ...comp, data: { ...comp.data, ...newData } }
          : comp
      )
    );
  }, []);

  // Group components by placement
  const componentsByPlacement = useMemo(() => {
    const groups: Record<string, UIAction[]> = {
      above_terminal: [],
      below_terminal: [],
      sidebar_left: [],
      sidebar_right: [],
      fullscreen: [],
      inline: []
    };

    components.forEach(comp => {
      const placement = comp.placement || 'below_terminal';
      if (groups[placement]) {
        groups[placement].push(comp);
      }
    });

    return groups;
  }, [components]);

  // Animation variants
  const getAnimationVariants = (animation?: string) => {
    switch (animation) {
      case 'slide_up':
        return {
          initial: { y: 50, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: -50, opacity: 0 }
        };
      case 'slide_down':
        return {
          initial: { y: -50, opacity: 0 },
          animate: { y: 0, opacity: 1 },
          exit: { y: 50, opacity: 0 }
        };
      case 'scale_in':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          exit: { scale: 0.8, opacity: 0 }
        };
      case 'fade_in':
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  // Render components for a specific placement
  const renderComponentsForPlacement = (placement: string) => {
    const placementComponents = componentsByPlacement[placement];
    if (!placementComponents.length) return null;

    return (
      <div className={`dynamic-components-${placement} space-y-4`}>
        <AnimatePresence mode="popLayout">
          {placementComponents.map((component) => {
            const variants = getAnimationVariants(component.animation);
            return (
              <motion.div
                key={component.id}
                layout
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                  duration: 0.3,
                  ease: "easeInOut"
                }}
                className="w-full"
              >
                <DynamicComponentRenderer
                  type={component.component as any}
                  id={component.id}
                  data={component.data}
                  title={component.title}
                  closeable={component.closeable}
                  onClose={() => handleComponentClose(component.id)}
                  onUpdate={(newData) => handleComponentUpdate(component.id, newData)}
                  className="w-full"
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    );
  };

  // Expose the handler for external use
  React.useImperativeHandle(
    ref,
    () => ({ handleUIAction }),
    [handleUIAction]
  );

  return (
    <div className={`dynamic-ui-manager ${className}`}>
      {/* Above Terminal Components */}
      {renderComponentsForPlacement('above_terminal')}

      {/* Below Terminal Components */}
      {renderComponentsForPlacement('below_terminal')}

      {/* Sidebar Components */}
      <div className="flex gap-4">
        <div className="sidebar-left flex-shrink-0">
          {renderComponentsForPlacement('sidebar_left')}
        </div>
        
        <div className="flex-1">
          {/* Inline components would go in the main content area */}
          {renderComponentsForPlacement('inline')}
        </div>
        
        <div className="sidebar-right flex-shrink-0">
          {renderComponentsForPlacement('sidebar_right')}
        </div>
      </div>

      {/* Fullscreen Components */}
      {componentsByPlacement.fullscreen.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="w-full max-w-6xl max-h-[90vh] overflow-auto">
              {renderComponentsForPlacement('fullscreen')}
            </div>
          </div>
        </div>
      )}

      {/* Debug Panel (Development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black/80 p-2 rounded text-xs text-white font-mono max-w-xs">
          <div className="font-bold mb-1">Dynamic Components ({components.length})</div>
          {components.map(comp => (
            <div key={comp.id} className="text-green-400">
              {comp.component}:{comp.id.slice(-8)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

// Create a global handler instance for external access
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

export { DynamicUIManager };
export default DynamicUIManager;