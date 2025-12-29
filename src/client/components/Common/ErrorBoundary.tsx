import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white p-8">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold mb-4 text-red-500">⚠️ Something went wrong</h1>
            <p className="text-slate-400 mb-4">{this.state.error?.message}</p>
            <pre className="text-xs text-left bg-slate-800 p-4 rounded mb-4 overflow-auto">
              {this.state.error?.stack}
            </pre>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
