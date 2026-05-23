import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import type { MissionTemplate, MissionRecommendation, MissionReadiness } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Server, AlertTriangle, Play, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';
import { getIsDemoMode } from '../../hooks/useDemoMode';

export const MissionControl = () => {
  const [recommendations, setRecommendations] = useState<MissionRecommendation[]>([]);
  const [templates, setTemplates] = useState<MissionTemplate[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<MissionReadiness | null>(null);
  const [evidenceStats, setEvidenceStats] = useState<any>(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [recRes, tempRes, jobsRes, statsRes, evidenceRes] = await Promise.all([
        api.getMissionRecommendations(),
        api.getMissionTemplates(),
        api.getJobs(),
        api.getArtifactReviewStats(),
        api.getEvidenceStats()
      ]);
      if (recRes.ok) setRecommendations(recRes.data as any);
      if (tempRes.ok) setTemplates(tempRes.data as any);
      if (jobsRes.ok) setJobs(jobsRes.data as any);
      if (statsRes.ok) setReviewStats(statsRes.data as any);
      if (evidenceRes.ok) setEvidenceStats(evidenceRes.data as any);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTemplate = async (id: string) => {
    setSelectedTemplate(id);
    setReadiness(null);
    try {
      const res = await api.getMissionReadiness(id);
      if (res.ok) setReadiness(res.data as any);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateJob = async () => {
    if (!selectedTemplate) return;
    try {
      const res = await api.createJobFromMissionTemplate(selectedTemplate);
      if (res.ok) {
        setSelectedTemplate(null);
        fetchData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleJobAction = async (jobId: string, action: 'preflight' | 'approve' | 'execute' | 'cancel' | 'retry') => {
    try {
      if (action === 'preflight') await api.preflightJob(jobId);
      if (action === 'approve') await api.approveJob(jobId);
      if (action === 'execute') await api.executeJob(jobId);
      if (action === 'cancel') await api.cancelJob(jobId);
      if (action === 'retry') await api.retryJob(jobId);
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading && jobs.length === 0) {
    return <div className="text-center p-8 text-cyan-400">Loading Mission Control...</div>;
  }

  const cockpitJobs = jobs.filter(j => ['pending', 'preflight_checking', 'blocked', 'awaiting_approval', 'running'].includes(j.status));
  const recentOutcomes = jobs.filter(j => ['succeeded', 'failed', 'timeout', 'cancelled'].includes(j.status)).slice(0, 5);
  const blockedJobs = jobs.filter(j => j.status === 'blocked');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
            <Target className="w-8 h-8 text-cyan-400" />
            Mission Control
          </h1>
          <p className="text-gray-400">Template Operations & Approval Cockpit</p>
          {getIsDemoMode() && (
            <div className="mt-2 text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded border border-amber-500/30 inline-block font-mono">
              DEMO MISSION CONTROL - SIMULATED
            </div>
          )}
        </div>
      </div>

      {reviewStats?.pendingCount > 0 && (
        <GlassCard className="mb-6 p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="text-sm font-medium text-amber-400">Pending Artifact Reviews</h3>
                <p className="text-xs text-amber-400/70">{reviewStats.pendingCount} generated artifact{reviewStats.pendingCount !== 1 ? 's' : ''} awaiting human approval</p>
              </div>
            </div>
            <button 
              onClick={() => document.querySelector<HTMLButtonElement>('[title="REVIEW INBOX"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'review-inbox' }))}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded text-xs font-medium transition-colors border border-amber-500/30"
            >
              Go to Inbox
            </button>
          </div>
        </GlassCard>
      )}

      {evidenceStats?.demoReadyArtifacts > 0 && (
        <GlassCard className="mb-6 p-4 border border-purple-500/30 bg-purple-500/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-medium text-purple-400">Demo Ready Evidence Available</h3>
                <p className="text-xs text-purple-400/70">{evidenceStats.demoReadyArtifacts} human-approved artifact{evidenceStats.demoReadyArtifacts !== 1 ? 's are' : ' is'} ready for evidence packaging.</p>
              </div>
            </div>
            <button 
              onClick={() => document.querySelector<HTMLButtonElement>('[title="EVIDENCE"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'evidence' }))}
              className="px-3 py-1.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded text-xs font-medium transition-colors border border-purple-500/30"
            >
              Go to Evidence Layer
            </button>
          </div>
        </GlassCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Missions & Templates */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h2 className="text-xl font-light text-white mb-4">Recommended Missions</h2>
            <div className="space-y-3">
              {recommendations.map(rec => {
                const t = templates.find(temp => temp.id === rec.template_id);
                return (
                  <div key={rec.template_id} onClick={() => handleSelectTemplate(rec.template_id)} className="p-4 bg-black/20 hover:bg-white/5 border border-white/10 rounded cursor-pointer transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-cyan-300">{t?.title || rec.template_id}</div>
                        <div className="text-sm text-gray-400 mt-1">{rec.reason}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-xs font-mono border ${rec.priority === 'high' ? 'border-amber-500/30 text-amber-400' : 'border-cyan-500/30 text-cyan-400'}`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </span>
                    </div>
                  </div>
                );
              })}
              {recommendations.length === 0 && <div className="text-gray-500">No active recommendations.</div>}
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-xl font-light text-white mb-4">Mission Templates</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {templates.map(t => (
                <div key={t.id} onClick={() => handleSelectTemplate(t.id)} className="p-3 bg-black/20 hover:bg-white/5 border border-white/10 rounded cursor-pointer">
                  <div className="font-medium text-white flex items-center justify-between">
                    {t.title}
                    {t.is_heavy === 1 && <div title="Heavy AI Mission"><ShieldCheck className="w-4 h-4 text-purple-400" /></div>}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 truncate">{t.description}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Action Panel / Approval Cockpit */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedTemplate && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <GlassCard className="p-6 border-cyan-500/30">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-light text-cyan-300">Prepare Mission</h2>
                    <button onClick={() => setSelectedTemplate(null)} className="text-gray-500 hover:text-white"><XCircle className="w-5 h-5" /></button>
                  </div>
                  
                  {!readiness ? (
                    <div className="text-cyan-500 animate-pulse">Running Pre-mission checks...</div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-400">OpenClaw Required:</div>
                        <div className={readiness.openclaw_required ? 'text-amber-400' : 'text-emerald-400'}>{readiness.openclaw_required ? 'Yes' : 'No'}</div>
                        <div className="text-gray-400">OpenClaw Status:</div>
                        <div className={readiness.openclaw_reachable ? 'text-emerald-400' : 'text-red-400'}>{readiness.openclaw_reachable ? 'Online' : 'Offline'}</div>
                        <div className="text-gray-400">Approval Required:</div>
                        <div className={readiness.approval_required ? 'text-purple-400' : 'text-emerald-400'}>{readiness.approval_required ? 'Yes' : 'No'}</div>
                      </div>

                      {readiness.warnings.length > 0 && (
                        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded">
                          <div className="text-amber-400 font-medium flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4" /> Warnings</div>
                          <ul className="list-disc pl-5 text-sm text-amber-200/80">
                            {readiness.warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}
                          </ul>
                        </div>
                      )}

                      {readiness.fix_command && (
                        <div className="p-3 bg-black/40 border border-red-500/30 rounded">
                          <div className="text-xs text-red-400 mb-1">Required Fix:</div>
                          <code className="text-xs text-gray-300">{readiness.fix_command}</code>
                        </div>
                      )}

                      <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <div className="text-sm text-gray-300">{readiness.next_step}</div>
                        <button 
                          onClick={handleCreateJob} 
                          disabled={!readiness.safe_to_create && !readiness.openclaw_required} // Allow creating if offline, it will just get blocked at preflight
                          className="px-6 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 disabled:bg-gray-500/20 disabled:text-gray-500 text-cyan-300 border border-cyan-500/50 rounded flex items-center gap-2 transition-colors"
                        >
                          <Play className="w-4 h-4" /> Launch Sequence
                        </button>
                      </div>
                    </div>
                  )}
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>

          <GlassCard className="p-6">
            <h2 className="text-xl font-light text-white mb-4 flex items-center gap-2">
              <Server className="w-5 h-5 text-purple-400" />
              Approval Cockpit
            </h2>
            <div className="space-y-3">
              {cockpitJobs.map(job => (
                <div key={job.id} className="p-4 bg-black/20 border border-white/10 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium text-white">{job.title}</div>
                    <span className="text-xs font-mono px-2 py-1 bg-white/5 rounded border border-white/10 text-gray-300">{job.status}</span>
                  </div>
                  {job.status === 'blocked' && (
                    <div className="text-sm text-red-400 bg-red-500/10 p-2 rounded mb-2 border border-red-500/20">Blocked: {job.error_message || 'Preflight failed'}</div>
                  )}
                  {job.status === 'awaiting_approval' && (
                    <div className="text-sm text-purple-300 mb-2">Awaiting human approval to proceed.</div>
                  )}
                  <div className="flex gap-2 mt-3">
                    {job.status === 'pending' && <button onClick={() => handleJobAction(job.id, 'preflight')} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 text-xs rounded hover:bg-cyan-500/30">Preflight</button>}
                    {job.status === 'awaiting_approval' && <button onClick={() => handleJobAction(job.id, 'approve')} className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded hover:bg-purple-500/30">Approve</button>}
                    {job.status === 'approved' && <button onClick={() => handleJobAction(job.id, 'execute')} className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded hover:bg-blue-500/30">Execute</button>}
                    <button onClick={() => handleJobAction(job.id, 'cancel')} className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded hover:bg-red-500/20">Cancel</button>
                  </div>
                </div>
              ))}
              {cockpitJobs.length === 0 && <div className="text-gray-500 text-sm">No active operations in cockpit.</div>}
            </div>
          </GlassCard>

          {blockedJobs.length > 0 && (
            <GlassCard className="p-6 border-red-500/30">
              <h2 className="text-xl font-light text-red-400 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Blocked Missions
              </h2>
              <div className="space-y-3">
                {blockedJobs.map(job => (
                  <div key={job.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded text-sm">
                    <div className="font-medium text-red-300">{job.title}</div>
                    <div className="text-red-400/80 mt-1 text-xs">Reason: {job.error_message}</div>
                    <button onClick={() => handleJobAction(job.id, 'cancel')} className="mt-2 text-xs text-red-500 hover:text-red-400">Dismiss Job</button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-6">
            <h2 className="text-xl font-light text-white mb-4">Recent Outcomes</h2>
            <div className="space-y-2">
              {recentOutcomes.map(job => (
                <div key={job.id} className="flex justify-between items-center p-2 border-b border-white/5 last:border-0">
                  <div className="flex items-center gap-2">
                    {job.status === 'succeeded' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                    <span className="text-sm text-gray-300">{job.title}</span>
                  </div>
                  <span className="text-xs text-gray-500">{new Date(job.created_at).toLocaleTimeString()}</span>
                </div>
              ))}
              {recentOutcomes.length === 0 && <div className="text-gray-500 text-sm">No recent outcomes.</div>}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
