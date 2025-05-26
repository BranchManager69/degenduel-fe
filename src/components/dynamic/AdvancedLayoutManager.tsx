// src/components/dynamic/AdvancedLayoutManager.tsx

/**
 * Advanced Layout Manager for Dynamic UI System
 * 
 * @description Production-grade layout manager supporting all placement types
 * @author BranchManager69 + Claude Code
 * @version 2.0.0 - Production Ready
 * @created 2025-05-26
 */

import React, { useState, useCallback, useMemo, useEffect, createContext, useContext } from 'react';
import { 
  ComponentPlacement, 
  ComponentState, 
  LayoutState, 
  ComponentAnimation 
} from './types';

// Layout Context for global layout state
interface LayoutContextType {
  layoutState: LayoutState;
  registerComponent: (component: ComponentState) => void;
  unregisterComponent: (componentId: string) => void;
  updateComponentPlacement: (componentId: string, placement: ComponentPlacement) => void;
  requestMainView: (componentId: string) => boolean;
  releaseMainView: (componentId: string) => void;
  openSidebar: (side: 'left' | 'right', width?: string) => void;
  closeSidebar: (side: 'left' | 'right') => void;
  pushModal: (componentId: string) => void;
  popModal: () => string | undefined;
  isResponsive: boolean;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within AdvancedLayoutManager');
  }
  return context;
};

// Animation variants for different placements
const getPlacementAnimations = (placement: ComponentPlacement, animation: ComponentAnimation = 'fade_in') => {
  const baseAnimations = {
    fade_in: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 }
    },
    slide_up: {
      initial: { y: 50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: -50, opacity: 0 }
    },
    slide_down: {
      initial: { y: -50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      exit: { y: 50, opacity: 0 }
    },
    slide_left: {
      initial: { x: 50, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -50, opacity: 0 }
    },
    slide_right: {
      initial: { x: -50, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 50, opacity: 0 }
    },
    scale_in: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.8, opacity: 0 }
    },
    bounce_in: {
      initial: { scale: 0.3, opacity: 0 },
      animate: { 
        scale: 1, 
        opacity: 1,
        transition: { type: "spring", damping: 12, stiffness: 200 }
      },
      exit: { scale: 0.3, opacity: 0 }
    },
    flip_in: {
      initial: { rotateY: -90, opacity: 0 },
      animate: { rotateY: 0, opacity: 1 },
      exit: { rotateY: 90, opacity: 0 }
    },
    none: {
      initial: {},
      animate: {},
      exit: {}
    }
  };

  // Placement-specific animation modifications
  const placementModifications: Record<ComponentPlacement, any> = {
    main_view: {
      initial: { scale: 0.95, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.95, opacity: 0 }
    },
    modal: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.9, opacity: 0 }
    },
    sidebar_left: {
      initial: { x: -300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -300, opacity: 0 }
    },
    sidebar_right: {
      initial: { x: 300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: 300, opacity: 0 }
    },
    sidebar: {
      initial: { x: -300, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      exit: { x: -300, opacity: 0 }
    },
    floating: {
      initial: { scale: 0.8, y: 20, opacity: 0 },
      animate: { scale: 1, y: 0, opacity: 1 },
      exit: { scale: 0.8, y: -20, opacity: 0 }
    },
    below_terminal: baseAnimations[animation] || baseAnimations.fade_in,
    above_terminal: baseAnimations[animation] || baseAnimations.fade_in,
    inline: baseAnimations[animation] || baseAnimations.fade_in,
    fullscreen: {
      initial: { scale: 0.98, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      exit: { scale: 0.98, opacity: 0 }
    }
  };

  return placementModifications[placement] || baseAnimations[animation] || baseAnimations.fade_in;
};

// Responsive breakpoint hook
const useResponsive = () => {
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setBreakpoint('mobile');
      } else if (width < 1024) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    updateBreakpoint();
    window.addEventListener('resize', updateBreakpoint);
    return () => window.removeEventListener('resize', updateBreakpoint);
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isResponsive: breakpoint !== 'desktop'
  };
};

// Main Layout Manager Component
interface AdvancedLayoutManagerProps {
  children: React.ReactNode;
  className?: string;
}

