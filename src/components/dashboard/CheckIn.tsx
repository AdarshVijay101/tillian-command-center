import { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, TrendingUp, ShieldAlert, Zap, Edit3 } from 'lucide-react';
import { api } from '../../services/api';
import { getIsDemoMode } from '../../hooks/useDemoMode';

const EXPECTED_TASKS = [
  { key: 'work_focus', label: 'Work Focus', category: 'work' },
  { key: 'gym_session', label: 'Gym Session', category: 'gym' },
  { key: 'morning_skincare', label: 'Morning Skincare', category: 'skincare' },
  { key: 'post_gym_bodycare', label: 'Post-Gym Bodycare', category: 'skincare' },
  { key: 'night_skincare', label: 'Night Skincare', category: 'skincare' },
  { key: 'study_block_1', label: 'Study Block 1', category: 'study' },
  { key: 'study_block_2', label: 'Study Block 2', category: 'study' },
  { key: 'study_block_3', label: 'Study Block 3', category: 'study' },
  { key: 'evening_walk', label: 'Evening Walk', category: 'gym' },
  { key: 'meal_prep', label: 'Meal Prep', category: 'food' },
  { key: 'reading', label: 'Reading', category: 'reading' },
  { key: 'sleep_wind_down', label: 'Sleep Wind-down', category: 'sleep' },
];

