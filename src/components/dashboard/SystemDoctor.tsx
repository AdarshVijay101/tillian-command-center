import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { 
  Server, TerminalSquare, FolderOpen, Code, Clock, Stethoscope, 
  RefreshCw, CheckCircle2, AlertCircle, Copy, Play, Bell, CalendarClock, ShieldCheck, FileText, Package
} from 'lucide-react';
import { api } from '../../services/api';
import { clsx } from 'clsx';

export const SystemDoctor = ({ onRunAction }: { onRunAction: (name: string, apiCall: () => Promise<any>) => void }) => {
  const [diag, setDiag] = useState<any>(null);
  const [suite, setSuite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    setLoading(true);
    const [diagRes, notifRes, schedRes, suiteRes, jobsRes, artifactRes, evidenceRes] = await Promise.all([
      api.getDiagnostics(),
      api.getNotificationStats(),
      api.getSchedulerHealth(),
      api.getSystemTestSuite(),
      api.getJobStats(),
      api.getArtifactReviewStats(),
      api.getEvidenceStats()
    ]);
    
    if (diagRes.ok) {
      setDiag({
        ...(diagRes.data as object),
        notifications: notifRes.ok ? notifRes.data : null,
        scheduler: schedRes.ok ? schedRes.data : null,
        jobs: jobsRes.ok ? jobsRes.data : null,
        artifacts: artifactRes.ok ? artifactRes.data : null,
        evidence: evidenceRes.ok ? evidenceRes.data : null
      });
      setError(null);
    } else {
      setError(diagRes.error || "Failed to reach backend");
    }
    
    if (suiteRes.ok) {
      setSuite(suiteRes.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const copyFix = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
  };

  const getStatusColor = (isOk: boolean, warn = false) => 
    isOk ? "text-emerald-400" : warn ? "text-amber-400" : "text-red-400";

  const getStatusBg = (isOk: boolean, warn = false) => 
    isOk ? "bg-emerald-500/10 border-emerald-500/20" : warn ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20";

  const renderBadge = (isOk: boolean, okText: string, failText: string, warn = false) => (
    <div className={clsx("px-3 py-1 rounded-full border text-[10px] font-display font-bold tracking-widest flex items-center gap-2 w-max", getStatusBg(isOk, warn))}>
      {isOk ? <CheckCircle2 size={12} className={getStatusColor(isOk, warn)} /> : <AlertCircle size={12} className={getStatusColor(isOk, warn)} />}
      <span className={getStatusColor(isOk, warn)}>{isOk ? okText : failText}</span>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-white tracking-wide flex items-center gap-3">
            <Stethoscope className="text-primary" size={28} />
            System Doctor
          </h1>
          <p className="text-white/40 mt-2 font-mono text-sm uppercase tracking-widest">Diagnostics & Real-Machine Verification</p>
        </div>
        <button 
          onClick={fetchDiagnostics} 
          disabled={loading}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all"
        >
          <RefreshCw size={16} className={clsx("text-white/60", loading && "animate-spin")} />
          <span className="text-white/80 font-semibold">Run Full Scan</span>
        </button>
      </div>

      {error && !diag && (
        <GlassCard glowColor="red" className="p-6">
          {renderBadge(false, "", "BACKEND OFFLINE", false)}
          <p className="text-white/70 mt-4 mb-4 font-mono">{error}</p>
          <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex justify-between items-center group">
            <code className="text-white/60 text-sm font-mono">npm run server</code>
            <button onClick={() => copyFix('npm run server')} className="text-white/40 group-hover:text-white transition-colors">
              <Copy size={16} />
            </button>
          </div>
        </GlassCard>
      )}

      {loading && !diag && !error && (
        <div className="text-center py-20 text-white/50 animate-pulse font-mono uppercase tracking-widest">
          Initiating diagnostic subroutines...
        </div>
      )}

      {diag && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Services & Gateway */}
          <GlassCard glowColor="cyan" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Server className="text-cyan-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Core Services</h2>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-medium mb-1">Local Backend</p>
                  <p className="text-xs text-white/40 mb-2">Node.js Express Server on 127.0.0.1</p>
                </div>
                {renderBadge(diag.health.backendOnline, "ONLINE", "OFFLINE")}
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-medium mb-1">OpenClaw Gateway</p>
                  <p className="text-xs text-white/40 mb-2">Port 18789</p>
                  {!diag.health.openclawGatewayReachable && (
                    <div className="bg-black/40 p-2 rounded border border-white/5 flex flex-col gap-2 mt-2 group">
                      <div className="flex gap-3 items-center">
                        <code className="text-xs text-white/50 font-mono">openclaw gateway run --port 18789</code>
                        <button onClick={() => copyFix('openclaw gateway run --port 18789')}><Copy size={12} className="text-white/40 group-hover:text-white" /></button>
                      </div>
                      <p className="text-[10px] text-amber-500/80 uppercase tracking-widest font-semibold">Run this inside WSL and keep that terminal open.</p>
                    </div>
                  )}
                </div>
                {renderBadge(diag.health.openclawGatewayReachable, "REACHABLE", "OFFLINE", true)}
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-medium mb-1">Browser Server</p>
                  <p className="text-xs text-white/40 mb-2">Port 18791</p>
                </div>
                {renderBadge(diag.health.openclawBrowserReachable, "REACHABLE", "OFFLINE", true)}
              </div>

              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-medium mb-1">WSL Detection</p>
                  <p className="text-xs text-white/40 mb-2">{diag.health.wslDefault}</p>
                </div>
                {renderBadge(diag.health.wslDefault !== 'WSL check failed', "NOMINAL", "CHECK FAILED", true)}
              </div>
            </div>
          </GlassCard>

          {/* Paths & Folders */}
          <GlassCard glowColor="amber" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <FolderOpen className="text-amber-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Volume Mounts</h2>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-white/80 font-medium mb-1">Automation Root</p>
                  <p className="text-xs text-white/40 mb-2">OpenClaw scripts directory</p>
                </div>
                {renderBadge(diag.health.automationRootExists, "LOCATED", "MISSING")}
              </div>

              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <p className="text-white/80 font-medium mb-1">Obsidian Drop Folder</p>
                  <p className="text-xs text-white/40 mb-2">Agent inbox for new plans</p>
                  <p className="text-[10px] text-white/30 font-mono break-all">{diag.config?.dropFolder || "D:\\SECOND BRAIN\\Adarsh_Obsidian_Vault\\Adarsh Second Brain\\04_PROJECTS\\WinningEdge\\_AI_AGENT_INBOX\\_OPENCLAW_DROP"}</p>
                </div>
                {renderBadge(diag.health.dropFolderExists, "LOCATED", "MISSING")}
              </div>

              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <p className="text-white/80 font-medium mb-1">Processed Vault</p>
                  <p className="text-xs text-white/40 mb-2">Agent history and snapshots</p>
                  <p className="text-[10px] text-white/30 font-mono break-all">{diag.config?.processedFolder || "D:\\SECOND BRAIN\\Adarsh_Obsidian_Vault\\Adarsh Second Brain\\04_PROJECTS\\WinningEdge\\_AI_AGENT_INBOX\\_OPENCLAW_DROP\\_PROCESSED"}</p>
                </div>
                {renderBadge(diag.health.processedFolderExists, "LOCATED", "MISSING")}
              </div>
            </div>
          </GlassCard>

          {/* Scripts & Automation */}
          <GlassCard glowColor="emerald" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Code className="text-emerald-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Script Validation</h2>
            </div>
            
            <div className="space-y-3">
              {Object.entries(diag.health.scriptsExist || {}).map(([name, exists]: any) => (
                <div key={name} className="flex justify-between items-center py-1">
                  <p className="text-sm text-white/70 font-mono capitalize">{name.replace(/([A-Z])/g, ' $1').trim()}</p>
                  {renderBadge(exists, "READY", "MISSING")}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Scheduled Tasks */}
          <GlassCard glowColor="purple" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Clock className="text-purple-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Windows Task Scheduler</h2>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-3 pr-2">
              {diag.tasksDetected.map((task: any) => (
                <div key={task.taskName} className="p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-white/90">{task.taskName}</p>
                    {renderBadge(task.exists, task.state || "UNKNOWN", "MISSING")}
                  </div>
                  {task.exists && (
                    <div className="mt-3 pt-3 border-t border-white/5 flex flex-col gap-2">
                      <div className="text-[10px] text-white/40 flex justify-between uppercase tracking-widest font-mono">
                        <span>Last: {task.lastRunTime ? new Date(task.lastRunTime).toLocaleString() : 'N/A'}</span>
                        <span>Next: {task.nextRunTime ? new Date(task.nextRunTime).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="flex gap-2 justify-end mt-1">
                        <button onClick={() => onRunAction(`Enable ${task.taskName}`, () => api.enableScheduledTask(task.taskName))} className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors border border-white/5">Enable</button>
                        <button onClick={() => onRunAction(`Disable ${task.taskName}`, () => api.disableScheduledTask(task.taskName))} className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-white/60 hover:text-white transition-colors border border-white/5">Disable</button>
                        <button onClick={() => onRunAction(`Run ${task.taskName}`, () => api.runScheduledTask(task.taskName))} className="px-3 py-1 rounded bg-primary/10 hover:bg-primary/20 border border-primary/20 text-xs text-primary transition-colors flex items-center gap-1"><Play size={10} /> Run</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </GlassCard>

          {/* Scheduler Health Panel */}
          <GlassCard glowColor="amber" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <CalendarClock className="text-amber-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Scheduler Health</h2>
            </div>
            
            {diag.scheduler ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Status</p>
                    <p className="text-xs text-white/40 mb-2">Overall health score</p>
                  </div>
                  {renderBadge(diag.scheduler.healthScore === 100, `${diag.scheduler.healthScore}% Healthy`, `${diag.scheduler.healthScore}% Degraded`, diag.scheduler.healthScore > 0)}
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Missing Tasks</p>
                    <p className="text-xs text-white/40 mb-2">Allowlisted reminders not found</p>
                  </div>
                  <div className={`text-lg font-bold ${diag.scheduler.missingCount > 0 ? 'text-red-400' : 'text-white/90'}`}>{diag.scheduler.missingCount}</div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Misconfigured Tasks</p>
                    <p className="text-xs text-white/40 mb-2">Wrong time, args, or disabled</p>
                  </div>
                  <div className={`text-lg font-bold ${diag.scheduler.misconfiguredCount > 0 ? 'text-amber-400' : 'text-white/90'}`}>{diag.scheduler.misconfiguredCount}</div>
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm font-mono flex items-center gap-2">
                <AlertCircle size={14} /> Failed to load scheduler health
              </div>
            )}
          </GlassCard>

          {/* Job Queue Panel */}
          <GlassCard glowColor="blue" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Server className="text-blue-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Job Queue</h2>
            </div>
            
            {diag.jobs ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Queue Health</p>
                    <p className="text-xs text-white/40 mb-2">Overall orchestration health</p>
                  </div>
                  {renderBadge(diag.jobs.queueHealthScore === 100, `${diag.jobs.queueHealthScore}% Healthy`, `${diag.jobs.queueHealthScore}% Degraded`, diag.jobs.queueHealthScore > 0)}
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Active Jobs</p>
                    <p className="text-xs text-white/40 mb-2">Running right now</p>
                  </div>
                  <div className={`text-lg font-bold text-white/90`}>{diag.jobs.running}</div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Pending / Approval</p>
                    <p className="text-xs text-white/40 mb-2">Awaiting execution or user approval</p>
                  </div>
                  <div className={`text-lg font-bold text-white/90`}>{diag.jobs.pending}</div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Blocked / Failed Today</p>
                    <p className="text-xs text-white/40 mb-2">Jobs requiring intervention</p>
                  </div>
                  <div className={`text-lg font-bold ${(diag.jobs.blockedToday > 0 || diag.jobs.failedToday > 0) ? 'text-amber-400' : 'text-white/90'}`}>
                    {diag.jobs.blockedToday + diag.jobs.failedToday}
                  </div>
                </div>

                <div className="flex justify-between items-start mt-4 pt-4 border-t border-white/5">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Mission Templates</p>
                    <p className="text-xs text-white/40 mb-2">Loaded from database</p>
                  </div>
                  {renderBadge(suite?.missionTemplatesOk, "SEEDED", "MISSING")}
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm font-mono flex items-center gap-2">
                <AlertCircle size={14} /> Failed to load job queue stats
              </div>
            )}
          </GlassCard>

          {/* Notifications Panel */}
          <GlassCard glowColor="cyan" className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Bell className="text-cyan-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Notification Ledger</h2>
            </div>
            
            {diag.notifications ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Local Notification API</p>
                    <p className="text-xs text-white/40 mb-2">/api/notifications/log</p>
                  </div>
                  {renderBadge(true, "REACHABLE", "OFFLINE")}
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Deliveries Today</p>
                    <p className="text-xs text-white/40 mb-2">Total tracked attempts</p>
                  </div>
                  <div className="text-lg font-bold text-white/90">{diag.notifications.deliveriesToday}</div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Failed Deliveries</p>
                    <p className="text-xs text-white/40 mb-2">Telegram API errors</p>
                  </div>
                  <div className={`text-lg font-bold ${diag.notifications.failedToday > 0 ? 'text-red-400' : 'text-white/90'}`}>{diag.notifications.failedToday}</div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Static Fallbacks</p>
                    <p className="text-xs text-white/40 mb-2">Offline or missing payloads</p>
                  </div>
                  <div className={`text-lg font-bold ${diag.notifications.fallbackToday > 0 ? 'text-amber-400' : 'text-white/90'}`}>{diag.notifications.fallbackToday}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-white/50 italic">Ledger unavailable</div>
            )}
          </GlassCard>

          {/* Reliability Panel */}
          <GlassCard glowColor={suite?.overallReadinessScore === 100 ? 'emerald' : suite?.overallReadinessScore > 50 ? 'amber' : 'red'} className="p-6 space-y-6">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <ShieldCheck className={clsx(suite?.overallReadinessScore === 100 ? "text-emerald-400" : suite?.overallReadinessScore > 50 ? "text-amber-400" : "text-red-400")} size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Reliability Test Harness</h2>
            </div>
            
            {suite ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Readiness Score</p>
                    <p className="text-xs text-white/40 mb-2">Overall system confidence</p>
                  </div>
                  <div className={clsx("text-xl font-bold font-display", suite.overallReadinessScore === 100 ? 'text-emerald-400' : suite.overallReadinessScore > 50 ? 'text-amber-400' : 'text-red-400')}>
                    {suite.overallReadinessScore} / 100
                  </div>
                </div>
                
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Warnings / Errors</p>
                    <p className="text-xs text-white/40 mb-2">Failing validation tests</p>
                  </div>
                  <div className={`text-lg font-bold ${suite.warnings.length > 0 || suite.errors.length > 0 ? 'text-amber-400' : 'text-white/90'}`}>
                    {suite.warnings.length + suite.errors.length}
                  </div>
                </div>

                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-white/80 font-medium mb-1">Diagnostic Report</p>
                    <p className="text-xs text-white/40 mb-2">Use the Reliability tab to export</p>
                  </div>
                  <div className="text-sm font-medium text-primary">Available</div>
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm font-mono flex items-center gap-2">
                <AlertCircle size={14} /> Running test harness...
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <FileText size={16} className="text-indigo-400" />
              Artifact Review Health
            </h3>
            {diag?.artifacts ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Unreviewed Artifacts</span>
                  {renderBadge(diag.artifacts.pendingCount === 0, 'Clean', `${diag.artifacts.pendingCount} Pending`, diag.artifacts.pendingCount > 0)}
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Demo Ready Assets</span>
                  {renderBadge(true, `${diag.artifacts.demoReadyCount} Ready`, '', false)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Action Required</span>
                  <button 
                    onClick={() => document.querySelector<HTMLButtonElement>('[title="REVIEW INBOX"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'review-inbox' }))}
                    className="px-3 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded text-xs transition-colors"
                  >
                    Open Inbox
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm font-mono flex items-center gap-2">
                <AlertCircle size={14} /> Failed to load artifact stats
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-6">
              <Package size={16} className="text-purple-400" />
              Evidence Layer Status
            </h3>
            {diag?.evidence ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Portfolio Evidence Notes</span>
                  {renderBadge(true, `${diag.evidence.evidenceNotesCount} Notes`, '', false)}
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <span className="text-slate-300">Evidence Packages</span>
                  {renderBadge(true, `${diag.evidence.packagesCount} Packages`, '', false)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-300">Action Required</span>
                  <button 
                    onClick={() => document.querySelector<HTMLButtonElement>('[title="EVIDENCE"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'evidence' }))}
                    className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs transition-colors"
                  >
                    Open Evidence
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-white/30 text-sm font-mono flex items-center gap-2">
                <AlertCircle size={14} /> Failed to load evidence stats
              </div>
            )}
          </GlassCard>

          {/* Action Test Panel */}
          <GlassCard glowColor="blue" className="lg:col-span-2 p-6 space-y-6 bg-gradient-to-br from-blue-900/10 to-transparent">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <TerminalSquare className="text-blue-400" size={20} />
              <h2 className="font-display font-semibold text-white tracking-wide">Action Test Panel</h2>
            </div>
            
            <p className="text-sm text-white/50 mb-4">
              Safely test the backend integration. Actions triggered here will open the Mission Log drawer and execute via PowerShell without affecting unintended targets.
            </p>

            <div className="flex flex-wrap gap-4">
              <button onClick={() => onRunAction('Test Gym Reminder', () => api.sendRoutineReminder('gym'))} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white flex items-center gap-2 group transition-all hover:border-blue-400/50 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <Play size={14} className="text-blue-400 group-hover:text-blue-300" />
                Send Gym Reminder
              </button>
              
              <button onClick={() => onRunAction('Test Late Wakeup', () => api.sendDynamicAdjustment('late_wakeup'))} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white flex items-center gap-2 group transition-all hover:border-purple-400/50 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <Play size={14} className="text-purple-400 group-hover:text-purple-300" />
                Send Late Wakeup
              </button>

              <button onClick={() => onRunAction('Start Watchers', () => api.runAction('start-watchers'))} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-semibold text-white flex items-center gap-2 group transition-all hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Play size={14} className="text-emerald-400 group-hover:text-emerald-300" />
                Start Watchers
              </button>
            </div>
          </GlassCard>

        </div>
      )}

    </div>
  );
};
