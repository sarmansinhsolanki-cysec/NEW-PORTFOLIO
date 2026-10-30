import React from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    const raw = error instanceof Error ? error.message : String(error);
    let friendly = raw;
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.error === 'string') {
        friendly = parsed.error.includes('Quota exceeded')
          ? 'Daily Firestore free-tier quota exceeded. Quota resets tomorrow.'
          : `Database permission or sync error (${parsed.operationType} on ${parsed.path}): ${parsed.error}`;
      }
    } catch {
      // Plain error string
    }
    return { hasError: true, message: friendly };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#060714] p-6 text-[#f2f2f2]">
          <div className="max-w-lg w-full border border-white/20 bg-[#090b1d] p-8 space-y-4">
            <div className="font-mono text-xs text-[#ff8585]">Application Runtime Alert</div>
            <h1 className="font-display text-3xl text-white">Unable to complete operation</h1>
            <p className="text-sm text-[#c5cae8] leading-relaxed">{this.state.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="bg-[#1822f2] px-4 py-2 font-mono text-xs text-white hover:bg-[#2d37ff] cursor-pointer"
            >
              Dismiss & Reload View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
