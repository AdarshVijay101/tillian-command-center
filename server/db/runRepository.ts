import { db } from './db';
import { RunRecord } from '../actionRunService';
import crypto from 'crypto';

export const upsertRun = (run: RunRecord) => {
  const insertRunStmt = db.prepare(`
    INSERT INTO action_runs (
      id, action_id, action_label, category, status, started_at, ended_at,
      duration_ms, stdout_summary, stderr_summary, sanitized_output, endpoint,
      triggered_by, is_demo, related_file_candidates, notes, created_at
    ) VALUES (
      @id, @action_id, @action_label, @category, @status, @started_at, @ended_at,
      @duration_ms, @stdout_summary, @stderr_summary, @sanitized_output, @endpoint,
      @triggered_by, @is_demo, @related_file_candidates, @notes, @created_at
    )
    ON CONFLICT(id) DO UPDATE SET
      status=excluded.status,
      ended_at=excluded.ended_at,
      duration_ms=excluded.duration_ms,
      stdout_summary=excluded.stdout_summary,
      stderr_summary=excluded.stderr_summary,
      sanitized_output=excluded.sanitized_output,
      related_file_candidates=excluded.related_file_candidates,
      notes=excluded.notes
  `);

  insertRunStmt.run({
    id: run.id,
    action_id: run.actionId,
    action_label: run.actionLabel,
    category: run.category || 'general',
    status: run.status,
    started_at: run.startedAt,
    ended_at: run.endedAt || null,
    duration_ms: run.durationMs || null,
    stdout_summary: run.stdout ? run.stdout.substring(0, 1000) : null,
    stderr_summary: run.stderr ? run.stderr.substring(0, 1000) : null,
    sanitized_output: run.sanitizedOutput || null,
    endpoint: run.endpoint || null,
    triggered_by: run.triggeredBy || 'system',
    is_demo: 0, // Not explicitly in RunRecord
    related_file_candidates: run.relatedFileCandidates ? JSON.stringify(run.relatedFileCandidates) : null,
    notes: run.notes || null,
    created_at: new Date().toISOString()
  });

  if (run.actionId.startsWith('dynamic_adjustment_')) {
    const mode = run.actionId.replace('dynamic_adjustment_', '');
    const title = run.actionLabel;
    let logged_file_path = null;
    let summary = run.stdout ? run.stdout.substring(0, 500) : '';

    if (run.stdout) {
      const match = run.stdout.match(/Logged adjustment file: (.*\.md)/);
      if (match) logged_file_path = match[1].trim();
    }

    const insertAdjStmt = db.prepare(`
      INSERT INTO dynamic_adjustments (id, mode, title, created_at, source_run_id, logged_file_path, summary)
      VALUES (@id, @mode, @title, @created_at, @source_run_id, @logged_file_path, @summary)
      ON CONFLICT(id) DO UPDATE SET summary=excluded.summary, logged_file_path=excluded.logged_file_path
    `);
    
    insertAdjStmt.run({
      id: crypto.createHash('md5').update(run.id).digest('hex'),
      mode,
      title,
      created_at: run.startedAt,
      source_run_id: run.id,
      logged_file_path,
      summary
    });
  }
};

export const getSqliteRuns = () => {
  const runs = db.prepare('SELECT * FROM action_runs ORDER BY started_at DESC LIMIT 500').all() as any[];
  return runs.map(r => ({
    id: r.id,
    actionId: r.action_id,
    actionLabel: r.action_label,
    category: r.category,
    status: r.status,
    startedAt: r.started_at,
    endedAt: r.ended_at,
    durationMs: r.duration_ms,
    stdoutSummary: r.stdout_summary,
    stderrSummary: r.stderr_summary,
    sanitizedOutput: r.sanitized_output,
    endpoint: r.endpoint,
    triggeredBy: r.triggered_by,
    isDemo: r.is_demo === 1,
    relatedFileCandidates: r.related_file_candidates ? JSON.parse(r.related_file_candidates) : undefined,
    notes: r.notes
  }));
};
