import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { MessageSquare, Target, AlertTriangle, CheckSquare, Server, FileText } from 'lucide-react';

export const AssistantHomePanel = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [
          jobsRes,
          statsRes,
          evidenceRes,
          planRes,
          recRes,
          checkinRes
        ] = await Promise.all([
          api.getJobs(),
          api.getArtifactReviewStats(),
          api.getEvidenceStats(),
          api.getTodayRoutinePlan(),
          api.getMissionRecommendations(),
          api.getTodayCheckins()
        ]);

        setData({
          jobs: jobsRes.ok ? jobsRes.data : [],
          reviewStats: statsRes.ok ? statsRes.data : null,
          evidenceStats: evidenceRes.ok ? evidenceRes.data : null,
          plan: planRes.ok ? planRes.data : null,
          recommendations: recRes.ok ? recRes.data : [],
          checkins: checkinRes.ok ? (checkinRes.data as any).checkins : [],
          reflection: checkinRes.ok ? (checkinRes.data as any).reflection : null
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  if (loading || !data) {
    return <div className="p-4 text-cyan-400 text-center text-sm animate-pulse">Assistant syncing...</div>;
  }

  const blockedJobs = data.jobs.filter((j: any) => j.status === 'blocked');
  const pendingJobs = data.jobs.filter((j: any) => j.status === 'awaiting_approval');
  const topRec = data.recommendations[0];
  const missingReflection = !data.reflection?.energyLevel;

  return (
    <GlassCard className="p-6 mt-6 border-primary/20">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30">
          <MessageSquare className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-white mb-1">"What should I focus on now?"</h3>
          <p className="text-sm text-gray-400 mb-4">Rule-based assessment of your current state and priorities.</p>

          <div className="space-y-3">
            {blockedJobs.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-red-300">Unblock Missions</div>
                  <div className="text-xs text-red-400/80">You have {blockedJobs.length} blocked job(s). Check Mission Control to resolve preflight errors.</div>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'mission-control' }))} className="ml-auto px-3 py-1 bg-red-500/20 text-red-400 text-xs rounded hover:bg-red-500/30">View</button>
              </div>
            )}

            {pendingJobs.length > 0 && (
              <div className="flex items-start gap-3 p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                <Server className="w-5 h-5 text-purple-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-purple-300">Pending Approvals</div>
                  <div className="text-xs text-purple-400/80">You have {pendingJobs.length} job(s) awaiting your explicit approval to run.</div>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'mission-control' }))} className="ml-auto px-3 py-1 bg-purple-500/20 text-purple-400 text-xs rounded hover:bg-purple-500/30">Review</button>
              </div>
            )}

            {data.reviewStats?.pendingCount > 0 && (
              <div className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <FileText className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-amber-300">Artifacts to Review</div>
                  <div className="text-xs text-amber-400/80">You have {data.reviewStats.pendingCount} AI-generated artifact(s) awaiting your decision.</div>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'review-inbox' }))} className="ml-auto px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded hover:bg-amber-500/30">Review</button>
              </div>
            )}

            {missingReflection && new Date().getHours() >= 20 && (
              <div className="flex items-start gap-3 p-3 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <CheckSquare className="w-5 h-5 text-indigo-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-indigo-300">Daily Reflection Missing</div>
                  <div className="text-xs text-indigo-400/80">It's getting late. Complete your reflection in Check-In to close out the day.</div>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'checkin' }))} className="ml-auto px-3 py-1 bg-indigo-500/20 text-indigo-400 text-xs rounded hover:bg-indigo-500/30">Check In</button>
              </div>
            )}

            {topRec && (
              <div className="flex items-start gap-3 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                <Target className="w-5 h-5 text-cyan-400 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-cyan-300">Top Recommended Mission</div>
                  <div className="text-xs text-cyan-400/80">{topRec.reason}</div>
                </div>
                <button onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'mission-control' }))} className="ml-auto px-3 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded hover:bg-cyan-500/30">Launch</button>
              </div>
            )}

          </div>
        </div>
      </div>
    </GlassCard>
  );
};
