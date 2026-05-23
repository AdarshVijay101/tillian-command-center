import { GlassCard } from '../ui/GlassCard';
import { AlertCircle, CheckCircle2, ShieldAlert, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { useHealth } from '../../hooks/useData';
import { deriveDashboardStatus } from '../../utils/statusMapper';

export const RiskRadar = () => {
  const { data: health, loading, refetch } = useHealth(15000);
  const status = deriveDashboardStatus(health, loading);

  const systems = [
    { name: 'Local Backend', status: loading ? 'nominal' : health?.backendOnline ? 'nominal' : 'error' },
    { name: 'Gateway API', status: loading ? 'nominal' : health?.openclawGatewayReachable ? 'nominal' : 'warning', issue: loading ? undefined : (!health?.openclawGatewayReachable ? 'Offline' : undefined) },
    { name: 'Browser Server', status: loading ? 'nominal' : health?.openclawBrowserReachable ? 'nominal' : 'warning', issue: loading ? undefined : (!health?.openclawBrowserReachable ? 'Offline' : undefined) },
    { name: 'WSL Instance', status: loading ? 'nominal' : health?.wslDefault !== 'WSL check failed' ? 'nominal' : 'error', issue: loading ? 'Checking...' : health?.wslDefault },
    { name: 'Drop Folder', status: loading ? 'nominal' : health?.dropFolderExists ? 'nominal' : 'error' },
  ];

  return (
    <GlassCard glowColor="amber" className="p-6 h-full flex flex-col relative">
      <button onClick={refetch} className="absolute top-6 right-6 p-1 text-white/40 hover:text-white transition-colors">
        <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
      </button>
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
        <ShieldAlert size={20} className={status.tone === 'danger' ? "text-red-400" : status.tone === 'warning' ? "text-amber-400" : "text-emerald-400"} />
        <h3 className="font-display font-semibold text-white tracking-wide">System Health</h3>
        <div className="ml-auto flex h-2 w-2 relative">
          <span className={clsx("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", status.tone === 'danger' ? "bg-red-400" : status.tone === 'warning' ? "bg-amber-400" : "bg-emerald-400")}></span>
          <span className={clsx("relative inline-flex rounded-full h-2 w-2", status.tone === 'danger' ? "bg-red-500" : status.tone === 'warning' ? "bg-amber-500" : "bg-emerald-500")}></span>
        </div>
      </div>

      <div className="space-y-4 flex-1 overflow-y-auto pr-2">
        {systems.map((sys, idx) => (
          <div key={idx} className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              {sys.status === 'nominal' ? (
                <CheckCircle2 size={14} className="text-emerald-400 opacity-70 group-hover:opacity-100 transition-opacity" />
              ) : sys.status === 'warning' ? (
                <AlertCircle size={14} className="text-amber-400" />
              ) : (
                <AlertCircle size={14} className="text-red-400" />
              )}
              <span className={clsx("text-sm transition-colors", sys.status === 'nominal' ? "text-white/60 group-hover:text-white/90" : sys.status === 'warning' ? "text-amber-400/90" : "text-red-400/90")}>
                {sys.name}
              </span>
            </div>
            {sys.issue && (
              <span className="text-[10px] text-amber-400/70 border border-amber-400/20 px-2 py-0.5 rounded uppercase tracking-wider">
                {sys.issue}
              </span>
            )}
          </div>
        ))}
      </div>
    </GlassCard>
  );
};
