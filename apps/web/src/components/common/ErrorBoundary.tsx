import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[7BLOCKS CRM] Page render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div className="p-8 space-y-4 max-w-xl mx-auto mt-16">
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-center space-y-3">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-sm font-bold text-rose-300">This page encountered a render error</h2>
            <p className="text-xs text-rose-400/80 font-mono break-all">
              {this.state.error?.message || 'Unknown error'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined });
                window.location.reload();
              }}
              className="mt-3 px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs rounded-lg font-semibold transition-colors"
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
