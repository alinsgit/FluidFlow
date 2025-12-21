import React, { ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  private unhandledRejectionHandler: ((event: PromiseRejectionEvent) => void) | null = null;

  constructor(props: Props) {
    super(props);
  }

  // BUG-018 FIX: Handle unhandled promise rejections
  componentDidMount() {
    this.unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason || 'Unhandled promise rejection'));

      logger.error('Unhandled promise rejection', {
        error: error.message,
        stack: error.stack,
        reason: String(event.reason),
      });

      // Call custom error handler if provided
      if (this.props.onError) {
        this.props.onError(error, { componentStack: 'Promise rejection (async error)' } as ErrorInfo);
      }

      // Optionally show error UI for critical rejections
      // Only set hasError if we want to show the error boundary UI
      // For most async errors, logging is sufficient
    };

    window.addEventListener('unhandledrejection', this.unhandledRejectionHandler);
  }

  componentWillUnmount() {
    if (this.unhandledRejectionHandler) {
      window.removeEventListener('unhandledrejection', this.unhandledRejectionHandler);
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to our logging service
    logger.error('React Error Boundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#d63031',
          fontFamily: 'monospace',
        }}>
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>

          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ marginTop: '20px' }}>
              <summary>Error Details</summary>
              <pre style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#f8f9fa',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '12px',
              }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <button
            onClick={this.handleReset}
            style={{
              marginTop: '20px',
              padding: '8px 16px',
              backgroundColor: '#0984e3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC for wrapping components with error boundary
export function withErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  return function WrappedComponent(props: T) {
    return (
      <ErrorBoundary fallback={fallback} onError={onError}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  return (error: Error, errorInfo?: ErrorInfo) => {
    logger.error('Error caught by error handler', {
      error: error.message,
      stack: error.stack,
      errorInfo,
    });
  };
}