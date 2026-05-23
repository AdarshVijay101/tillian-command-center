import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { Bell, Activity, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Clock, Hash, Smartphone, HelpCircle } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';

export const Notifications = () => {
  const [stats, setStats] = useState<any>(null);
  const [latest, setLatest] = useState<any[]>([]);
  const [schedulerHealth, setSchedulerHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useDemoMode();

  const fetchData = async () => {
    setLoading(true);
    const [statsRes, latestRes, schedRes] = await Promise.all([
      api.getNotificationStats(),
      api.getNotificationLatest(10),
      api.getSchedulerHealth()
    ]);
    if (statsRes.ok) setStats(statsRes.data);
    if (latestRes.ok) setLatest(latestRes.data as any[]);
    if (schedRes.ok) setSchedulerHealth(schedRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    window.addEventListener('tillian:refresh', fetchData);
    return () => window.removeEventListener('tillian:refresh', fetchData);
  }, [isDemoMode]);

  if (loading) {
    return <div className="text-white/50 animate-pulse flex items-center gap-2"><Activity size={16} /> Loading Delivery Ledger...</div>;
  }

  const reliabilityScore = stats ? Math.round(((stats.sentToday + stats.fallbackToday) / (stats.deliveriesToday || 1)) * 100) : 0;
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="text-emerald-400" size={16} />;
      case 'failed': return <XCircle className="text-red-400" size={16} />;
      case 'fallback_sent': return <AlertTriangle className="text-amber-400" size={16} />;
      case 'simulated': return <ShieldCheck className="text-blue-400" size={16} />;
      default: return <HelpCircle className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">Delivery Ledger</h1>
            <p className="text-sm text-white/40 flex items-center gap-2">
              Notification Reliability & Auditing {isDemoMode && <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 text-xs">SIMULATED</span>}
            </p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <GlassCard className="p-6">
            <h3 className="text-white/50 text-sm font-medium mb-1 flex items-center gap-2"><Activity size={16}/> Deliveries Today</h3>
            <div className="text-3xl font-display font-bold text-white/90">{stats.deliveriesToday}</div>
          </GlassCard>
          
          <GlassCard glowColor={reliabilityScore > 90 ? "emerald" : "amber"} className="p-6">
            <h3 className="text-white/50 text-sm font-medium mb-1 flex items-center gap-2"><ShieldCheck size={16}/> Reliability Score</h3>
            <div className={`text-3xl font-display font-bold ${reliabilityScore > 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {reliabilityScore}%
            </div>
          </GlassCard>

          <GlassCard glowColor="cyan" className="p-6">
            <h3 className="text-white/50 text-sm font-medium mb-1 flex items-center gap-2"><Smartphone size={16}/> Protocol-Aware</h3>
            <div className="text-3xl font-display font-bold text-cyan-400">{stats.protocolPayloadCount}</div>
          </GlassCard>

          <GlassCard glowColor={stats.staticFallbackCount > 0 ? "amber" : "none"} className="p-6">
            <h3 className="text-white/50 text-sm font-medium mb-1 flex items-center gap-2"><AlertTriangle size={16}/> Static Fallback</h3>
            <div className={`text-3xl font-display font-bold ${stats.staticFallbackCount > 0 ? 'text-amber-400' : 'text-white/90'}`}>
              {stats.staticFallbackCount}
            </div>
          </GlassCard>

          {schedulerHealth && (
            <GlassCard glowColor={schedulerHealth.healthScore === 100 ? "emerald" : "amber"} className="p-6">
              <h3 className="text-white/50 text-sm font-medium mb-1 flex items-center gap-2">
                <Clock size={16}/> Schedule Health
              </h3>
              <div className={`text-3xl font-display font-bold ${schedulerHealth.healthScore === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {schedulerHealth.healthScore}%
              </div>
            </GlassCard>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Deliveries */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Recent Log
          </h2>
          <div className="space-y-4">
            {latest.length > 0 ? latest.map((log) => (
              <GlassCard key={log.id} className="p-5 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(log.delivery_status)}
                    <div>
                      <h4 className="font-semibold text-white/90">{log.title}</h4>
                      <p className="text-xs text-white/40">{new Date(log.sent_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded border border-white/10 uppercase tracking-widest">{log.type}</span>
                    <span className="px-2 py-1 bg-white/5 text-white/60 text-xs rounded border border-white/10 uppercase tracking-widest">{log.source.replace('_', ' ')}</span>
                  </div>
                </div>
                <div className="p-3 bg-black/40 border border-white/5 rounded-lg text-sm text-gray-300 font-mono whitespace-pre-wrap">
                  {log.message_preview}
                </div>
                <div className="flex justify-between items-center text-xs text-white/30 font-mono mt-1">
                  <span className="flex items-center gap-1"><Hash size={10} /> {log.message_hash.substring(0,12)}</span>
                  <span>{log.id}</span>
                </div>
              </GlassCard>
            )) : (
              <div className="p-8 text-center text-white/40 border border-white/5 rounded-xl border-dashed">
                No deliveries recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Breakdown Panel */}
        <div className="space-y-6">
          <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
            <Activity size={18} className="text-primary" />
            14-Day Distribution
          </h2>
          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-white/60 mb-4 uppercase tracking-widest">By Reminder Type</h3>
            <div className="space-y-3">
              {stats && Object.entries(stats.byType).map(([type, count]: any) => (
                <div key={type} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg text-sm">
                  <span className="text-white/80">{type}</span>
                  <span className="text-primary font-bold">{count}</span>
                </div>
              ))}
              {!stats || Object.keys(stats.byType).length === 0 && (
                <p className="text-xs text-white/40">No data</p>
              )}
            </div>

            <h3 className="text-sm font-semibold text-white/60 mt-8 mb-4 uppercase tracking-widest">By Delivery Status</h3>
            <div className="space-y-3">
              {stats && Object.entries(stats.byStatus).map(([status, count]: any) => (
                <div key={status} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-lg text-sm">
                  <span className="text-white/80 flex items-center gap-2">
                    {getStatusIcon(status)}
                    {status.replace('_', ' ')}
                  </span>
                  <span className="text-primary font-bold">{count}</span>
                </div>
              ))}
              {!stats || Object.keys(stats.byStatus).length === 0 && (
                <p className="text-xs text-white/40">No data</p>
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
