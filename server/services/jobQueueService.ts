import { 
  createJob, getJobById, updateJobStatus, addJobEvent, getJobByIdempotencyKey, AgentJob 
} from '../db/jobRepository';
import { ALLOWED_SCRIPTS, OPENCLAW_GATEWAY_URL } from '../config';
import { runScript } from '../commandRunner';
import { createRun, updateRun } from '../actionRunService';
import { captureHealthSnapshot } from '../db/healthRepository';
import { checkSystemHealth } from '../healthService';
import { getLatestFiles } from '../fileService';
import { upsertGeneratedFile } from '../db/fileRepository';
import { auditReminderScheduledTasks } from './schedulerAuditService';

// Constants
const HEAVY_AI_JOBS = [
  'run_daily_planner',
  'run_morning_brief',
  'run_evening_review',
  'run_weekly_digest'
];

const ALLOWED_JOB_TYPES = [
  ...HEAVY_AI_JOBS,
  'send_routine_reminder',
  'send_dynamic_adjustment',
  'capture_health_snapshot',
  'sync_generated_files',
  'migrate_runs',
  'scheduler_audit',
  'notification_test',
  'reliability_test'
];

function getScriptForJobType(jobType: string): string | null {
  switch (jobType) {
    case 'run_daily_planner': return ALLOWED_SCRIPTS.dailyPlanner;
    case 'run_morning_brief': return ALLOWED_SCRIPTS.morningBrief;
    case 'run_evening_review': return ALLOWED_SCRIPTS.eveningReview;
    case 'run_weekly_digest': return ALLOWED_SCRIPTS.weeklyDigest;
    case 'send_routine_reminder': return ALLOWED_SCRIPTS.routineReminder;
    case 'send_dynamic_adjustment': return ALLOWED_SCRIPTS.dynamicAdjustment;
    default: return null;
  }
}

export function generateIdempotencyKey(jobType: string): string | null {
  const date = new Date().toISOString().split('T')[0];
  if (['run_daily_planner', 'run_morning_brief', 'run_evening_review'].includes(jobType)) {
    return `${jobType}_${date}`;
  }
  if (jobType === 'run_weekly_digest') {
    // Basic week calc (not fully ISO, but fine for idempotency)
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${jobType}_${d.getUTCFullYear()}-W${weekNo}`;
  }
  return null;
}

export async function createAgentJob(jobType: string, priority: string, title: string, options: any = {}): Promise<AgentJob> {
  if (!ALLOWED_JOB_TYPES.includes(jobType)) {
    throw new Error(`Invalid job type: ${jobType}`);
  }

  const idempotencyKey = generateIdempotencyKey(jobType);
  if (idempotencyKey) {
    const existing = getJobByIdempotencyKey(idempotencyKey);
    if (existing) {
      addJobEvent(existing.id, 'duplicate_prevented', 'Duplicate request mapped to existing job.');
      return existing;
    }
  }

  const requiresApproval = HEAVY_AI_JOBS.includes(jobType) ? 1 : 0;
  const status = 'pending';

  const newJob = createJob({
    job_type: jobType,
    title,
    status,
    priority,
    requires_approval: requiresApproval,
    idempotency_key: idempotencyKey,
    max_retries: 2
  });

  addJobEvent(newJob.id, 'created', 'Job created in pending state.');
  return newJob;
}

export async function runPreflightForJob(jobId: string): Promise<AgentJob> {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found');

  if (job.status !== 'pending' && job.status !== 'failed' && job.status !== 'timeout') {
    throw new Error(`Cannot run preflight from status: ${job.status}`);
  }

  updateJobStatus(jobId, 'preflight_checking');
  addJobEvent(jobId, 'preflight_started', 'Running preflight checks...');

  // Check OpenClaw Gateway if it's a heavy job
  if (HEAVY_AI_JOBS.includes(job.job_type)) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${OPENCLAW_GATEWAY_URL}/ping`, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error('Gateway returned error');
    } catch (e: any) {
      updateJobStatus(jobId, 'blocked', { 
        preflight_status: 'failed',
        preflight_summary: 'OpenClaw Gateway offline',
        error_message: 'Run: openclaw gateway run --port 18789'
      });
      addJobEvent(jobId, 'blocked', 'OpenClaw Gateway offline. Heavy action blocked.', { error: e.message });
      return getJobById(jobId)!;
    }
  }

  updateJobStatus(jobId, job.requires_approval ? 'awaiting_approval' : 'approved', {
    preflight_status: 'passed',
    preflight_summary: 'All checks passed'
  });
  addJobEvent(jobId, 'preflight_passed', job.requires_approval ? 'Awaiting manual approval.' : 'Preflight passed, ready for execution.');

  return getJobById(jobId)!;
}

export async function approveJob(jobId: string): Promise<AgentJob> {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found');

  if (job.status !== 'awaiting_approval') {
    throw new Error('Job is not awaiting approval');
  }

  updateJobStatus(jobId, 'approved', { approved_at: new Date().toISOString() });
  addJobEvent(jobId, 'approved', 'Job manually approved.');
  
  return getJobById(jobId)!;
}

