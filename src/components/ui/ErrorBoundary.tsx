import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, Terminal, RefreshCw, Activity } from 'lucide-react';
import { GlassCard } from './GlassCard';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, showDetails: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#070B1F] flex items-center justify-center p-6 font-sans">
          <GlassCard className="max-w-2xl w-full p-8 border-red-500/30">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-400">
                <AlertCircle size={40} className="animate-pulse" />
              </div>
              
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-2xl font-display font-bold text-white tracking-wide">Interface Module Failed</h1>
                  <p className="text-red-400 mt-2">A critical rendering error occurred in the dashboard UI.</p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-lg">
                    <Activity size={18} />
                    <span className="text-sm font-medium">Backend services and automation runners may still be operational.</span>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={this.handleReload}
                    className="flex items-center gap-2 px-6 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-100 transition-colors"
                  >
                    <RefreshCw size={18} />
                    Reload Dashboard
                  </button>
                  <button 
                    onClick={() => this.setState({ showDetails: !this.state.showDetails })}
                    className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 transition-colors text-sm"
                  >
                    {this.state.showDetails ? 'Hide Diagnostics' : 'View Diagnostics'}
                  </button>
                </div>

                {this.state.showDetails && (
                  <div className="mt-6 p-4 bg-black/40 border border-white/10 rounded-xl overflow-x-auto">
                    <div className="flex items-center gap-2 mb-3 text-red-400">
                      <Terminal size={14} />
                      <span className="text-xs font-mono uppercase tracking-widest">Stack Trace</span>
                    </div>
                    <pre className="text-xs text-white/60 font-mono whitespace-pre-wrap leading-relaxed">
                      {this.state.error?.toString()}
                      {'\n\n'}
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    return this.props.children;
  }
}
