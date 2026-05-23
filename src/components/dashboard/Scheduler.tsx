import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { Activity, Clock, CheckCircle2, CalendarClock, ShieldAlert, RefreshCw, Wrench, X, Terminal, Loader2 } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';
import { clsx } from 'clsx';

export const Scheduler = () => {
  const [health, setHealth] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [repairInput, setRepairInput] = useState('');
  const [showRepairConfirm, setShowRepairConfirm] = useState(false);
  const { isDemoMode } = useDemoMode();

  // Action Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [actionOutput, setActionOutput] = useState<string>('');
  const [actionTitle, setActionTitle] = useState<string>('');
  const [isActionRunning, setIsActionRunning] = useState(false);

  const fetchAudit = async () => {
    setLoading(true);
    const [healthRes, auditRes] = await Promise.all([
      api.getSchedulerHealth(),
      api.getSchedulerAudit()
    ]);
    if (healthRes.ok) setHealth(healthRes.data);
    if (auditRes.ok) setAudit(auditRes.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAudit();
  }, [isDemoMode]);

  const handleAction = async (title: string, actionFn: () => Promise<any>) => {
    setActionTitle(title);
    setDrawerOpen(true);
    setIsActionRunning(true);
    setActionOutput(`Executing ${title}...`);
    
    try {
      const res = await actionFn();
      if (res.ok) {
        setActionOutput(`[SUCCESS] ${title}\n\n${res.data?.stdout || JSON.stringify(res.data, null, 2)}`);
      } else {
        setActionOutput(`[ERROR] ${title}\n\n${res.error}`);
      }
    } catch (e: any) {
      setActionOutput(`[FATAL ERROR] ${e.message}`);
    } finally {
      setIsActionRunning(false);
      fetchAudit(); // Refresh after any action
    }
  };

  const handleRepairAll = () => {
    if (repairInput !== 'REPAIR SAFE REMINDERS') return;
    setShowRepairConfirm(false);
    setRepairInput('');
    handleAction('Repair All Safe Tasks', () => api.repairAllSchedulerTasks());
  };

  if (loading && !audit) {
    return <div className="text-white/50 animate-pulse flex items-center gap-2"><Activity size={16} /> Auditing Scheduled Tasks...</div>;
  }

  const { auditRows = [], repairPlans = [] } = audit || {};

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <CalendarClock size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">
              {isDemoMode ? 'DEMO SCHEDULER - SIMULATED' : 'Scheduled Routine Orchestrator'}
            </h1>
            <p className="text-white/50 text-sm font-mono mt-1">Windows Task Scheduler Verification & Repair</p>
          </div>
        </div>
        <button 
          onClick={fetchAudit}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 text-white font-mono text-sm transition-colors"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Audit Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Activity size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">Health Score</span>
          </div>
          <div className={clsx("text-4xl font-display font-bold", (health?.healthScore || 0) === 100 ? "text-emerald-400" : "text-amber-400")}>
            {health?.healthScore || 0}%
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <CheckCircle2 size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">Healthy Tasks</span>
          </div>
          <div className="text-4xl font-display font-bold text-emerald-400">
            {health?.foundCount - health?.misconfiguredCount || 0}
            <span className="text-lg text-white/30 ml-2">/ {health?.expectedCount || 12}</span>
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <ShieldAlert size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">Missing Tasks</span>
          </div>
          <div className={clsx("text-4xl font-display font-bold", (health?.missingCount || 0) > 0 ? "text-red-400" : "text-white")}>
            {health?.missingCount || 0}
          </div>
        </GlassCard>
        <GlassCard className="p-6">
          <div className="flex items-center gap-2 text-white/50 mb-2">
            <Wrench size={16} />
            <span className="font-mono text-xs uppercase tracking-wider">Misconfigured</span>
          </div>
          <div className={clsx("text-4xl font-display font-bold", (health?.misconfiguredCount || 0) > 0 ? "text-amber-400" : "text-white")}>
            {health?.misconfiguredCount || 0}
          </div>
        </GlassCard>
      </div>

      {health?.healthScore < 100 && (
        <GlassCard className="p-6 border-red-500/30 bg-red-500/5">
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="text-red-400 font-display font-bold text-lg flex items-center gap-2">
                <ShieldAlert size={20} />
                Auto-Repair Console
              </h2>
              <p className="text-white/60 text-sm mt-1">Tillian has detected missing or broken reminder tasks. You can repair all safe, allowlisted tasks automatically.</p>
            </div>
            {showRepairConfirm ? (
              <div className="bg-black/40 p-4 rounded-lg border border-red-500/20">
                <p className="text-sm text-red-300 font-mono mb-3">Type "REPAIR SAFE REMINDERS" to confirm modifications to Windows Scheduled Tasks.</p>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={repairInput}
                    onChange={(e) => setRepairInput(e.target.value)}
                    placeholder="REPAIR SAFE REMINDERS"
                    className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono flex-1 outline-none focus:border-red-500/50"
                  />
                  <button 
                    onClick={handleRepairAll}
                    disabled={repairInput !== 'REPAIR SAFE REMINDERS'}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white rounded-lg font-mono text-sm font-bold transition-colors"
                  >
                    Confirm Repair
                  </button>
                  <button 
                    onClick={() => { setShowRepairConfirm(false); setRepairInput(''); }}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg font-mono text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => setShowRepairConfirm(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-200 rounded-lg font-mono text-sm transition-colors w-max"
              >
                <Wrench size={16} />
                Repair All Safe Tasks
              </button>
            )}
          </div>
        </GlassCard>
      )}

      <div className="space-y-4">
        <h2 className="text-lg font-display font-bold text-white flex items-center gap-2">
          <Clock size={18} className="text-primary" />
          Windows Scheduled Task Audit
        </h2>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {auditRows.map((row: any, i: number) => {
            const plan = repairPlans.find((p: any) => p.type === row.expected_type);
            const isHealthy = row.exists_in_os && row.enabled && row.command_ok && row.type_ok && row.timing_ok && !row.duplicate_detected;
            
            return (
              <GlassCard key={i} className={clsx("p-5 flex flex-col justify-between", !isHealthy ? "border-amber-500/30 bg-amber-500/5" : "")}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-white font-bold font-display text-lg">{row.task_name}</h3>
                    <p className="text-white/50 text-sm font-mono mt-1">Expected: {row.expected_time} | Type: {row.expected_type}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isHealthy ? (
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold rounded uppercase tracking-wider">Healthy</span>
                    ) : (
                      <span className="px-2 py-1 bg-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded uppercase tracking-wider">{row.exists_in_os ? 'Misconfigured' : 'Missing'}</span>
                    )}
                    {row.exists_in_os && !row.enabled && <span className="text-red-400 text-xs font-mono font-bold">DISABLED</span>}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                  <div className={clsx("px-2 py-1.5 rounded border text-xs font-mono flex items-center justify-between", row.exists_in_os ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                    Exists {row.exists_in_os ? '✓' : '✗'}
                  </div>
                  <div className={clsx("px-2 py-1.5 rounded border text-xs font-mono flex items-center justify-between", row.command_ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                    Command {row.command_ok ? '✓' : '✗'}
                  </div>
                  <div className={clsx("px-2 py-1.5 rounded border text-xs font-mono flex items-center justify-between", row.type_ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                    Type Arg {row.type_ok ? '✓' : '✗'}
                  </div>
                  <div className={clsx("px-2 py-1.5 rounded border text-xs font-mono flex items-center justify-between", row.timing_ok ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")}>
                    Timing {row.timing_ok ? '✓' : '✗'}
                  </div>
                </div>

                {row.next_run_time && (
                  <div className="text-xs text-white/50 font-mono mb-4 flex items-center gap-1">
                    <Clock size={12} /> Next: {new Date(row.next_run_time).toLocaleString()}
                  </div>
                )}

                {row.warning && (
                  <div className="p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-xs font-mono mb-4">
                    {row.warning}
                  </div>
                )}
                
                {plan?.needsRepair && (
                  <div className="p-3 bg-black/40 rounded border border-white/5 text-xs font-mono mb-4">
                    <div className="text-white/40 mb-1 uppercase tracking-wider text-[10px]">Repair Plan:</div>
                    <ul className="list-disc pl-4 space-y-1 text-white/70">
                      {plan.changes.map((c: string, idx: number) => <li key={idx}>{c}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                  <button 
                    onClick={() => handleAction(`Repair ${row.task_name}`, () => api.repairSchedulerTask(row.expected_type))}
                    className="flex-1 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded text-xs font-mono transition-colors"
                  >
                    Repair Task
                  </button>
                  {row.exists_in_os && row.enabled && (
                    <button 
                      onClick={() => handleAction(`Disable ${row.task_name}`, () => api.disableSchedulerTask(row.expected_type))}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded text-xs font-mono transition-colors"
                    >
                      Disable
                    </button>
                  )}
                  {row.exists_in_os && !row.enabled && (
                    <button 
                      onClick={() => handleAction(`Enable ${row.task_name}`, () => api.enableSchedulerTask(row.expected_type))}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded text-xs font-mono transition-colors"
                    >
                      Enable
                    </button>
                  )}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

      {drawerOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40" onClick={() => setDrawerOpen(false)} />
          <div className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-[#070B1F]/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.1)]">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Terminal className="text-primary" size={20} />
                <h2 className="font-display font-semibold tracking-wide text-lg text-white">{actionTitle}</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} className="text-white/60" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-display mb-1">Status</span>
                {isActionRunning ? (
                  <span className="flex items-center gap-2 text-primary text-sm tracking-widest"><Loader2 size={14} className="animate-spin" /> RUNNING</span>
                ) : (
                  <span className="flex items-center gap-2 text-emerald-400 text-sm tracking-widest"><CheckCircle2 size={14} /> COMPLETE</span>
                )}
              </div>
              <div className="bg-[#02040A]/80 rounded-xl border border-primary/20 p-4 font-mono text-xs overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(34,211,238,0.05)]">
                <div className="whitespace-pre-wrap break-words text-white/80">{actionOutput}</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
