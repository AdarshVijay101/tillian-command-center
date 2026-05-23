import { db } from './db';

export interface MissionTemplate {
  id: string;
  job_type: string;
  title: string;
  description: string;
  category: string;
  is_heavy: number;
  requires_approval: number;
  requires_openclaw: number;
  default_priority: string;
  expected_duration_label: string;
  safety_notes: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

const TEMPLATES: MissionTemplate[] = [
  {
    id: 'daily_planner',
    job_type: 'run_daily_planner',
    title: 'Daily Planner Mission',
    description: 'Generates the daily combined plan from Notion/routine rules',
    category: 'planning',
    is_heavy: 1,
    requires_approval: 1,
    requires_openclaw: 1,
    default_priority: 'high',
    expected_duration_label: '45-90s',
    safety_notes: 'Modifies daily schedule. Requires OpenClaw and Notion API access.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'morning_brief',
    job_type: 'run_morning_brief',
    title: 'Morning Brief Mission',
    description: 'Prepare morning context, readiness scores, and briefing.',
    category: 'routine',
    is_heavy: 1,
    requires_approval: 1,
    requires_openclaw: 1,
    default_priority: 'high',
    expected_duration_label: '30-60s',
    safety_notes: 'Fetches extensive context. High LLM token usage.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'evening_review',
    job_type: 'run_evening_review',
    title: 'Evening Review Mission',
    description: 'End of day review, log parsing, and scoring.',
    category: 'routine',
    is_heavy: 1,
    requires_approval: 1,
    requires_openclaw: 1,
    default_priority: 'normal',
    expected_duration_label: '60-90s',
    safety_notes: 'Evaluates daily performance data.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'weekly_digest',
    job_type: 'run_weekly_digest',
    title: 'Weekly Digest Mission',
    description: 'Generates the weekly summary, trends, and next week plan.',
    category: 'planning',
    is_heavy: 1,
    requires_approval: 1,
    requires_openclaw: 1,
    default_priority: 'normal',
    expected_duration_label: '2-3m',
    safety_notes: 'Very heavy token usage. Runs full week log reduction.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'health_snapshot',
    job_type: 'capture_health_snapshot',
    title: 'Health Snapshot Mission',
    description: 'Captures an immediate system health snapshot.',
    category: 'system',
    is_heavy: 0,
    requires_approval: 0,
    requires_openclaw: 0,
    default_priority: 'normal',
    expected_duration_label: '5-10s',
    safety_notes: 'Safe, read-only local execution.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'sync_generated_files',
    job_type: 'sync_generated_files',
    title: 'Sync Generated Files Mission',
    description: 'Synchronizes drop folders into the Tillian database.',
    category: 'system',
    is_heavy: 0,
    requires_approval: 0,
    requires_openclaw: 0,
    default_priority: 'normal',
    expected_duration_label: '1-2s',
    safety_notes: 'Safe local execution.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'scheduler_audit',
    job_type: 'scheduler_audit',
    title: 'Scheduler Audit Mission',
    description: 'Audits Windows Scheduled Tasks for mismatches.',
    category: 'system',
    is_heavy: 0,
    requires_approval: 0,
    requires_openclaw: 0,
    default_priority: 'normal',
    expected_duration_label: '1-2s',
    safety_notes: 'Safe local execution. Does not modify tasks.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'reliability_test',
    job_type: 'reliability_test',
    title: 'Reliability Test Mission',
    description: 'Simulates a reliability harness check.',
    category: 'system',
    is_heavy: 0,
    requires_approval: 0,
    requires_openclaw: 0,
    default_priority: 'normal',
    expected_duration_label: '1s',
    safety_notes: 'Safe read-only test.',
    is_active: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const seedMissionTemplates = (): void => {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO mission_templates (
      id, job_type, title, description, category, is_heavy, requires_approval,
      requires_openclaw, default_priority, expected_duration_label, safety_notes,
      is_active, created_at, updated_at
    ) VALUES (
      @id, @job_type, @title, @description, @category, @is_heavy, @requires_approval,
      @requires_openclaw, @default_priority, @expected_duration_label, @safety_notes,
      @is_active, @created_at, @updated_at
    )
  `);

  const tx = db.transaction((templates: MissionTemplate[]) => {
    for (const t of templates) {
      stmt.run(t);
    }
  });

  tx(TEMPLATES);
};

export const getMissionTemplates = (): MissionTemplate[] => {
  return db.prepare('SELECT * FROM mission_templates ORDER BY category ASC, id ASC').all() as MissionTemplate[];
};

export const getMissionTemplateById = (id: string): MissionTemplate | null => {
  return (db.prepare('SELECT * FROM mission_templates WHERE id = ?').get(id) as MissionTemplate) || null;
};

export const getActiveMissionTemplates = (): MissionTemplate[] => {
  return db.prepare('SELECT * FROM mission_templates WHERE is_active = 1 ORDER BY category ASC').all() as MissionTemplate[];
};

export const getMissionTemplatesByCategory = (category: string): MissionTemplate[] => {
  return db.prepare('SELECT * FROM mission_templates WHERE category = ? AND is_active = 1').all(category) as MissionTemplate[];
};
