import { Component, ErrorInfo, ReactNode } from 'react';
import { trackAmplitudeEvent } from '@/lib/analytics/amplitude';
import { AMPLITUDE_EVENTS } from '@/lib/analytics/events';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error to Amplitude
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_OCCURRED, {
      error_type: 'react_error_boundary',
      error_code: error.name || 'REACT_ERROR',
      error_message: error.message,
      error_source: 'error_boundary',
      page_name: window.location.pathname,
      action_attempted: 'render',
      stack_trace: error.stack?.substring(0, 1000), // Limit stack trace length
      component_stack: errorInfo.componentStack?.substring(0, 1000),
    });

    // Also log to console for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    // Track recovery attempt
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_RECOVERY_ATTEMPTED, {
      error_type: 'react_error_boundary',
      recovery_method: 'manual_reset',
      page_name: window.location.pathname,
    } as any);

    // Reset the error boundary state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    // Track reload attempt
    trackAmplitudeEvent(AMPLITUDE_EVENTS.ERROR_RECOVERY_ATTEMPTED, {
      error_type: 'react_error_boundary',
      recovery_method: 'page_reload',
      page_name: window.location.pathname,
    } as any);

    // Reload the page
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            
            <h1 className="text-xl font-semibold text-center text-gray-900 mb-2">
              Something went wrong
            </h1>
            
            <p className="text-sm text-gray-600 text-center mb-6">
              We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
            </p>

            {/* Show error details in development */}
            {import.meta.env.MODE === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-gray-100 rounded-md">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Error Details (Development Only)
                </summary>
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-semibold">{this.state.error.name}:</p>
                  <p className="mb-2">{this.state.error.message}</p>
                  <pre className="overflow-auto max-h-40 text-xs bg-white p-2 rounded">
                    {this.state.error.stack}
                  </pre>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={this.handleReset}
                variant="outline"
                className="flex-1"
              >
                Try Again
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1"
              >
                Reload Page
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center mt-4">
              If you continue to experience issues, please contact{' '}
              <a 
                href="mailto:support@docufen.com" 
                className="text-primary hover:underline"
                onClick={() => {
                  trackAmplitudeEvent(AMPLITUDE_EVENTS.SUPPORT_CONTACTED, {
                    contact_method: 'email',
                    source: 'error_boundary',
                    error_type: this.state.error?.name || 'unknown',
                  } as any);
                }}
              >
                support@docufen.com
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}