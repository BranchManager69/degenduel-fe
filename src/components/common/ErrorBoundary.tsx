import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  showError?: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Return fallback UI or default error message
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show error details in development, hide in production
      if (this.props.showError && process.env.NODE_ENV === 'development') {
        return (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
            <h3 className="font-semibold mb-2">Component Error</h3>
            <p className="text-sm opacity-80">{this.state.error?.message}</p>
          </div>
        );
      }

      // Silent failure in production - just don't render anything
      return null;
    }

    return this.props.children;
  }
}

// Convenience wrapper for silent failures
export const SilentErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary>
    {children}
  </ErrorBoundary>
); 