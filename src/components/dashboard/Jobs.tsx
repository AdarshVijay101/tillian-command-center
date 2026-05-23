import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Activity, ShieldCheck, Play, Pause, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

export const Jobs = () => {
  const [stats, setStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [jobEvents, setJobEvents] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [artifactReviews, setArtifactReviews] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchJobs = async () => {
      try {
        const [statsRes, jobsRes, inboxRes] = await Promise.all([
          api.getJobStats(),
          api.getJobs(),
          api.getArtifactReviewInbox()
        ]);
        
        if (mounted && statsRes.ok) setStats(statsRes.data);
        if (mounted && jobsRes.ok) setJobs(jobsRes.data as any[]);
        if (mounted && inboxRes.ok) setArtifactReviews(inboxRes.data as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchJobs();
    
    const interval = setInterval(fetchJobs, 10000); // Polling every 10s
    return () => { mounted = false; clearInterval(interval); };
  }, [refreshKey]);

  useEffect(() => {
    if (!selectedJob) return;
    let mounted = true;
    const fetchEvents = async () => {
      const res = await api.getJobById(selectedJob.id);
      if (mounted && res.ok && (res.data as any).events) {
        setJobEvents((res.data as any).events);
      }
    };
    fetchEvents();
  }, [selectedJob, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const handleAction = async (jobId: string, action: 'preflight' | 'approve' | 'execute' | 'cancel' | 'retry') => {
    try {
      let res;
      if (action === 'preflight') res = await api.preflightJob(jobId);
      if (action === 'approve') res = await api.approveJob(jobId);
      if (action === 'execute') res = await api.executeJob(jobId);
      if (action === 'cancel') res = await api.cancelJob(jobId);
      if (action === 'retry') res = await api.retryJob(jobId);
      
      if (res && res.ok) {
        refresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateHeavy = async (type: string, title: string) => {
    try {
      const res = await api.createJob({ jobType: type, title, priority: 'high' });
      if (res.ok) refresh();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-cyan-400 border-cyan-400/20 bg-cyan-400/10';
      case 'preflight_checking': return 'text-cyan-300 border-cyan-300/20 bg-cyan-300/10 animate-pulse';
      case 'blocked': return 'text-amber-500 border-amber-500/20 bg-amber-500/10';
      case 'awaiting_approval': return 'text-purple-400 border-purple-400/20 bg-purple-400/10';
      case 'approved': return 'text-blue-400 border-blue-400/20 bg-blue-400/10';
      case 'running': return 'text-blue-500 border-blue-500/20 bg-blue-500/10 animate-pulse';
      case 'succeeded': return 'text-emerald-400 border-emerald-400/20 bg-emerald-400/10';
      case 'failed': return 'text-red-500 border-red-500/20 bg-red-500/10';
      case 'timeout': return 'text-orange-500 border-orange-500/20 bg-orange-500/10';
      case 'cancelled': return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
      default: return 'text-gray-400 border-gray-400/20 bg-gray-400/10';
    }
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-light tracking-wide text-white mb-2 flex items-center gap-3">
            <Server className="w-8 h-8 text-cyan-400" />
            Control Plane
          </h1>
          <p className="text-gray-400">Mission Operations & Job Orchestration</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => handleCreateHeavy('run_daily_planner', 'Daily Combined Planner')} className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 transition-colors">
            + Daily Planner
          </button>
          <button onClick={() => handleCreateHeavy('run_morning_brief', 'Morning AI Brief')} className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded text-cyan-300 transition-colors">
            + Morning Brief
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <Activity className="w-6 h-6 text-emerald-400 mb-2" />
          <div className="text-3xl font-light text-white">{stats?.queueHealthScore ?? 100}%</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Queue Health</div>
        </GlassCard>
        
        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <Play className="w-6 h-6 text-blue-400 mb-2" />
          <div className="text-3xl font-light text-white">{stats?.running || 0}</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Running</div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <Pause className="w-6 h-6 text-purple-400 mb-2" />
          <div className="text-3xl font-light text-white">{stats?.pending || 0}</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Pending/Approval</div>
        </GlassCard>

        <GlassCard className="p-4 flex flex-col items-center justify-center text-center">
          <AlertTriangle className={`w-6 h-6 mb-2 ${stats?.blockedToday > 0 ? 'text-amber-500' : 'text-gray-500'}`} />
          <div className="text-3xl font-light text-white">{stats?.blockedToday || 0}</div>
          <div className="text-sm text-gray-400 uppercase tracking-wider">Blocked Today</div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-light text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Recent Jobs
          </h2>
          
          <div className="space-y-3">
            <AnimatePresence>
              {jobs.map(job => (
                <motion.div 
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedJob(job)}
                  className={`p-4 rounded border cursor-pointer transition-all ${selectedJob?.id === job.id ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 hover:bg-white/5'}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        {job.title}
                        {job.requires_approval === 1 && <div title="Requires Approval"><ShieldCheck className="w-4 h-4 text-purple-400" /></div>}
                        {job.title.includes('DEMO') && <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">DEMO JOBS - SIMULATED</span>}
                      </h3>
                      <div className="text-sm text-gray-400">{job.job_type} • {new Date(job.created_at).toLocaleTimeString()}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium uppercase tracking-wider border ${getStatusColor(job.status)}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  {job.status === 'blocked' && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-200 text-sm">
                      <div className="font-medium mb-1">Action Blocked</div>
                      <div className="text-amber-400/80 mb-2">{job.preflight_summary || 'Preflight failed.'}</div>
                      {job.error_message && (
                        <div className="font-mono bg-black/40 px-2 py-1 rounded text-xs">Fix: {job.error_message}</div>
                      )}
                    </div>
                  )}

                  {job.idempotency_key && (
                    <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500/50" />
                      Idempotency protected: {job.idempotency_key}
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    {job.status === 'pending' && (
                      <button onClick={(e) => { e.stopPropagation(); handleAction(job.id, 'preflight'); }} className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm hover:bg-cyan-500/30 transition-colors">
                        Run Preflight
                      </button>
                    )}
                    {job.status === 'awaiting_approval' && (
                      <button onClick={(e) => { e.stopPropagation(); handleAction(job.id, 'approve'); }} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded text-sm hover:bg-purple-500/30 transition-colors">
                        Approve Action
                      </button>
                    )}
                    {job.status === 'approved' && (
                      <button onClick={(e) => { e.stopPropagation(); handleAction(job.id, 'execute'); }} className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded text-sm hover:bg-blue-500/30 transition-colors">
                        Execute
                      </button>
                    )}
                    {job.status === 'failed' && (
                      <button onClick={(e) => { e.stopPropagation(); handleAction(job.id, 'retry'); }} className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded text-sm hover:bg-amber-500/30 transition-colors">
                        Retry
                      </button>
                    )}
                    {['pending', 'blocked', 'awaiting_approval', 'approved'].includes(job.status) && (
                      <button onClick={(e) => { e.stopPropagation(); handleAction(job.id, 'cancel'); }} className="px-3 py-1 bg-red-500/10 text-red-400 rounded text-sm hover:bg-red-500/20 transition-colors">
                        Cancel
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {jobs.length === 0 && (
              <div className="text-gray-500 p-4 border border-white/5 rounded text-center">No recent jobs found.</div>
            )}
          </div>
        </div>

        <div>
          <GlassCard className="p-4 h-[600px] overflow-y-auto">
            <h2 className="text-lg font-light text-white mb-4 border-b border-white/10 pb-2">Event Timeline</h2>
            
            {!selectedJob ? (
              <div className="text-gray-500 text-sm text-center mt-10">Select a job to view its timeline.</div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm text-cyan-400 font-medium mb-4 flex items-center justify-between">
                  {selectedJob.title}
                  {artifactReviews.find(a => a.related_job_id === selectedJob.id) && (
                    <button
                      onClick={() => document.querySelector<HTMLButtonElement>('[title="REVIEW INBOX"]')?.click() || window.dispatchEvent(new CustomEvent('navigate', { detail: 'review-inbox' }))}
                      className="px-2 py-1 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded text-xs font-medium border border-indigo-500/30"
                    >
                      View Linked Artifact
                    </button>
                  )}
                </div>
                {jobEvents.map((evt) => (
                  <div key={evt.id} className="relative pl-4 border-l border-white/10 pb-4">
                    <div className="absolute w-2 h-2 rounded-full bg-cyan-400 -left-[4.5px] top-1"></div>
                    <div className="text-xs text-gray-500 mb-1">{new Date(evt.created_at).toLocaleTimeString()}</div>
                    <div className="text-sm text-gray-300 font-medium uppercase tracking-wider">{evt.event_type.replace('_', ' ')}</div>
                    <div className="text-sm text-gray-400 mt-1">{evt.message}</div>
                    {evt.metadata_json && (
                      <pre className="mt-2 text-xs text-gray-500 bg-black/30 p-2 rounded overflow-x-auto">
                        {JSON.stringify(JSON.parse(evt.metadata_json), null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
};
