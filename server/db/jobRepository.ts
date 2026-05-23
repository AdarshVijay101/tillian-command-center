import { db } from './db';
import { randomUUID } from 'crypto';

export interface AgentJob {
  id: string;
  job_type: string;
  title: string;
  status: string; // pending, preflight_checking, blocked, awaiting_approval, approved, running, succeeded, failed, cancelled, timeout
  priority: string;
  requested_by: string;
  requires_approval: number;
  approved_at: string | null;
  started_at: string | null;
  finished_at: string | null;
  duration_ms: number | null;
  preflight_status: string | null;
  preflight_summary: string | null;
  command_action_id: string | null;
  action_run_id: string | null;
  result_summary: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  idempotency_key: string | null;
  created_at: string;
  updated_at: string;
}

export interface AgentJobEvent {
  id: string;
  job_id: string;
  event_type: string;
  message: string;
  metadata_json: string | null;
  created_at: string;
}

export const createJob = (job: Partial<AgentJob>): AgentJob => {
  const id = randomUUID();
  const now = new Date().toISOString();
  
  const newJob: AgentJob = {
    id,
    job_type: job.job_type || 'unknown',
    title: job.title || 'Untitled Job',
    status: job.status || 'pending',
    priority: job.priority || 'normal',
    requested_by: job.requested_by || 'system',
    requires_approval: job.requires_approval || 0,
    approved_at: job.approved_at || null,
    started_at: job.started_at || null,
    finished_at: job.finished_at || null,
    duration_ms: job.duration_ms || null,
    preflight_status: job.preflight_status || null,
    preflight_summary: job.preflight_summary || null,
    command_action_id: job.command_action_id || null,
    action_run_id: job.action_run_id || null,
    result_summary: job.result_summary || null,
    error_message: job.error_message || null,
    retry_count: job.retry_count || 0,
    max_retries: job.max_retries || 0,
    idempotency_key: job.idempotency_key || null,
    created_at: now,
    updated_at: now
  };

  const stmt = db.prepare(`
    INSERT INTO agent_jobs (
      id, job_type, title, status, priority, requested_by, requires_approval,
      approved_at, started_at, finished_at, duration_ms, preflight_status,
      preflight_summary, command_action_id, action_run_id, result_summary,
      error_message, retry_count, max_retries, idempotency_key, created_at, updated_at
    ) VALUES (
      @id, @job_type, @title, @status, @priority, @requested_by, @requires_approval,
      @approved_at, @started_at, @finished_at, @duration_ms, @preflight_status,
      @preflight_summary, @command_action_id, @action_run_id, @result_summary,
      @error_message, @retry_count, @max_retries, @idempotency_key, @created_at, @updated_at
    )
  `);

  stmt.run(newJob);
  return newJob;
};

export const getJobById = (id: string): AgentJob | null => {
  const stmt = db.prepare('SELECT * FROM agent_jobs WHERE id = ?');
  return (stmt.get(id) as AgentJob) || null;
};

export const getJobs = (filters: any = {}, limit: number = 50): AgentJob[] => {
  let query = 'SELECT * FROM agent_jobs WHERE 1=1';
  const params: any[] = [];

  if (filters.status) {
    query += ' AND status = ?';
    params.push(filters.status);
  }
  
  if (filters.job_type) {
    query += ' AND job_type = ?';
    params.push(filters.job_type);
  }

  query += ' ORDER BY created_at DESC LIMIT ?';
  params.push(limit);

  return db.prepare(query).all(...params) as AgentJob[];
};

export const updateJobStatus = (id: string, status: string, additionalFields: Partial<AgentJob> = {}): void => {
  const now = new Date().toISOString();
  
  const setClauses = ['status = @status', 'updated_at = @updated_at'];
  const params: any = { id, status, updated_at: now };

  for (const [key, value] of Object.entries(additionalFields)) {
    if (key !== 'id' && key !== 'status' && key !== 'updated_at') {
      setClauses.push(`${key} = @${key}`);
      params[key] = value;
    }
  }

  const query = `UPDATE agent_jobs SET ${setClauses.join(', ')} WHERE id = @id`;
  db.prepare(query).run(params);
};

