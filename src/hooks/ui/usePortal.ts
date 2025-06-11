import { useEffect, useRef } from 'react';

/**
 * Simple portal hook for rendering modals at document root
 */
export function usePortal(id: string = 'modal-root'): HTMLElement | null {
  const rootElemRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Look for existing portal root
    let rootElem = document.getElementById(id);
    
    // Create portal root if it doesn't exist
    if (!rootElem) {
      rootElem = document.createElement('div');
      rootElem.setAttribute('id', id);
      document.body.appendChild(rootElem);
    }
    
    rootElemRef.current = rootElem;

    // Cleanup on unmount (only if we created it)
    return () => {
      if (rootElem && rootElem.childNodes.length === 0) {
        rootElem.remove();
      }
    };
  }, [id]);

  return rootElemRef.current;
}