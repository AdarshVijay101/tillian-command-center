import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { motion } from 'framer-motion';
import { Activity, CheckCircle2, Clock, Zap, Database, TrendingUp, Target, Bell, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDemoMode } from '../../hooks/useDemoMode';

export const Analytics = () => {
  const [overview, setOverview] = useState<any>(null);
  const [today, setToday] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [routineStatus, setRoutineStatus] = useState<any>(null);
  const [notificationStats, setNotificationStats] = useState<any>(null);
  const [jobStats, setJobStats] = useState<any>(null);
  const [artifactStats, setArtifactStats] = useState<any>(null);
  const [evidenceStats, setEvidenceStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { isDemoMode } = useDemoMode();

  useEffect(() => {
    const fetchData = async () => {
      const [overviewRes, todayRes, trendsRes, statusRes, notifRes, jobRes, artifactRes, evidenceRes] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsToday(),
        api.getAnalyticsTrends(),
        api.getRoutineStatus(),
        api.getNotificationStats(),
        api.getJobStats(),
        api.getArtifactReviewStats(),
        api.getEvidenceStats()
      ]);
      if (overviewRes.ok) setOverview(overviewRes.data);
      if (todayRes.ok) setToday(todayRes.data);
      if (trendsRes.ok) setTrends(trendsRes.data);
      if (statusRes.ok) setRoutineStatus(statusRes.data);
      if (notifRes.ok) setNotificationStats(notifRes.data);
      if (jobRes.ok) setJobStats(jobRes.data);
      if (artifactRes.ok) setArtifactStats(artifactRes.data);
      if (evidenceRes.ok) setEvidenceStats(evidenceRes.data);
      setLoading(false);
    };
    fetchData();
    
    window.addEventListener('tillian:refresh', fetchData);
    return () => window.removeEventListener('tillian:refresh', fetchData);
  }, [isDemoMode]);

  if (loading) {
    return <div className="text-white/50 animate-pulse flex items-center gap-2"><Activity size={16} /> Loading Intelligence Data...</div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-wide">Operational Intelligence</h1>
            <p className="text-sm text-white/40 flex items-center gap-2">
              SQLite Intelligence Layer {isDemoMode && <span className="text-amber-400 font-bold px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 text-xs">SIMULATED</span>}
            </p>
          </div>
        </div>
      </div>

      {routineStatus && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111113] p-6 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1">Total Protocols</h3>
            <div className="text-2xl font-bold text-gray-200">{routineStatus.protocolsCount}</div>
          </div>
          <div className="bg-[#111113] p-6 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1">Protocol Steps</h3>
            <div className="text-2xl font-bold text-gray-200">{routineStatus.stepsCount}</div>
          </div>
          <div className="bg-[#111113] p-6 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1">Weekly Blocks</h3>
            <div className="text-2xl font-bold text-gray-200">{routineStatus.weeklyScheduleCount}</div>
          </div>
          <div className="bg-[#111113] p-6 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1">Active Overrides</h3>
            <div className="text-2xl font-bold text-yellow-400">{routineStatus.overridesCount}</div>
          </div>
        </div>
      )}

      {/* Required Safety/Design Warning Labels */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-2 py-1 bg-amber-500/10 text-amber-400/80 border border-amber-500/20 rounded text-xs">Reminder delivery ≠ real task completion</span>
        <span className="px-2 py-1 bg-purple-500/10 text-purple-400/80 border border-purple-500/20 rounded text-xs">Heuristic score</span>
        <span className="px-2 py-1 bg-blue-500/10 text-blue-400/80 border border-blue-500/20 rounded text-xs">SQLite local-only</span>
        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400/80 border border-emerald-500/20 rounded text-xs">No secrets stored</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Missions', value: overview.totalRuns, icon: Target, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
          { label: 'Success Rate', value: `${overview.successRate}%`, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
          { label: 'Today\'s Runs', value: today.runsToday, icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
          { label: 'Avg Duration', value: `${overview.averageDurationMs}ms`, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
          { 
            label: 'Jobs Today', 
            value: jobStats ? (jobStats.succeededToday + jobStats.failedToday) : 0, 
            icon: Target, 
            color: 'text-blue-400', 
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20'
          }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white/50 font-medium mb-1">{stat.label}</p>
                  <p className="text-3xl font-display font-bold text-white/90">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.border} border`}>
                  <stat.icon size={24} className={stat.color} />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="p-6 lg:col-span-2 flex flex-col">
          <h2 className="text-lg font-display font-semibold text-white/90 mb-6 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            14-Day Mission Volume
          </h2>
          <div className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends.runsByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                <XAxis dataKey="date" stroke="#ffffff40" fontSize={12} tickMargin={10} />
                <YAxis stroke="#ffffff40" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#070B1F', borderColor: '#ffffff20', borderRadius: '8px' }}
                  itemStyle={{ color: '#00FF9D' }}
                />
                <Line type="monotone" dataKey="count" stroke="#00FF9D" strokeWidth={3} dot={{ r: 4, fill: '#00FF9D', strokeWidth: 0 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col">
          <h2 className="text-lg font-display font-semibold text-white/90 mb-6 flex items-center gap-2">
            <Zap size={18} className="text-emerald-400" />
            Today's Readiness Score
          </h2>
          
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="relative flex items-center justify-center w-40 h-40 rounded-full border-4 border-white/5">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin-slow" />
              <div className="text-center">
                <span className="text-4xl font-display font-bold text-emerald-400">{today.suggestedDailyScore}</span>
                <span className="block text-xs text-white/40 mt-1 uppercase tracking-widest">Score</span>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60 font-medium">Protocol Delivery</span>
                <span className="text-white font-bold text-lg">{today.protocolDeliveryScore ?? '--'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                <span className="text-white/60 font-medium">Confirmed Check-ins</span>
                <span className="text-indigo-400 font-bold text-lg">{today.confirmedCompletionScore ?? '--'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Confidence</span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded text-xs capitalize">{today.confidence}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-white/60">Source</span>
                <span className="text-white bg-white/10 px-2 py-0.5 rounded text-xs capitalize">{today.scoreSource}</span>
              </div>
              <p className="text-xs text-white/40 text-center mt-4 px-4 leading-relaxed">
                {today.explanation}
              </p>
            </div>
          </div>
        </GlassCard>

        {notificationStats && (
          <GlassCard className="p-6 flex flex-col lg:col-span-3">
            <h2 className="text-lg font-display font-semibold text-white/90 mb-6 flex items-center gap-2">
              <Bell size={18} className="text-cyan-400" />
              Delivery Reliability (14-Day)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Total Deliveries</p>
                <p className="text-2xl font-bold text-white/90">{notificationStats.recentCount}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-emerald-500/20">
                <p className="text-xs text-emerald-400/80 uppercase tracking-widest mb-1">Protocol-Aware</p>
                <p className="text-2xl font-bold text-emerald-400">{notificationStats.protocolPayloadCount}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-400/80 uppercase tracking-widest mb-1">Static Fallbacks</p>
                <p className="text-2xl font-bold text-amber-400">{notificationStats.staticFallbackCount}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-cyan-500/20">
                <p className="text-xs text-cyan-400/80 uppercase tracking-widest mb-1">Reliability Score</p>
                <p className="text-2xl font-bold text-cyan-400">
                  {Math.round(((notificationStats.recentCount - (notificationStats.byStatus?.failed || 0)) / (notificationStats.recentCount || 1)) * 100)}%
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {artifactStats && (
          <GlassCard className="p-6 flex flex-col lg:col-span-3">
            <h2 className="text-lg font-display font-semibold text-white/90 mb-6 flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              Artifact Review Intelligence
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 p-4 rounded-xl border border-amber-500/20">
                <p className="text-xs text-amber-400/80 uppercase tracking-widest mb-1">Pending Reviews</p>
                <p className="text-2xl font-bold text-amber-400">{artifactStats.pendingCount}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-emerald-500/20">
                <p className="text-xs text-emerald-400/80 uppercase tracking-widest mb-1">Approved Artifacts</p>
                <p className="text-2xl font-bold text-emerald-400">{artifactStats.approvedCount}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-indigo-500/20">
                <p className="text-xs text-indigo-400/80 uppercase tracking-widest mb-1">Demo Ready</p>
                <p className="text-2xl font-bold text-indigo-400">{artifactStats.demoReadyCount}</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Generated Today</p>
                <p className="text-2xl font-bold text-white/90">{artifactStats.generatedToday}</p>
              </div>
            </div>
            
            {evidenceStats && (
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <p className="text-xs text-purple-400/80 uppercase tracking-widest mb-1">Evidence Notes</p>
                  <p className="text-xl font-bold text-purple-400">{evidenceStats.evidenceNotesCount}</p>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <p className="text-xs text-purple-400/80 uppercase tracking-widest mb-1">Portfolio Ready</p>
                  <p className="text-xl font-bold text-purple-400">{evidenceStats.portfolioReadyArtifacts}</p>
                </div>
                <div className="bg-purple-500/10 p-4 rounded-xl border border-purple-500/20">
                  <p className="text-xs text-purple-400/80 uppercase tracking-widest mb-1">Evidence Packages</p>
                  <p className="text-xl font-bold text-purple-400">{evidenceStats.packagesCount}</p>
                </div>
              </div>
            )}
          </GlassCard>
        )}
      </div>
      
    </div>
  );
};
