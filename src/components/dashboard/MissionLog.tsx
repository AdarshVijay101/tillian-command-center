import { useEffect, useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { Terminal, Activity, Clock, FileText, Play, CheckCircle2, AlertCircle, Loader2, Search, Film, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { RunReplayModal } from '../ui/RunReplayModal';

export const MissionLog = ({ onOpenRun }: { onOpenRun: (id: string) => void }) => {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [replayRun, setReplayRun] = useState<any | null>(null);
  const [clearText, setClearText] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchRuns = async () => {
    try {
      const [runsRes, jobsRes] = await Promise.all([
        api.getRuns(),
        api.getJobs()
      ]);
      
      let allItems: any[] = [];
      if (runsRes.ok) {
        allItems = allItems.concat((runsRes.data as any[]).map(r => ({ ...r, type: 'run' })));
      }
      if (jobsRes.ok) {
        allItems = allItems.concat((jobsRes.data as any[]).map(j => ({
          ...j,
          type: 'job',
          id: j.id,
          actionLabel: `Job: ${j.title}`,
          category: 'Agent Orchestration',
          status: j.status === 'succeeded' ? 'success' : j.status === 'failed' ? 'error' : j.status === 'running' ? 'running' : 'running', // Treat pending/blocked as running for icon
          startedAt: j.created_at,
          durationMs: j.duration_ms
        })));
      }
      
      allItems.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
      setRuns(allItems);
      setLastRefreshed(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
    const handleRefresh = () => fetchRuns();
    window.addEventListener('tillian:refresh', handleRefresh);
    const interval = setInterval(fetchRuns, 10000); // Also poll every 10s
    return () => {
      window.removeEventListener('tillian:refresh', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'success': return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20' };
      case 'running': return { icon: Loader2, color: 'text-primary animate-pulse', bg: 'bg-primary/10', border: 'border-primary/20' };
      case 'error': return { icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20' };
      case 'timeout': return { icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10', border: 'border-amber-400/20' };
      default: return { icon: Activity, color: 'text-white/50', bg: 'bg-white/5', border: 'border-white/10' };
    }
  };

  const handleClear = async () => {
    if (clearText === 'CLEAR LOCAL LEDGER') {
      await api.clearRuns();
      setClearText('');
      fetchRuns();
    }
  };

  const filteredRuns = runs.filter(run => {
    // Basic filter
    if (filter === 'Success' && run.status !== 'success') return false;
    if (filter === 'Running' && run.status !== 'running') return false;
    if (filter === 'Error' && run.status !== 'error') return false;
    if (filter === 'Routine' && run.category !== 'Routine Reminder') return false;
    if (filter === 'Dynamic Adjustment' && run.category !== 'Dynamic Adjustment') return false;
    if (filter === 'Agent Orchestration' && run.category !== 'Agent Orchestration') return false;
    if (filter === 'Scheduled Task' && run.category !== 'Scheduled Task') return false;

    // Search
    if (search) {
      const q = search.toLowerCase();
      if (!run.actionLabel.toLowerCase().includes(q) && 
          !run.category.toLowerCase().includes(q) && 
          !(run.stdout || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">Mission Log</h1>
            <p className="text-sm text-white/40">Action run ledger and execution history</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <button onClick={fetchRuns} className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-medium transition-colors">
            Refresh Ledger
          </button>
          {lastRefreshed && (
            <span className="text-[10px] text-gray-500 mt-1">Last refreshed at {lastRefreshed.toLocaleTimeString()}</span>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <GlassCard className="p-4 flex flex-col md:flex-row gap-4 justify-between items-center z-20 relative">
        <div className="flex flex-wrap gap-2">
          {['All', 'Success', 'Running', 'Error', 'Routine', 'Dynamic Adjustment', 'Agent Orchestration', 'Scheduled Task'].map(f => (
            <button 
              key={f} 
              onClick={() => setFilter(f)}
              className={clsx("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border", filter === f ? "bg-primary/20 text-primary border-primary/30" : "bg-white/5 text-white/50 border-transparent hover:bg-white/10 hover:text-white/80")}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        {loading && runs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-white/40">
            <Loader2 size={32} className="animate-spin mb-4 text-primary/50" />
            <p>Accessing ledger records...</p>
          </div>
        ) : runs.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-white/40">
            <FileText size={48} className="mb-4 text-white/20" />
            <p>No missions recorded yet.</p>
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-white/40">
            <FileText size={48} className="mb-4 text-white/20" />
            <p>No matching missions found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRuns.map(run => {
              const { icon: StatusIcon, color, bg, border } = getStatusConfig(run.status);
              return (
                <div key={run.id} className={clsx("p-4 rounded-xl border bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-white/[0.02]", border)}>
                  <div className="flex items-start gap-4 flex-1">
                    <div className={clsx("p-2 rounded-lg mt-1", bg)}>
                      <StatusIcon size={16} className={clsx(color, run.status === 'running' ? 'animate-spin' : '')} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white/90">{run.actionLabel}</span>
                        <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/50">{run.category}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-white/40">
                        <span className="flex items-center gap-1"><Clock size={12} /> {run.startedAt ? formatDistanceToNow(new Date(run.startedAt), { addSuffix: true }) : 'Pending'}</span>
                        {run.durationMs != null && <span>Duration: {(run.durationMs / 1000).toFixed(1)}s</span>}
                        <span className="font-mono text-[10px] opacity-50">ID: {run.id.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 flex items-center gap-2">
                    <button 
                      onClick={() => setReplayRun(run)}
                      className="px-3 py-2 flex items-center gap-2 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 text-sm font-medium transition-colors"
                    >
                      <Film size={14} />
                      Replay
                    </button>
                    <button 
                      onClick={() => onOpenRun(run.id)}
                      className="px-3 py-2 flex items-center gap-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/20 text-primary text-sm font-medium transition-colors"
                    >
                      <Play size={14} />
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </GlassCard>

      <div className="flex flex-col items-end gap-2 pt-8 opacity-50 hover:opacity-100 transition-opacity">
        <p className="text-[10px] uppercase tracking-widest text-red-400/80">Danger Zone</p>
        <div className="flex gap-2">
          <input 
            type="text" 
            placeholder="Type CLEAR LOCAL LEDGER" 
            value={clearText}
            onChange={e => setClearText(e.target.value)}
            className="bg-black/40 border border-red-500/20 rounded pl-3 pr-3 py-1.5 text-xs text-red-300 placeholder-red-500/30 focus:outline-none"
          />
          <button 
            onClick={handleClear}
            disabled={clearText !== 'CLEAR LOCAL LEDGER'}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 border border-red-500/30 rounded text-xs text-red-400 transition-colors"
          >
            <Trash2 size={12} /> Clear Ledger
          </button>
        </div>
      </div>

      {replayRun && <RunReplayModal run={replayRun} onClose={() => setReplayRun(null)} />}
    </div>
  );
};
