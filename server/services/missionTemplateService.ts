import { getMissionTemplateById, getActiveMissionTemplates } from '../db/missionTemplateRepository';
import { createAgentJob } from './jobQueueService';
import { addJobEvent, getJobByIdempotencyKey } from '../db/jobRepository';
import { checkSystemHealth } from '../healthService';

export interface MissionReadiness {
  template_available: boolean;
  openclaw_required: boolean;
  openclaw_reachable: boolean;
  duplicate_exists: boolean;
  approval_required: boolean;
  safe_to_create: boolean;
  warnings: string[];
  next_step: string;
  fix_command?: string;
}

export interface MissionRecommendation {
  template_id: string;
  reason: string;
  priority: 'high' | 'normal' | 'low';
}

function generateIdempotencyKey(jobType: string): string | undefined {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  
  if (jobType === 'run_daily_planner') return `daily_planner_${dateStr}`;
  if (jobType === 'run_morning_brief') return `morning_brief_${dateStr}`;
  if (jobType === 'run_evening_review') return `evening_review_${dateStr}`;
  
  if (jobType === 'run_weekly_digest') {
    // Basic week calculation (not ISO perfect but good enough for idempotency)
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    return `weekly_digest_${d.getUTCFullYear()}-W${weekNo}`;
  }
  return undefined;
}

export async function getMissionTemplateReadiness(templateId: string): Promise<MissionReadiness> {
  const template = getMissionTemplateById(templateId);
  const readiness: MissionReadiness = {
    template_available: false,
    openclaw_required: false,
    openclaw_reachable: false,
    duplicate_exists: false,
    approval_required: false,
    safe_to_create: false,
    warnings: [],
    next_step: 'Cannot proceed.'
  };

  if (!template) {
    readiness.warnings.push('Template not found.');
    return readiness;
  }

  readiness.template_available = true;
  readiness.openclaw_required = template.requires_openclaw === 1;
  readiness.approval_required = template.requires_approval === 1;

  // Check OpenClaw
  if (readiness.openclaw_required) {
    const health = await checkSystemHealth();
    readiness.openclaw_reachable = health.openclawGatewayReachable && health.openclawBrowserReachable;
    if (!readiness.openclaw_reachable) {
      readiness.warnings.push('OpenClaw is offline or degraded.');
      readiness.fix_command = '& "$env:USERPROFILE\\OpenClawAutomation\\Start-OpenClaw-Background.ps1"';
    }
  } else {
    readiness.openclaw_reachable = true; // Not required, so "reachable" in terms of readiness
  }

  // Check duplicates
  const idemKey = generateIdempotencyKey(template.job_type);
  if (idemKey) {
    const existingJob = getJobByIdempotencyKey(idemKey);
    if (existingJob) {
      readiness.duplicate_exists = true;
      readiness.warnings.push('A duplicate mission for this timeframe already exists.');
    }
  }

  // Aggregate safety
  if (readiness.openclaw_required && !readiness.openclaw_reachable) {
    readiness.safe_to_create = false;
    readiness.next_step = 'Fix OpenClaw connectivity first.';
  } else if (readiness.duplicate_exists) {
    readiness.safe_to_create = false;
    readiness.next_step = 'View existing mission.';
  } else {
    readiness.safe_to_create = true;
    readiness.next_step = readiness.approval_required ? 'Create mission and await approval.' : 'Create and execute mission.';
  }

  return readiness;
}

export function explainMissionTemplate(templateId: string): any {
  const template = getMissionTemplateById(templateId);
  if (!template) throw new Error('Template not found');
  
  return {
    id: template.id,
    title: template.title,
    description: template.description,
    safety_notes: template.safety_notes,
    expected_duration_label: template.expected_duration_label,
    is_heavy: template.is_heavy === 1,
    requires_approval: template.requires_approval === 1
  };
}

export async function createJobFromTemplate(templateId: string, options: any = {}) {
  const template = getMissionTemplateById(templateId);
  if (!template) throw new Error('Template not found');

  const readiness = await getMissionTemplateReadiness(templateId);
  if (readiness.duplicate_exists) {
    throw new Error('Duplicate mission already exists for this timeframe.');
  }

  // We allow creating the job even if openclaw is offline, it will just get blocked at preflight phase.
  // The jobQueueService.createAgentJob handles idempotency internally if we pass it, but we can pass it here.

  const idemKey = generateIdempotencyKey(template.job_type);

  const job = await createAgentJob(
    template.job_type,
    options.priority || template.default_priority,
    options.title || template.title,
    options
  );

  addJobEvent(job.id, 'template_origin', `Job originated from mission template: ${template.title}`, JSON.stringify({ mission_template_id: template.id }));

  return job;
}

export async function getTodayMissionRecommendations(): Promise<MissionRecommendation[]> {
  const recommendations: MissionRecommendation[] = [];
  const health = await checkSystemHealth();
  
  const dailyPlannerKey = generateIdempotencyKey('run_daily_planner')!;
  const eveningReviewKey = generateIdempotencyKey('run_evening_review')!;
  
  const hasDailyPlanner = getJobByIdempotencyKey(dailyPlannerKey);
  const hasEveningReview = getJobByIdempotencyKey(eveningReviewKey);
  
  const currentHour = new Date().getHours();

  if (!hasDailyPlanner) {
    recommendations.push({
      template_id: 'daily_planner',
      reason: 'Daily plan has not been generated for today.',
      priority: 'high'
    });
  }

  if (currentHour >= 18 && !hasEveningReview) {
    recommendations.push({
      template_id: 'evening_review',
      reason: 'It is evening and today has not been reviewed.',
      priority: 'high'
    });
  }

  if (health.overallStatus !== 'healthy') {
    recommendations.push({
      template_id: 'reliability_test',
      reason: 'System health is degraded. Run reliability test to diagnose.',
      priority: 'normal'
    });
  }

  if (health.missingScheduledTasks && health.missingScheduledTasks.length > 0) {
    recommendations.push({
      template_id: 'scheduler_audit',
      reason: 'Scheduled tasks are missing. Run audit to fix.',
      priority: 'normal'
    });
  }

  // Fallback
  if (recommendations.length === 0) {
    recommendations.push({
      template_id: 'sync_generated_files',
      reason: 'System is healthy. Sync latest files.',
      priority: 'low'
    });
  }

  return recommendations;
}