export const CheckIn = () => {
  const isDemo = getIsDemoMode();
  const [checkins, setCheckins] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [reflection, setReflection] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  const [plan, setPlan] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const [chRes, anRes, plRes] = await Promise.all([
        api.getTodayCheckins(),
        api.getAnalyticsToday(),
        api.getTodayRoutinePlan()
      ]);
        const data = chRes.data as any;
        setCheckins(data?.checkins || []);
        setReflection(data?.reflection || {});
      if (anRes.ok) setAnalytics(anRes.data);
      if (plRes.ok) setPlan(plRes.data);
    };
    load();
  }, [refreshTrigger]);

  const handleTaskUpdate = async (task: any, status: string) => {
    setIsSubmitting(true);
    await api.submitCheckin({
      category: task.category,
      itemKey: task.key,
      itemLabel: task.label,
      status,
      confidence: 'high'
    });
    setIsSubmitting(false);
    setRefreshTrigger(p => p + 1);
  };

  const handleAdjustmentFeedback = async (adj: any, status: string) => {
    setIsSubmitting(true);
    await api.submitCheckin({
      category: 'dynamic_adjustment',
      itemKey: adj.id,
      itemLabel: adj.title,
      status,
      confidence: 'high'
    });
    setIsSubmitting(false);
    setRefreshTrigger(p => p + 1);
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReflectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reflection.energyLevel && !reflection.focusQuality && !reflection.sleepQuality && !reflection.sorenessLevel && !reflection.skinStatus && !reflection.mood && !reflection.biggestWin && !reflection.mainBlocker && !reflection.tomorrowAdjustment) {
      showToast('Reflection is empty. Please fill out at least one field.', 'error');
      return;
    }
    setIsSubmitting(true);
    const res = await api.submitReflection(reflection);
    setIsSubmitting(false);
    if (res.ok) {
      setSavedAt(new Date());
      showToast('Reflection saved successfully.', 'success');
      setRefreshTrigger(p => p + 1);
    } else {
      showToast('Failed to save reflection.', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'partial': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'skipped': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'missed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'adjusted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-white/5 text-gray-400 border-white/10';
    }
  };

  const currentAdjustments = analytics?.dynamicAdjustments || [];
  const confirmedCount = checkins.filter(c => c.status === 'completed' || c.status === 'partial').length;
  const missedCount = checkins.filter(c => c.status === 'missed').length;

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090b] text-gray-100 min-h-screen relative">
      {toast && (
        <div className={`absolute top-4 right-8 px-4 py-2 rounded-lg shadow-lg font-medium text-sm flex items-center gap-2 z-50 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center border border-indigo-500/30">
              <CheckCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Daily Check-In</h1>
          </div>
          <p className="text-gray-400">Human confirmation layer for Tillian automated intelligence.</p>
        </div>

        {isDemo && (
          <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-center space-x-3">
            <ShieldAlert className="w-5 h-5 text-blue-400" />
            <p className="text-blue-300">DEMO CHECK-IN — Simulations run locally and do not mutate SQLite.</p>
          </div>
        )}

        {/* Confidence Panel */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#111113] p-5 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1 flex items-center"><TrendingUp className="w-4 h-4 mr-2" /> Protocol Delivery</h3>
            <div className="text-3xl font-bold text-gray-200">{analytics?.protocolDeliveryScore ?? '--'}</div>
          </div>
          <div className="bg-[#111113] p-5 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1 flex items-center"><CheckCircle className="w-4 h-4 mr-2" /> Confirmed Score</h3>
            <div className="text-3xl font-bold text-indigo-400">{analytics?.confirmedCompletionScore ?? '--'}</div>
          </div>
          <div className="bg-[#111113] p-5 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Confidence</h3>
            <div className="text-xl font-bold capitalize text-emerald-400 mt-2">{analytics?.confidence || 'Low'}</div>
          </div>
          <div className="bg-[#111113] p-5 rounded-2xl border border-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-1 flex items-center"><Edit3 className="w-4 h-4 mr-2" /> Progress</h3>
            <div className="text-xl font-bold text-gray-200 mt-2">{confirmedCount} Confirmed / {missedCount} Missed</div>
          </div>
        </div>

        {/* Today Completion Grid */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center"><Zap className="w-5 h-5 mr-2 text-indigo-400" /> Today Completion Grid</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXPECTED_TASKS.map(task => {
              const checkin = checkins.find(c => c.item_key === task.key);
              const status = checkin?.status || 'pending';
              let protocolData = null;
              if (task.key === 'gym_session' && plan?.gymProtocol) protocolData = plan.gymProtocol;
              if (task.key === 'morning_skincare' && plan?.skincareProtocol?.morning) protocolData = plan.skincareProtocol.morning;
              if (task.key === 'night_skincare' && plan?.skincareProtocol?.night) protocolData = plan.skincareProtocol.night;

              return (
                <div key={task.key} className={`p-4 rounded-xl border ${getStatusColor(status)} transition-colors`}>
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold">{task.label}</h4>
                    <span className="text-xs uppercase tracking-wider font-bold opacity-75">{status}</span>
                  </div>
                  
                  {protocolData && (
                    <div className="mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                      <p className="text-xs font-semibold text-indigo-300 mb-1">Today: {protocolData.title}</p>
                      <p className="text-xs text-gray-400">
                        {protocolData.steps ? protocolData.steps.map((s:any) => s.title).join(', ') : protocolData.description}
                      </p>
                      {protocolData.safety_notes && (
                        <p className="text-xs text-red-300 mt-2">Note: {protocolData.safety_notes}</p>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleTaskUpdate(task, 'completed')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">Done</button>
                    <button onClick={() => handleTaskUpdate(task, 'partial')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">Partial</button>
                    <button onClick={() => handleTaskUpdate(task, 'skipped')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">Skip</button>
                    <button onClick={() => handleTaskUpdate(task, 'missed')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors">Miss</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Dynamic Adjustments Feedback */}
        {currentAdjustments.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center"><AlertCircle className="w-5 h-5 mr-2 text-yellow-400" /> Dynamic Adjustments</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentAdjustments.map((adj: any) => {
                const checkin = checkins.find(c => c.item_key === adj.id);
                const status = checkin?.status || 'pending';
                
                return (
                  <div key={adj.id} className={`p-4 rounded-xl border ${getStatusColor(status)}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold">{adj.title}</h4>
                        <p className="text-xs opacity-70 mt-1">{adj.summary.split('\n')[0]}</p>
                      </div>
                      <span className="text-xs uppercase tracking-wider font-bold opacity-75">{status}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => handleAdjustmentFeedback(adj, 'completed')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">Helped</button>
                      <button onClick={() => handleAdjustmentFeedback(adj, 'partial')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-white/10 hover:bg-white/20 transition-colors">Partially</button>
                      <button onClick={() => handleAdjustmentFeedback(adj, 'missed')} disabled={isSubmitting} className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/40 text-red-300 transition-colors">Did Not Help</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Daily Reflection */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center"><Edit3 className="w-5 h-5 mr-2 text-indigo-400" /> Daily Reflection</h2>
          <form onSubmit={handleReflectionSubmit} className="bg-[#111113] p-6 rounded-2xl border border-white/5 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Energy Level (1-10)</label>
                <input type="number" min="1" max="10" value={reflection.energyLevel || ''} onChange={e => setReflection({...reflection, energyLevel: parseInt(e.target.value) || null})} className="w-full bg-[#1A1A1D] border border-white/10 rounded-lg p-2 text-gray-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Focus Quality (1-10)</label>
                <input type="number" min="1" max="10" value={reflection.focusQuality || ''} onChange={e => setReflection({...reflection, focusQuality: parseInt(e.target.value) || null})} className="w-full bg-[#1A1A1D] border border-white/10 rounded-lg p-2 text-gray-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Sleep Quality (1-10)</label>
                <input type="number" min="1" max="10" value={reflection.sleepQuality || ''} onChange={e => setReflection({...reflection, sleepQuality: parseInt(e.target.value) || null})} className="w-full bg-[#1A1A1D] border border-white/10 rounded-lg p-2 text-gray-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Soreness Level (1-10)</label>
                <input type="number" min="1" max="10" value={reflection.sorenessLevel || ''} onChange={e => setReflection({...reflection, sorenessLevel: parseInt(e.target.value) || null})} className="w-full bg-[#1A1A1D] border border-white/10 rounded-lg p-2 text-gray-200" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Skin Status</label>
                <select value={reflection.skinStatus || ''} onChange={e => setReflection({...reflection, skinStatus: e.target.value || null})} className="w-full bg-[#1A1A1D] border border-white/10 rounded-lg p-2 text-gray-200">
                  <option value="">-- Select --</option>
                  <option value="calm">Calm</option>
                  <option value="irritated">Irritated</option>
                  <option value="acne_flare">Acne Flare</option>
                  <option value="dry">Dry</option>
                  <option value="oily">Oily</option>
                  <option value="recovery">Recovery</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Mood</label>
                <input type="text" maxLength={100} value={reflection.mood || ''} onChange={e => setReflection({...reflection, mood: e.target.value})} className="w-full bg-[#1A1A1D] border border-white/10 rounded-lg p-2 text-gray-200" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Biggest Win</label>
              <textarea maxLength={500} value={reflection.biggestWin || ''} onChange={e => setReflection({...reflection, biggestWin: e.target.value})} className="w-full h-20 bg-[#1A1A1D] border border-white/10 rounded-lg p-3 text-gray-200 resize-none" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Main Blocker</label>
                <textarea maxLength={500} value={reflection.mainBlocker || ''} onChange={e => setReflection({...reflection, mainBlocker: e.target.value})} className="w-full h-20 bg-[#1A1A1D] border border-white/10 rounded-lg p-3 text-gray-200 resize-none" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Tomorrow Adjustment</label>
                <textarea maxLength={500} value={reflection.tomorrowAdjustment || ''} onChange={e => setReflection({...reflection, tomorrowAdjustment: e.target.value})} className="w-full h-20 bg-[#1A1A1D] border border-white/10 rounded-lg p-3 text-gray-200 resize-none" />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button disabled={isSubmitting} type="submit" className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                Save Daily Reflection
              </button>
              {savedAt && <span className="text-sm text-gray-500 font-medium">Saved at {savedAt.toLocaleTimeString()}</span>}
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};