export const addJobEvent = (jobId: string, eventType: string, message: string, metadata?: any): void => {
  const id = randomUUID();
  const now = new Date().toISOString();
  const metadata_json = metadata ? JSON.stringify(metadata) : null;

  db.prepare(`
    INSERT INTO agent_job_events (id, job_id, event_type, message, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, jobId, eventType, message, metadata_json, now);
};

export const getJobEvents = (jobId: string): AgentJobEvent[] => {
  return db.prepare('SELECT * FROM agent_job_events WHERE job_id = ? ORDER BY created_at ASC').all(jobId) as AgentJobEvent[];
};

export const getLatestJobs = (limit: number = 20): AgentJob[] => {
  return db.prepare('SELECT * FROM agent_jobs ORDER BY created_at DESC LIMIT ?').all(limit) as AgentJob[];
};

export const getRunningJobs = (): AgentJob[] => {
  return db.prepare("SELECT * FROM agent_jobs WHERE status = 'running' ORDER BY started_at DESC").all() as AgentJob[];
};

export const getPendingJobs = (): AgentJob[] => {
  return db.prepare("SELECT * FROM agent_jobs WHERE status IN ('pending', 'preflight_checking', 'awaiting_approval') ORDER BY created_at ASC").all() as AgentJob[];
};

export const cancelJob = (id: string, reason: string = 'Cancelled manually'): void => {
  updateJobStatus(id, 'cancelled', { error_message: reason, finished_at: new Date().toISOString() });
  addJobEvent(id, 'cancelled', reason);
};

export const getJobByIdempotencyKey = (key: string): AgentJob | null => {
  const stmt = db.prepare("SELECT * FROM agent_jobs WHERE idempotency_key = ? AND status NOT IN ('cancelled') ORDER BY created_at DESC LIMIT 1");
  return (stmt.get(key) as AgentJob) || null;
};

export const getJobStats = () => {
  const today = new Date().toISOString().split('T')[0];
  
  const pending = (db.prepare("SELECT count(*) as c FROM agent_jobs WHERE status IN ('pending', 'preflight_checking', 'awaiting_approval')").get() as any).c;
  const running = (db.prepare("SELECT count(*) as c FROM agent_jobs WHERE status = 'running'").get() as any).c;
  const blockedToday = (db.prepare(`SELECT count(*) as c FROM agent_jobs WHERE status = 'blocked' AND created_at >= '${today}'`).get() as any).c;
  const succeededToday = (db.prepare(`SELECT count(*) as c FROM agent_jobs WHERE status = 'succeeded' AND finished_at >= '${today}'`).get() as any).c;
  const failedToday = (db.prepare(`SELECT count(*) as c FROM agent_jobs WHERE status IN ('failed', 'timeout') AND finished_at >= '${today}'`).get() as any).c;
  
  const avgDurObj = db.prepare("SELECT avg(duration_ms) as avgDur FROM agent_jobs WHERE status = 'succeeded' AND duration_ms IS NOT NULL").get() as any;
  const averageDuration = avgDurObj?.avgDur || 0;

  const latestFailure = (db.prepare("SELECT * FROM agent_jobs WHERE status IN ('failed', 'timeout') ORDER BY finished_at DESC LIMIT 1").get() as AgentJob) || null;

  let queueHealthScore = 100;
  if (failedToday > 0) queueHealthScore -= Math.min(30, failedToday * 10);
  if (blockedToday > 0) queueHealthScore -= Math.min(20, blockedToday * 5);
  if (pending > 10) queueHealthScore -= 10;
  
  queueHealthScore = Math.max(0, queueHealthScore);

  return {
    pending,
    running,
    succeededToday,
    failedToday,
    blockedToday,
    averageDuration: Math.round(averageDuration),
    latestFailure,
    queueHealthScore
  };
};
