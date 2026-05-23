import { GlassCard } from '../ui/GlassCard';
import { Target, ArrowRight, Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useHealth } from '../../hooks/useData';
import { deriveDashboardStatus } from '../../utils/statusMapper';
import { api } from '../../services/api';
import type { MissionRecommendation, MissionReadiness, MissionTemplate } from '../../services/api';
import { useState, useEffect } from 'react';

export const HeroCard = ({ onNavigateToMissionControl, onGoToCheckIn }: { onNavigateToMissionControl: () => void, onGoToCheckIn: () => void }) => {
  const { data: health, loading } = useHealth(15000);
  const [analytics, setAnalytics] = useState<any>(null);
  const [checkins, setCheckins] = useState<any[]>([]);
  const [plan, setPlan] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<MissionRecommendation | null>(null);
  const [template, setTemplate] = useState<MissionTemplate | null>(null);
  const [readiness, setReadiness] = useState<MissionReadiness | null>(null);

  useEffect(() => {
    const load = async () => {
      const [anRes, chRes, plRes, recRes] = await Promise.all([
        api.getAnalyticsToday(),
        api.getTodayCheckins(),
        api.getTodayRoutinePlan(),
        api.getMissionRecommendations()
      ]);
      if (anRes.ok) setAnalytics(anRes.data);
      if (chRes.ok) setCheckins((chRes.data as any).checkins || []);
      if (plRes.ok) setPlan(plRes.data);
      
      if (recRes.ok && (recRes.data as any).length > 0) {
        const topRec = (recRes.data as any)[0];
        setRecommendation(topRec);
        
        // Fetch readiness and template for top rec
        const [readRes, tempRes] = await Promise.all([
          api.getMissionReadiness(topRec.template_id),
          api.getMissionTemplate(topRec.template_id)
        ]);
        if (readRes.ok) setReadiness(readRes.data as any);
        if (tempRes.ok) setTemplate(tempRes.data as any);
      }
    };
    load();
  }, []);

  const handleLaunchMission = async () => {
    if (!recommendation) return;
    try {
      const res = await api.createJobFromMissionTemplate(recommendation.template_id, { priority: recommendation.priority });
      if (res.ok) {
        onNavigateToMissionControl();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const status = deriveDashboardStatus(health, loading);
  
  const toneColors = {
    success: 'text-emerald-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    info: 'text-primary'
  };
  const confidenceColor = toneColors[status.tone];
  
  // Calculate stroke offset for SVG circle. Circumference is 2 * Math.PI * 88 ~= 553
  const dashOffset = 553 - (status.score / 100) * 553;

  return (
    <GlassCard glowColor="cyan" className="p-8 relative overflow-hidden group">
      {/* Background Glows */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-primary/20 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/30 transition-colors" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-secondary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-secondary/20 transition-colors" />

      <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
        
        {/* Left Side: Mission Info */}
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] uppercase tracking-widest text-white/60 font-display">
            <Target size={12} className="text-primary" />
            Active Protocol
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight leading-tight">
              {template ? `Mission: ${template.title.replace(' Mission', '')}` : 'Execute OpenClaw Build'}
            </h1>
            <p className="text-white/50 max-w-lg leading-relaxed">
              {recommendation ? recommendation.reason : 'Tillian Command Center · Current Focus: Core infrastructure and agent orchestration.'}
            </p>
            {readiness && !readiness.safe_to_create && !readiness.openclaw_required && readiness.duplicate_exists && (
              <p className="text-amber-400 text-sm mt-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Duplicate exists. Please review jobs.
              </p>
            )}
            {readiness?.fix_command && (
              <div className="mt-2 p-2 bg-black/40 border border-red-500/30 rounded inline-block">
                <div className="text-xs text-red-400 mb-1">Fix OpenClaw:</div>
                <code className="text-xs text-gray-300">{readiness.fix_command}</code>
              </div>
            )}
          </div>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            <button 
              onClick={handleLaunchMission} 
              disabled={!recommendation || (!readiness?.safe_to_create && !readiness?.openclaw_required)}
              className="relative overflow-hidden group/btn px-6 py-3 bg-white text-black font-semibold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform duration-300 disabled:opacity-50 disabled:hover:scale-100"
            >
              <span className="relative z-10 flex items-center gap-2">
                {readiness?.approval_required ? 'Launch (Needs Approval)' : 'Launch Mission'}
                <ArrowRight size={16} />
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
            </button>
            
            <button onClick={onGoToCheckIn} className="px-6 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/50 text-indigo-300 font-semibold rounded-xl flex items-center gap-2 transition-colors">
              Confirm Today
              <ArrowRight size={16} />
            </button>
            
            <div className="px-6 py-3 rounded-xl border border-white/10 flex items-center gap-3 bg-white/5 backdrop-blur-sm">
              {status.tone === 'danger' ? <AlertTriangle size={18} className="text-red-400" /> : <Activity size={18} className={confidenceColor} />}
              <div className="flex flex-col">
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-display">System State</span>
                <span className={`text-sm font-semibold ${confidenceColor} ${loading ? 'animate-pulse' : ''}`}>{status.label}</span>
              </div>
            </div>
          </div>
          
          {analytics && (
            <div className="flex flex-col gap-6 mt-4 pt-4 border-t border-white/10">
              <div className="flex flex-wrap gap-6">
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">Confirmed Score</span>
                  <span className="text-xl font-bold text-indigo-400">{analytics.confirmedCompletionScore ?? '--'}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest text-white/50 block mb-1">Unconfirmed</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {12 - checkins.filter(c => c.status === 'completed' || c.status === 'missed' || c.status === 'partial' || c.status === 'skipped' || c.status === 'adjusted').length}
                  </span>
                </div>
              </div>

              {plan && (
                <div className="space-y-3">
                  {plan.gymProtocol && (
                    <div>
                      <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Today's Gym</span>
                      <p className="text-indigo-300 font-medium">{plan.gymProtocol.title}</p>
                      <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">
                        {plan.gymProtocol.steps?.map((s:any) => s.title).join(', ')}
                      </p>
                    </div>
                  )}
                  {plan.skincareProtocol?.night && (
                    <div>
                      <span className="text-sm text-gray-400 uppercase tracking-wider font-semibold">Tonight's Skincare</span>
                      <p className="text-emerald-300 font-medium">{plan.skincareProtocol.night.title}</p>
                    </div>
                  )}
                  {plan.nextAction && (
                    <div className="bg-white/5 p-2 rounded flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-400">Next Action:</span>
                      <span className="text-sm font-medium text-white">{plan.nextAction.title}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Execution Score Ring */}
        <div className="flex-shrink-0 flex flex-col items-center justify-center relative gap-6">
          <div className="w-48 h-48 relative flex items-center justify-center">
            {/* Background Ring */}
            <svg className="w-full h-full absolute transform -rotate-90">
              <circle cx="96" cy="96" r="88" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
              <motion.circle 
                cx="96" cy="96" r="88" fill="none" 
                stroke="url(#gradient)" strokeWidth="6"
                strokeLinecap="round"
                initial={{ strokeDasharray: '553', strokeDashoffset: '553' }}
                animate={{ strokeDashoffset: dashOffset }} 
                transition={{ duration: 2, ease: "easeOut", delay: 0.5 }}
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#22D3EE" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
              </defs>
            </svg>
            
            {/* Center Content */}
            <div className="flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-display font-bold text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                {status.score}<span className="text-xl text-primary">%</span>
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-400 mt-1" />
              <span className="text-sm font-medium text-emerald-400">Safe Mode Active</span>
            </div>

            {/* Orbiting Dot */}
            <motion.div 
              className="absolute w-full h-full animate-spin-slow"
              style={{ animationDuration: '10s' }}
            >
              <div className="w-2 h-2 rounded-full bg-primary absolute top-1.5 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#22D3EE]" />
            </motion.div>
          </div>
        </div>

      </div>
    </GlassCard>
  );
};
