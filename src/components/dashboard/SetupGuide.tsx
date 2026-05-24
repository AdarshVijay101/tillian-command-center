import { GlassCard } from '../ui/GlassCard';
import { Terminal, Server, CheckCircle2, AlertCircle, Lock, Database, Settings } from 'lucide-react';
import { useHealth, useValidation } from '../../hooks/useData';
import { api } from '../../services/api';
import { useState, useEffect } from 'react';

export const SetupGuide = ({ onRunAction }: { onRunAction?: (name: string, apiCall: () => Promise<any>) => void }) => {
  const { data: health } = useHealth();
  const { data: validation } = useValidation();
  const [dbStatus, setDbStatus] = useState<any>(null);

  useEffect(() => {
    const fetchDb = async () => {
      const res = await api.getDbStatus();
      if (res.ok) setDbStatus(res.data);
    };
    fetchDb();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">Startup Command Center</h1>
            <p className="text-sm text-white/40">Local setup, health checks, and GitHub readiness</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Startup Guide */}
        <GlassCard className="p-6 space-y-6">
          <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
            <Server size={18} className="text-primary" />
            Launch Sequences
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <p className="text-xs uppercase tracking-widest text-white/40">Start All Services</p>
              <code className="block bg-[#070B1F] p-3 rounded-lg text-emerald-400 font-mono text-sm border border-emerald-500/20">
                npm run dev:all
              </code>
              <p className="text-xs text-white/60">Starts both Vite frontend and Express backend concurrently.</p>
            </div>
            
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <p className="text-xs uppercase tracking-widest text-white/40">Start OpenClaw Gateway</p>
              <code className="block bg-[#070B1F] p-3 rounded-lg text-purple-400 font-mono text-sm border border-purple-500/20">
                openclaw gateway run --port 18789
              </code>
              <p className="text-xs text-white/60">Required for Heavy AI Actions. Connects to WSL Ubuntu-24.04.</p>
            </div>
          </div>
        </GlassCard>

        {/* Live Config Validation */}
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-primary" />
              Live Config Validation
            </h2>
            {validation?.passed ? (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                PASSED
              </span>
            ) : (
              <span className="px-3 py-1 bg-red-500/10 text-red-400 text-xs font-semibold rounded-full border border-red-500/30">
                FAILED
              </span>
            )}
          </div>

          <div className="space-y-3">
            {[
              { label: 'Backend Binding to 127.0.0.1', pass: validation?.details.backendHostLocal },
              { label: 'Drop Folder Exists', pass: validation?.details.dropFolderExists },
              { label: 'Processed Folder Exists', pass: validation?.details.processedFolderExists },
              { label: 'No Hardcoded Secrets Loaded', pass: validation?.details.noSecretsLoaded },
              { label: 'Backend Online', pass: health?.backendOnline }
            ].map((check, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">{check.label}</span>
                {check.pass ? (
                  <CheckCircle2 size={16} className="text-emerald-400" />
                ) : (
                  <AlertCircle size={16} className="text-red-400" />
                )}
              </div>
            ))}
            
            {!validation?.passed && validation?.fixCommands?.length > 0 && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <p className="text-xs font-semibold text-red-400 mb-2">Required Fixes:</p>
                {validation.fixCommands.map((cmd: string, i: number) => (
                  <code key={i} className="block text-xs font-mono text-white/80 bg-[#070B1F] p-2 rounded mb-1">{cmd}</code>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Database Status */}
        <GlassCard className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
              <Database size={18} className="text-primary" />
              SQLite Intelligence
            </h2>
            {dbStatus?.dbExists ? (
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-semibold rounded-full border border-emerald-500/30">
                ONLINE
              </span>
            ) : (
              <span className="px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-semibold rounded-full border border-amber-500/30">
                INITIALIZING
              </span>
            )}
          </div>

          <div className="space-y-3">
            {[
              { label: 'Action Runs Captured', value: dbStatus?.actionRunsCount || 0 },
              { label: 'Generated Files Tracked', value: dbStatus?.generatedFilesCount || 0 },
              { label: 'Health Snapshots', value: dbStatus?.healthSnapshotsCount || 0 }
            ].map((stat, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <span className="text-sm text-white/70">{stat.label}</span>
                <span className="text-sm font-display font-bold text-white/90">{stat.value}</span>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-4 border-t border-white/10">
            <p className="text-xs uppercase tracking-widest text-white/40 mb-3">Manual Synchronization</p>
            <button
              onClick={() => onRunAction?.('Sync Database', api.syncDbFiles)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-colors text-sm text-white/70"
            >
              Sync Drop Folder to SQLite
            </button>
            <button
              onClick={() => onRunAction?.('Seed Mission Templates', api.seedMissionTemplates)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-300 rounded-xl font-medium transition-colors text-sm"
            >
              Seed Mission Templates
            </button>
            <button
              onClick={() => onRunAction?.('Sync Artifact Review Inbox', api.syncArtifactReviews)}
              className="w-full flex items-center justify-center gap-2 p-3 bg-fuchsia-500/20 hover:bg-fuchsia-500/30 border border-fuchsia-500/50 text-fuchsia-300 rounded-xl font-medium transition-colors text-sm"
            >
              Sync Artifact Review Inbox
            </button>
            <button
              onClick={() => document.querySelector<HTMLButtonElement>('[title="REVIEW INBOX"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'review-inbox' }))}
              className="w-full flex items-center justify-center gap-2 p-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 rounded-xl font-medium transition-colors text-sm"
            >
              Open Review Inbox
            </button>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={() => onRunAction?.('Capture Health Snapshot', api.captureHealth)}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-white/70"
            >
              Capture Health Snapshot
            </button>
            <button
              onClick={() => onRunAction?.('Regenerate Routine Plan', api.regenerateTodayRoutinePlan)}
              className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-colors text-white/70"
            >
              Regenerate Today's Plan
            </button>
          </div>
        </GlassCard>

        {/* Mission Templates Setup */}
        <GlassCard className="p-6">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-4">Mission Operations</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/50 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0 mt-0.5">1</div>
              <div>
                <p className="text-sm text-slate-300 font-medium">Seed Mission Templates</p>
                <p className="text-xs text-slate-500 mt-1">Loads predefined standard AI jobs (e.g. Daily Planner, Health Snapshot) into the local SQLite database.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-400 font-bold text-xs shrink-0 mt-0.5">2</div>
              <div>
                <p className="text-sm text-slate-300 font-medium">Sync Artifact Reviews</p>
                <p className="text-xs text-slate-500 mt-1">Indexes all AI-generated markdown files and creates pending review records in the human-approval inbox.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center text-purple-400 font-bold text-xs shrink-0 mt-0.5">3</div>
              <div>
                <p className="text-sm text-slate-300 font-medium">Demo Evidence Generation</p>
                <p className="text-xs text-slate-500 mt-1">Creates non-mutating evidence packages with redacted paths from demo-ready artifacts.</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Scheduler Setup */}
        <GlassCard className="p-6 space-y-6">
          <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
            <Settings size={18} className="text-primary" />
            Scheduler Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h3 className="font-semibold text-white/80">1. Audit Reminders</h3>
              <p className="text-sm text-white/50">Go to the SCHEDULER tab to perform a live scan of Windows Scheduled Tasks against the 12 allowlisted routine protocols.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-white/80">2. Repair Tasks</h3>
              <p className="text-sm text-white/50">Use the Auto-Repair Console to recreate any missing tasks or fix misconfigured execution times/arguments.</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-white/80">3. Understand Mapping</h3>
              <p className="text-sm text-white/50">The Scheduler automatically maps triggering times to Local AI's Routine Protocol Engine, ensuring Telegram reminders are intelligent and protocol-aware.</p>
            </div>
          </div>
        </GlassCard>

        {/* Launch & Recovery Setup */}
        <GlassCard className="p-6 space-y-6 bg-gradient-to-br from-cyan-900/10 to-transparent border-cyan-500/20">
          <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
            <Terminal size={18} className="text-cyan-400" />
            Launch & Recovery
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-white/80">Start Local AI Safely</h3>
                <code className="block p-3 bg-black/40 border border-white/10 rounded text-xs text-cyan-300 break-all select-all">
                  C:\Users\kadar\OpenClawAutomation\Start-Local AI-Command-Center.ps1
                </code>
                <p className="text-xs text-white/50">Checks ports and Node before launching.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white/80">Stop Duplicate Dev Servers</h3>
                <code className="block p-3 bg-black/40 border border-white/10 rounded text-xs text-cyan-300 break-all select-all">
                  C:\Users\kadar\OpenClawAutomation\Stop-Local AI-Duplicate-DevServers.ps1
                </code>
                <p className="text-xs text-white/50">Safely kills conflicting Node instances or locked Local AI ports.</p>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-white/80">Test System Reliability</h3>
                <code className="block p-3 bg-black/40 border border-white/10 rounded text-xs text-cyan-300 break-all select-all">
                  C:\Users\kadar\OpenClawAutomation\Test-Local AI-System.ps1
                </code>
                <p className="text-xs text-white/50">Runs a CLI diagnostic check over all vital endpoints.</p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-white/80">Known-Good OpenClaw Command</h3>
                <code className="block p-3 bg-black/40 border border-white/10 rounded text-xs text-cyan-300 break-all select-all">
                  openclaw gateway run --port 18789
                </code>
                <p className="text-xs text-white/50">If OpenClaw is DEGRADED, start it manually in a separate window to recover functionality. (Degraded = optional features offline, Critical = system down)</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Release Readiness Update */}
        <GlassCard className="p-6 space-y-6">
          <h2 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
            <Lock size={18} className="text-primary" />
            Phase 17 Release Readiness
          </h2>
          <div className="space-y-4">
            <p className="text-sm text-white/70">
              Local AI is fully prepared for its v1.0-local release. Use the Release page or the PowerShell audit script to verify repository hygiene, secrets omission, and demonstration safety boundaries before publishing to GitHub or showing to employers.
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => document.querySelector<HTMLButtonElement>('[title="RELEASE"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'release' }))}
                className="flex-1 py-3 px-4 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-xl text-sm font-medium transition-colors"
              >
                Open Release Page
              </button>
            </div>
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-white/80">Run Final Release Audit</h3>
              <code className="block p-3 bg-black/40 border border-white/10 rounded text-xs text-primary break-all select-all">
                C:\Users\kadar\OpenClawAutomation\Test-Local AI-Release-Readiness.ps1
              </code>
              <p className="text-xs text-white/50">Checks all safe release constraints locally.</p>
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
};

