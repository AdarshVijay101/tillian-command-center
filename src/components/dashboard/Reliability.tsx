import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { Activity, ShieldCheck, AlertCircle, CheckCircle2, Download, Copy, Play, Loader2, Stethoscope, Clock, Bell, Terminal, Wrench, Server } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';
import { clsx } from 'clsx';

export const Reliability = ({ setActiveTab }: { setActiveTab: (tab: string) => void }) => {
  const [suite, setSuite] = useState<any>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [reportText, setReportText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { isDemoMode } = useDemoMode();

  const runTests = async () => {
    setTesting(true);
    const [res, readRes] = await Promise.all([
      api.getSystemTestSuite(),
      api.getReleaseReadiness()
    ]);
    if (res.ok) setSuite(res.data);
    if (readRes.ok) setReadiness(readRes.data);
    setTesting(false);
  };

  const fetchReport = async () => {
    const res = await api.getSystemReportMarkdown();
    if (res && typeof res === 'string') {
      setReportText(res);
    }
  };

  useEffect(() => {
    runTests();
    fetchReport();
  }, [isDemoMode]);

  const copyReport = () => {
    navigator.clipboard.writeText(reportText);
    alert('Diagnostic report copied to clipboard');
  };

  if (loading && !suite) {
    if (!testing) setLoading(false);
    return <div className="text-white/50 animate-pulse flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> Initializing Test Harness...</div>;
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">Reliability Test Harness</h1>
            <p className="text-sm text-white/40 flex items-center gap-2">
              End-to-End System Confidence & Recovery {isDemoMode && <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 text-xs">SIMULATED</span>}
            </p>
          </div>
        </div>
        <button
          onClick={runTests}
          disabled={testing}
          className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg border border-primary/30 transition-colors flex items-center gap-2"
        >
          {testing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          Run Read-Only Test Suite
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Status Column */}
        <div className="lg:col-span-2 space-y-6">
          <GlassCard glowColor={suite?.overallReadinessScore === 100 ? 'emerald' : suite?.overallReadinessScore > 50 ? 'amber' : 'red'} className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-white/50 uppercase tracking-widest font-semibold text-sm mb-2">System Readiness Score</h2>
                <div className="flex items-baseline gap-2">
                  <span className={clsx("text-6xl font-display font-bold", 
                    suite?.overallReadinessScore === 100 ? 'text-emerald-400' : 
                    suite?.overallReadinessScore > 50 ? 'text-amber-400' : 'text-red-400')}>
                    {suite?.overallReadinessScore || 0}
                  </span>
                  <span className="text-2xl text-white/40">/ 100</span>
                </div>
              </div>
              <Activity size={48} className={clsx("opacity-20", 
                suite?.overallReadinessScore === 100 ? 'text-emerald-400' : 
                suite?.overallReadinessScore > 50 ? 'text-amber-400' : 'text-red-400')} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-8">
              {[
                { label: 'Backend API', ok: suite?.backendOnline },
                { label: 'SQLite DB', ok: suite?.dbStatusOk },
                { label: 'Routine Sync', ok: suite?.routinesStatusOk },
                { label: 'Config Safety', ok: suite?.configValidateOk },
                { label: 'Scheduler', ok: suite?.schedulerHealthOk },
                { label: 'Notifications', ok: suite?.notificationStatsOk },
                { label: 'Payload Gen', ok: suite?.remindersPayloadOk },
                { label: 'Job Queue', ok: suite?.jobsStatsOk },
                { label: 'Mission Templates', ok: suite?.missionTemplatesOk }
              ].map((test, i) => (
                <div key={i} className="p-3 bg-black/20 rounded border border-white/5 flex items-center gap-3">
                  {test.ok ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-red-400" />}
                  <span className="text-sm text-white/80">{test.label}</span>
                </div>
              ))}
              <div className="p-3 bg-black/20 rounded border border-white/5 flex items-center gap-3">
                {suite?.openclawStatus === 'online' ? <CheckCircle2 size={16} className="text-emerald-400" /> : <AlertCircle size={16} className="text-amber-400" />}
                <span className="text-sm text-white/80">OpenClaw: <span className="uppercase text-xs">{suite?.openclawStatus}</span></span>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <h3 className="text-lg font-display font-semibold text-white/90 flex items-center gap-2">
              <AlertCircle size={18} className="text-amber-400" /> Warnings & Failures
            </h3>
            {suite?.errors?.length > 0 || suite?.warnings?.length > 0 ? (
              <div className="space-y-2">
                {suite.errors.map((e: string, i: number) => (
                  <div key={`err-${i}`} className="p-3 bg-red-500/10 border-l-2 border-red-500 text-red-300 text-sm">{e}</div>
                ))}
                {suite.warnings.map((w: string, i: number) => (
                  <div key={`warn-${i}`} className="p-3 bg-amber-500/10 border-l-2 border-amber-500 text-amber-300 text-sm">{w}</div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-white/40 border border-white/5 rounded border-dashed">
                All systems nominal. No warnings.
              </div>
            )}
          </GlassCard>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          <GlassCard glowColor={readiness?.readinessScore === 100 ? 'emerald' : 'cyan'} className="p-6 space-y-4">
            <h3 className="font-semibold text-white/90 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2"><ShieldCheck size={18} className="text-primary" /> Release Readiness</span>
              {readiness && (
                <span className={`px-2 py-1 text-xs rounded-full border ${readiness.readinessScore === 100 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'}`}>
                  {readiness.readinessScore}/100
                </span>
              )}
            </h3>
            <div className="space-y-2 text-xs text-white/70">
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span>Repo Hygiene</span>
                <span>{readiness?.gitignoreStatus || 'Pending'}</span>
              </div>
              <div className="flex justify-between items-center bg-white/5 p-2 rounded">
                <span>Evidence Layer</span>
                <span>{readiness?.evidenceLayerStatus || 'Pending'}</span>
              </div>
              {readiness?.blockers?.length > 0 && (
                <div className="mt-2 text-red-400 p-2 bg-red-400/10 rounded">
                  Blockers: {readiness.blockers.length}
                </div>
              )}
            </div>
            <button onClick={() => setActiveTab('release')} className="w-full mt-2 flex justify-center items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-sm transition-colors text-white/80">
              View Release Details
            </button>
          </GlassCard>

          <GlassCard glowColor="cyan" className="p-6 space-y-6">
            <h3 className="font-semibold text-white/90 flex items-center gap-2 mb-4">
              <Terminal size={18} className="text-cyan-400" /> Recovery Commands
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-white/50 mb-1">Stop Duplicate Dev Servers</p>
                <code className="block p-2 bg-black/40 border border-white/10 rounded text-[10px] text-cyan-300 break-all select-all">
                  .\Stop-Local AI-Duplicate-DevServers.ps1
                </code>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Start Clean Dev Server</p>
                <code className="block p-2 bg-black/40 border border-white/10 rounded text-[10px] text-cyan-300 break-all select-all">
                  .\Start-Local AI-Command-Center.ps1
                </code>
              </div>
              <div>
                <p className="text-xs text-white/50 mb-1">Run CLI Test Harness</p>
                <code className="block p-2 bg-black/40 border border-white/10 rounded text-[10px] text-cyan-300 break-all select-all">
                  .\Test-Local AI-System.ps1
                </code>
              </div>
            </div>
            <p className="text-[10px] text-white/30 italic mt-2">Scripts located in C:\Users\kadar\OpenClawAutomation\</p>
          </GlassCard>

          <GlassCard className="p-6 space-y-4">
            <h3 className="font-semibold text-white/90 flex items-center gap-2">
              <Download size={18} className="text-primary" /> Export Report
            </h3>
            <p className="text-xs text-white/50">Generate a redacted markdown report for debugging.</p>
            <button onClick={copyReport} className="w-full flex justify-center items-center gap-2 p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-sm transition-colors text-white/80">
              <Copy size={14} /> Copy to Clipboard
            </button>
          </GlassCard>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button onClick={() => setActiveTab('doctor')} className="p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
              <Stethoscope size={16} /> System Doctor
            </button>
            <button onClick={() => setActiveTab('scheduler')} className="p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
              <Clock size={16} /> Scheduler
            </button>
            <button onClick={() => setActiveTab('notifications')} className="p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
              <Bell size={16} /> Notifications
            </button>
            <button onClick={() => setActiveTab('setup')} className="p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
              <Wrench size={16} /> Setup Guide
            </button>
            <button onClick={() => setActiveTab('jobs')} className="p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
              <Server size={16} /> Job Queue
            </button>
            <button onClick={() => setActiveTab('release')} className="p-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 flex flex-col items-center justify-center gap-2 text-xs text-white/60 hover:text-white transition-colors">
              <ShieldCheck size={16} /> Release
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

