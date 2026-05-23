import { db } from './db';
import crypto from 'crypto';

export interface ScheduledTaskAuditRow {
  task_name: string;
  expected_type: string;
  expected_time: string;
  exists_in_os: boolean;
  enabled: boolean;
  state: string;
  next_run_time: string | null;
  last_run_time: string | null;
  last_task_result: string | null;
  command_ok: boolean;
  type_ok: boolean;
  timing_ok: boolean;
  duplicate_detected: boolean;
  warning: string | null;
}

export const logScheduledTaskAudits = (rows: ScheduledTaskAuditRow[]) => {
  const capturedAt = new Date().toISOString();
  
  const insert = db.prepare(`
    INSERT INTO scheduled_task_audits (
      id, captured_at, task_name, expected_type, expected_time,
      exists_in_os, enabled, state, next_run_time, last_run_time,
      last_task_result, command_ok, type_ok, timing_ok, duplicate_detected,
      warning, created_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const transaction = db.transaction((auditRows: ScheduledTaskAuditRow[]) => {
    for (const row of auditRows) {
      insert.run(
        crypto.randomUUID().replace(/-/g, ''),
        capturedAt,
        row.task_name,
        row.expected_type,
        row.expected_time,
        row.exists_in_os ? 1 : 0,
        row.enabled ? 1 : 0,
        row.state,
        row.next_run_time,
        row.last_run_time,
        row.last_task_result,
        row.command_ok ? 1 : 0,
        row.type_ok ? 1 : 0,
        row.timing_ok ? 1 : 0,
        row.duplicate_detected ? 1 : 0,
        row.warning,
        new Date().toISOString()
      );
    }
  });

  transaction(rows);
  return capturedAt;
};

export const getLatestScheduledTaskAudit = () => {
  try {
    const latestGroup = db.prepare(`
      SELECT captured_at FROM scheduled_task_audits 
      ORDER BY captured_at DESC LIMIT 1
    `).get() as any;

    if (!latestGroup) return [];

    return db.prepare(`
      SELECT * FROM scheduled_task_audits 
      WHERE captured_at = ?
    `).all(latestGroup.captured_at).map((r: any) => ({
      ...r,
      exists_in_os: r.exists_in_os === 1,
      enabled: r.enabled === 1,
      command_ok: r.command_ok === 1,
      type_ok: r.type_ok === 1,
      timing_ok: r.timing_ok === 1,
      duplicate_detected: r.duplicate_detected === 1
    }));
  } catch (err) {
    return [];
  }
};

export const getSchedulerHealthScore = () => {
  try {
    const rows = getLatestScheduledTaskAudit() as any[];
    if (!rows.length) return { expectedCount: 12, foundCount: 0, enabledCount: 0, missingCount: 12, misconfiguredCount: 0, duplicateCount: 0, healthScore: 0, warnings: ['No audits found'] };

    let expectedCount = 12; // We know there are exactly 12 allowlisted
    let foundCount = 0;
    let enabledCount = 0;
    let missingCount = 0;
    let misconfiguredCount = 0;
    let duplicateCount = 0;
    let warnings: string[] = [];

    for (const row of rows) {
      if (row.exists_in_os) foundCount++;
      else missingCount++;

      if (row.enabled) enabledCount++;
      if (row.duplicate_detected) duplicateCount++;

      if (row.exists_in_os && (!row.command_ok || !row.type_ok || !row.timing_ok || !row.enabled)) {
        misconfiguredCount++;
        if (row.warning && !warnings.includes(row.warning)) {
          warnings.push(row.warning);
        }
      }
    }

    let healthScore = 100;
    healthScore -= (missingCount * 5);
    healthScore -= (misconfiguredCount * 10);
    healthScore -= (duplicateCount * 20);
    
    if (healthScore < 0) healthScore = 0;
    if (healthScore > 100) healthScore = 100;

    return {
      expectedCount,
      foundCount,
      enabledCount,
      missingCount,
      misconfiguredCount,
      duplicateCount,
      healthScore,
      warnings
    };
  } catch (err: any) {
    return { error: err.message };
  }
};