export function validateJobCanExecute(jobId: string): void {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found');

  if (job.status === 'blocked') throw new Error('Cannot execute: job is blocked');
  if (job.status === 'cancelled') throw new Error('Cannot execute: job is cancelled');

  if (job.requires_approval && job.status !== 'approved') {
    throw new Error(`Cannot execute: job requires approval and is ${job.status}`);
  }

  if (!job.requires_approval && !['pending', 'approved'].includes(job.status)) {
    throw new Error(`Cannot execute: job is ${job.status}`);
  }
}

export function markJobRunning(jobId: string): AgentJob {
  updateJobStatus(jobId, 'running', { started_at: new Date().toISOString() });
  addJobEvent(jobId, 'execution_started', 'Job execution started.');
  return getJobById(jobId)!;
}

export async function executeJob(jobId: string): Promise<AgentJob> {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found');

  if (job.status !== 'running') {
    throw new Error(`Cannot execute job body unless status is running. Current status: ${job.status}`);
  }

  const startMs = Date.now();
  let resultSummary = '';
  let errorMessage: string | null = null;
  let finalStatus = 'succeeded';

  try {
    const scriptPath = getScriptForJobType(job.job_type);
    
    if (scriptPath) {
      // Execute via runScript
      const runRecord = await createRun({
        actionId: job.job_type,
        actionLabel: job.title,
        category: 'job',
        status: 'running'
      });
      
      updateJobStatus(jobId, 'running', { action_run_id: runRecord.id });

      const args: string[] = []; // Pass args if needed later
      const result = await runScript(scriptPath, args, 1200);

      await updateRun(runRecord.id, {
        status: result.ok ? 'success' : 'error',
        stdout: result.stdout,
        stderr: result.stderr,
        endedAt: new Date().toISOString(),
        durationMs: result.durationMs
      });

      if (!result.ok) {
        throw new Error(result.error || 'Script execution failed');
      }
      resultSummary = 'Script completed successfully.';
    } else {
      // Execute internal functions
      if (job.job_type === 'capture_health_snapshot') {
        const health = await checkSystemHealth();
        const snapId = captureHealthSnapshot(health);
        resultSummary = `Snapshot ID: ${snapId}`;
      } else if (job.job_type === 'sync_generated_files') {
        const files = await getLatestFiles();
        let count = 0;
        for (const file of files) {
          upsertGeneratedFile(file);
          count++;
        }
        resultSummary = `Synced ${count} files.`;
      } else if (job.job_type === 'scheduler_audit') {
        await auditReminderScheduledTasks();
        resultSummary = 'Scheduler audited.';
      } else if (job.job_type === 'reliability_test' || job.job_type === 'notification_test') {
        resultSummary = 'Test simulated successfully.';
      } else {
        throw new Error('Unsupported job type or missing script mapping');
      }
    }
  } catch (err: any) {
    finalStatus = 'failed';
    errorMessage = err.message || 'Unknown error';
    resultSummary = 'Job failed during execution.';
  }

  const durationMs = Date.now() - startMs;
  updateJobStatus(jobId, finalStatus, {
    finished_at: new Date().toISOString(),
    duration_ms: durationMs,
    result_summary: resultSummary,
    error_message: errorMessage
  });

  addJobEvent(jobId, finalStatus === 'succeeded' ? 'execution_succeeded' : 'execution_failed', resultSummary, errorMessage ? { error: errorMessage } : null);

  return getJobById(jobId)!;
}

export async function cancelAgentJob(jobId: string): Promise<AgentJob> {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found');

  if (job.status === 'running') {
    throw new Error('Running process cancellation is not supported in this phase.');
  }

  if (['succeeded', 'failed', 'cancelled', 'timeout'].includes(job.status)) {
    throw new Error(`Cannot cancel a job that is already ${job.status}`);
  }

  updateJobStatus(jobId, 'cancelled', { 
    finished_at: new Date().toISOString(),
    error_message: 'Cancelled manually'
  });
  addJobEvent(jobId, 'cancelled', 'Job was manually cancelled.');

  return getJobById(jobId)!;
}

export async function retryJob(jobId: string): Promise<AgentJob> {
  const job = getJobById(jobId);
  if (!job) throw new Error('Job not found');

  if (job.status !== 'failed' && job.status !== 'timeout') {
    throw new Error(`Cannot retry job in status: ${job.status}`);
  }

  if (job.retry_count >= job.max_retries) {
    throw new Error('Max retries exceeded');
  }

  updateJobStatus(jobId, 'pending', {
    retry_count: job.retry_count + 1,
    error_message: null,
    finished_at: null,
    duration_ms: null,
    preflight_status: null
  });
  addJobEvent(jobId, 'retrying', `Job retry ${job.retry_count + 1} initiated.`);

  return getJobById(jobId)!;
}
