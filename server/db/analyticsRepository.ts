import { getSqliteRuns } from './runRepository';
import { getGeneratedFilesToday, getLatestGeneratedFiles } from './fileRepository';
import { getTodayCheckins } from './checkinRepository';
import { db } from './db';

export const getOverview = () => {
  const runs = getSqliteRuns();
  const totalRuns = runs.length;
  const successfulRuns = runs.filter(r => r.status === 'success').length;
  const failedRuns = runs.filter(r => r.status === 'error' || r.status === 'blocked').length;
  const runningRuns = runs.filter(r => r.status === 'running' || r.status === 'pending').length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns / totalRuns) * 100) : 0;
  
  const completedRuns = runs.filter(r => r.durationMs != null);
  const averageDurationMs = completedRuns.length > 0 
    ? Math.round(completedRuns.reduce((acc, r) => acc + r.durationMs, 0) / completedRuns.length)
    : 0;

  const todayStr = new Date().toISOString().split('T')[0];
  const runsToday = runs.filter(r => r.startedAt.startsWith(todayStr)).length;

  const dynamicAdjustmentsToday = db.prepare('SELECT count(*) as c FROM dynamic_adjustments WHERE created_at LIKE ?').get(todayStr + '%') as any;
  const filesGeneratedTodayCount = db.prepare('SELECT count(*) as c FROM generated_files WHERE detected_at LIKE ?').get(todayStr + '%') as any;
  
  const latestDailyPlan = db.prepare('SELECT * FROM generated_files WHERE file_name LIKE ? ORDER BY detected_at DESC LIMIT 1').get('%daily_plan%');
  const latestAdjustment = db.prepare('SELECT * FROM dynamic_adjustments ORDER BY created_at DESC LIMIT 1').get();

  let automationReadinessScore = 90;
  if (successRate < 80) automationReadinessScore -= 20;
  if (failedRuns > 5) automationReadinessScore -= 10;

  return {
    totalRuns,
    successfulRuns,
    failedRuns,
    runningRuns,
    successRate,
    averageDurationMs,
    runsToday,
    dynamicAdjustmentsToday: dynamicAdjustmentsToday ? dynamicAdjustmentsToday.c : 0,
    filesGeneratedToday: filesGeneratedTodayCount ? filesGeneratedTodayCount.c : 0,
    latestDailyPlan: latestDailyPlan || null,
    latestAdjustment: latestAdjustment || null,
    automationReadinessScore
  };
};

export const getTodayAnalytics = () => {
  const runs = getSqliteRuns();
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRuns = runs.filter(r => r.startedAt.startsWith(todayStr));
  
  const successCount = todayRuns.filter(r => r.status === 'success').length;
  const errorCount = todayRuns.filter(r => r.status === 'error' || r.status === 'blocked').length;
  
  // Heuristic Scoring (Protocol Delivery)
  let automationScore = 90;
  if (errorCount > 0) automationScore -= (errorCount * 10);
  if (automationScore < 0) automationScore = 0;

  let gymScore = todayRuns.some(r => r.actionId.includes('gym')) ? 100 : 0;
  let skincareScore = todayRuns.some(r => r.actionId.includes('skin')) ? 100 : 0;
  let studyScore = todayRuns.some(r => r.actionId.includes('study')) ? 100 : 0;
  let sleepScore = todayRuns.some(r => r.actionId.includes('sleep')) ? 100 : 0;
  let workScore = todayRuns.some(r => r.actionId.includes('planner') || r.actionId.includes('review')) ? 100 : 0;

  const protocolDeliveryScore = Math.round(
    (automationScore * 0.25) + 
    (workScore * 0.20) + 
    (gymScore * 0.15) + 
    (skincareScore * 0.15) + 
    (studyScore * 0.15) + 
    (sleepScore * 0.10)
  );

  // Confirmed Completion Scoring
  const checkins = getTodayCheckins() as any[];
  let confirmedCompletionScore: number | null = null;
  let suggestedDailyScore = protocolDeliveryScore;
  let confidence = 'low';
  let explanation = 'No user confirmations yet. Score is based on protocol delivery only.';

  if (checkins.length > 0) {
    const calcScore = (list: any[]) => {
      let total = 0;
      for (const c of list) {
        if (c.status === 'completed') total += 100;
        if (c.status === 'partial' || c.status === 'adjusted') total += 50;
      }
      return list.length > 0 ? Math.round(total / list.length) : 0;
    };
    confirmedCompletionScore = calcScore(checkins);

    if (checkins.length >= 1 && checkins.length <= 4) {
      suggestedDailyScore = Math.round((confirmedCompletionScore * 0.40) + (protocolDeliveryScore * 0.60));
      confidence = 'medium-low';
      explanation = 'Based on partial user confirmations blended with protocol delivery.';
    } else if (checkins.length >= 5 && checkins.length <= 8) {
      suggestedDailyScore = Math.round((confirmedCompletionScore * 0.65) + (protocolDeliveryScore * 0.35));
      confidence = 'medium';
      explanation = 'Based heavily on user confirmations.';
    } else if (checkins.length >= 9) {
      suggestedDailyScore = Math.round((confirmedCompletionScore * 0.80) + (protocolDeliveryScore * 0.20));
      confidence = 'high';
      explanation = 'Confirmed check-ins are weighted highest, providing an accurate execution score.';
    }
  }

  const todayFiles = getGeneratedFilesToday();
  const todayAdjustments = db.prepare('SELECT * FROM dynamic_adjustments WHERE created_at LIKE ?').all(todayStr + '%');

  return {
    date: todayStr,
    runsToday: todayRuns.length,
    successCount,
    errorCount,
    latestFiles: todayFiles,
    dynamicAdjustments: todayAdjustments,
    protocolDeliveryScore,
    confirmedCompletionScore,
    suggestedDailyScore,
    confidence,
    scoreSource: checkins.length > 0 ? "confirmed_hybrid" : "heuristic",
    explanation,
    scoreBreakdown: {
      automation: automationScore,
      work: workScore,
      gym: gymScore,
      skincare: skincareScore,
      study: studyScore,
      sleep: sleepScore
    },
    timelineSummary: todayRuns.map(r => ({ time: r.startedAt, action: r.actionLabel, status: r.status }))
  };
};

export const getTrends = () => {
  const runs = getSqliteRuns();
  const days = Array.from({length: 14}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().split('T')[0];
  });

  const runsByDay = days.map(day => ({
    date: day,
    count: runs.filter(r => r.startedAt.startsWith(day)).length
  }));

  const failuresByDay = days.map(day => ({
    date: day,
    count: runs.filter(r => r.startedAt.startsWith(day) && (r.status === 'error' || r.status === 'blocked')).length
  }));

  return {
    runsByDay,
    failuresByDay,
    dynamicAdjustmentsByMode: [],
    averageDurationByCategory: []
  };
};
