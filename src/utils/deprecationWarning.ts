/**
 * Deprecation Warning Utility
 * 
 * This utility provides a way to mark methods as deprecated and log warnings
 * when they are called. These warnings will help developers identify code that
 * needs to be migrated to the new unified auth system.
 * 
 * @author BranchManager69
 * @version 1.0.0
 * @created 2025-05-05
 */

// Track which warnings have been shown to avoid spamming console
const shownWarnings = new Set<string>();

/**
 * Create a wrapper for a deprecated function that logs a warning when called
 * 
 * @param fn The function to wrap
 * @param oldName The old function name/pattern
 * @param newName The new recommended function name/pattern
 * @param context Additional context about what's being deprecated
 * @returns A wrapped function that behaves the same but logs warnings
 */
export function deprecatedFunction<T extends Function>(
  fn: T,
  oldName: string,
  newName: string,
  context?: string
): T {
  const warningKey = `${oldName}-${newName}`;
  
  const wrapped = function(this: any, ...args: any[]) {
    // Only show each warning once per session to avoid spam
    if (!shownWarnings.has(warningKey)) {
      const message = `DEPRECATED: '${oldName}' is deprecated. Use '${newName}' instead.${context ? ` ${context}` : ''}`;
      
      // Show both console warning and trace to help locate the call site
      console.warn(message);
      console.trace(`DEPRECATION TRACE: '${oldName}' call site`);
      
      // Mark this warning as shown
      shownWarnings.add(warningKey);
    }
    
    // Call the original function with the correct 'this' context
    return fn.apply(this, args);
  };
  
  // Return the wrapped function
  return wrapped as unknown as T;
}

/**
 * Mark a property access as deprecated with an appropriate warning
 * 
 * @param target The object containing the property
 * @param propName The property name to mark as deprecated
 * @param newName The new recommended property name
 * @param context Additional context about what's being deprecated
 */
export function deprecatedProperty<T extends object, K extends keyof T>(
  target: T,
  propName: K,
  newName: string,
  context?: string
): void {
  const warningKey = `${String(propName)}-${newName}`;
  const originalValue = target[propName];
  
  // Define a property that logs a warning when accessed
  Object.defineProperty(target, propName, {
    get: function() {
      if (!shownWarnings.has(warningKey)) {
        const message = `DEPRECATED: '${String(propName)}' property is deprecated. Use '${newName}' instead.${context ? ` ${context}` : ''}`;
        
        console.warn(message);
        console.trace(`DEPRECATION TRACE: '${String(propName)}' property access`);
        
        shownWarnings.add(warningKey);
      }
      
      return originalValue;
    },
    
    // If it's writable, preserve that behavior
    set: function(newValue) {
      if (!shownWarnings.has(`${warningKey}-write`)) {
        const message = `DEPRECATED: Writing to '${String(propName)}' is deprecated. Use '${newName}' instead.${context ? ` ${context}` : ''}`;
        
        console.warn(message);
        console.trace(`DEPRECATION TRACE: '${String(propName)}' property write`);
        
        shownWarnings.add(`${warningKey}-write`);
      }
      
      target[propName] = newValue;
    },
    
    enumerable: true,
    configurable: true
  });
}