export const AdvancedLayoutManager: React.FC<AdvancedLayoutManagerProps> = ({ children, className = '' }) => {
  const responsive = useResponsive();
  
  // Layout state management
  const [layoutState, setLayoutState] = useState<LayoutState>({
    mainView: {
      occupied: false,
      componentId: undefined,
      previousContent: undefined
    },
    sidebars: {
      left: {
        open: false,
        width: '320px',
        components: []
      },
      right: {
        open: false,
        width: '320px',
        components: []
      }
    },
    modals: {
      stack: [],
      maxDepth: 3
    },
    floating: {
      components: [],
      maxCount: 4
    }
  });

  // Component registry for tracking active components
  const [componentRegistry, setComponentRegistry] = useState<Map<string, ComponentState>>(new Map());

  // Register a new component
  const registerComponent = useCallback((component: ComponentState) => {
    setComponentRegistry(prev => new Map(prev.set(component.id, component)));
    
    // Update layout state based on placement
    setLayoutState(prev => {
      const newState = { ...prev };
      
      switch (component.placement) {
        case 'main_view':
          newState.mainView = {
            occupied: true,
            componentId: component.id,
            previousContent: prev.mainView.previousContent
          };
          break;
          
        case 'sidebar_left':
          newState.sidebars.left.open = true;
          newState.sidebars.left.components.push(component.id);
          break;
          
        case 'sidebar_right':
          newState.sidebars.right.open = true;
          newState.sidebars.right.components.push(component.id);
          break;
          
        case 'modal':
          if (newState.modals.stack.length < newState.modals.maxDepth) {
            newState.modals.stack.push(component.id);
          }
          break;
          
        case 'floating':
          if (newState.floating.components.length < newState.floating.maxCount) {
            newState.floating.components.push(component.id);
          }
          break;
      }
      
      return newState;
    });
  }, []);

  // Unregister a component
  const unregisterComponent = useCallback((componentId: string) => {
    const component = componentRegistry.get(componentId);
    if (!component) return;

    setComponentRegistry(prev => {
      const newRegistry = new Map(prev);
      newRegistry.delete(componentId);
      return newRegistry;
    });

    // Update layout state
    setLayoutState(prev => {
      const newState = { ...prev };
      
      switch (component.placement) {
        case 'main_view':
          newState.mainView = {
            occupied: false,
            componentId: undefined,
            previousContent: undefined
          };
          break;
          
        case 'sidebar_left':
          newState.sidebars.left.components = newState.sidebars.left.components.filter(id => id !== componentId);
          if (newState.sidebars.left.components.length === 0) {
            newState.sidebars.left.open = false;
          }
          break;
          
        case 'sidebar_right':
          newState.sidebars.right.components = newState.sidebars.right.components.filter(id => id !== componentId);
          if (newState.sidebars.right.components.length === 0) {
            newState.sidebars.right.open = false;
          }
          break;
          
        case 'modal':
          newState.modals.stack = newState.modals.stack.filter(id => id !== componentId);
          break;
          
        case 'floating':
          newState.floating.components = newState.floating.components.filter(id => id !== componentId);
          break;
      }
      
      return newState;
    });
  }, [componentRegistry]);

  // Layout control functions
  const requestMainView = useCallback((componentId: string): boolean => {
    if (layoutState.mainView.occupied && layoutState.mainView.componentId !== componentId) {
      return false; // Main view is occupied by another component
    }
    return true;
  }, [layoutState.mainView]);

  const releaseMainView = useCallback((componentId: string) => {
    if (layoutState.mainView.componentId === componentId) {
      setLayoutState(prev => ({
        ...prev,
        mainView: {
          occupied: false,
          componentId: undefined,
          previousContent: undefined
        }
      }));
    }
  }, [layoutState.mainView.componentId]);

  const openSidebar = useCallback((side: 'left' | 'right', width: string = '320px') => {
    setLayoutState(prev => ({
      ...prev,
      sidebars: {
        ...prev.sidebars,
        [side]: {
          ...prev.sidebars[side],
          open: true,
          width
        }
      }
    }));
  }, []);

  const closeSidebar = useCallback((side: 'left' | 'right') => {
    setLayoutState(prev => ({
      ...prev,
      sidebars: {
        ...prev.sidebars,
        [side]: {
          ...prev.sidebars[side],
          open: false,
          components: []
        }
      }
    }));
  }, []);

  const pushModal = useCallback((componentId: string) => {
    setLayoutState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        stack: [...prev.modals.stack, componentId]
      }
    }));
  }, []);

  const popModal = useCallback((): string | undefined => {
    let poppedId: string | undefined;
    setLayoutState(prev => {
      const newStack = [...prev.modals.stack];
      poppedId = newStack.pop();
      return {
        ...prev,
        modals: {
          ...prev.modals,
          stack: newStack
        }
      };
    });
    return poppedId;
  }, []);

  const updateComponentPlacement = useCallback((componentId: string, placement: ComponentPlacement) => {
    const component = componentRegistry.get(componentId);
    if (!component) return;

    // Unregister from old placement
    unregisterComponent(componentId);
    
    // Register with new placement
    registerComponent({
      ...component,
      placement
    });
  }, [componentRegistry, unregisterComponent, registerComponent]);

  // Context value
  const contextValue: LayoutContextType = useMemo(() => ({
    layoutState,
    registerComponent,
    unregisterComponent,
    updateComponentPlacement,
    requestMainView,
    releaseMainView,
    openSidebar,
    closeSidebar,
    pushModal,
    popModal,
    isResponsive: responsive.isResponsive,
    breakpoint: responsive.breakpoint
  }), [
    layoutState,
    registerComponent,
    unregisterComponent,
    updateComponentPlacement,
    requestMainView,
    releaseMainView,
    openSidebar,
    closeSidebar,
    pushModal,
    popModal,
    responsive.isResponsive,
    responsive.breakpoint
  ]);

  return (
    <LayoutContext.Provider value={contextValue}>
      <div className={`advanced-layout-manager ${className}`}>
        {children}
      </div>
    </LayoutContext.Provider>
  );
};

// Export animation utilities
export { getPlacementAnimations };

export default AdvancedLayoutManager;