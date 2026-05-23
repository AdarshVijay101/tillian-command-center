import { db } from './db';

export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS action_runs (
      id TEXT PRIMARY KEY,
      action_id TEXT,
      action_label TEXT,
      category TEXT,
      status TEXT,
      started_at TEXT,
      ended_at TEXT,
      duration_ms INTEGER,
      stdout_summary TEXT,
      stderr_summary TEXT,
      sanitized_output TEXT,
      endpoint TEXT,
      triggered_by TEXT,
      is_demo INTEGER,
      related_file_candidates TEXT,
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS dynamic_adjustments (
      id TEXT PRIMARY KEY,
      mode TEXT,
      title TEXT,
      created_at TEXT,
      source_run_id TEXT,
      logged_file_path TEXT,
      summary TEXT
    );

    CREATE TABLE IF NOT EXISTS generated_files (
      id TEXT PRIMARY KEY,
      file_name TEXT,
      full_path TEXT,
      type TEXT,
      location TEXT,
      length INTEGER,
      last_write_time TEXT,
      detected_at TEXT
    );

    CREATE TABLE IF NOT EXISTS health_snapshots (
      id TEXT PRIMARY KEY,
      captured_at TEXT,
      overall_status TEXT,
      openclaw_gateway INTEGER,
      openclaw_browser INTEGER,
      wsl_detected INTEGER,
      drop_folder_exists INTEGER,
      processed_folder_exists INTEGER,
      scheduled_tasks_detected_count INTEGER,
      warnings TEXT,
      errors TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_scores (
      date TEXT PRIMARY KEY,
      work_score INTEGER,
      gym_score INTEGER,
      skincare_score INTEGER,
      study_score INTEGER,
      sleep_score INTEGER,
      automation_score INTEGER,
      overall_score INTEGER,
      notes TEXT,
      updated_at TEXT,
      score_source TEXT,
      confidence TEXT
    );

    CREATE TABLE IF NOT EXISTS task_checkins (
      id TEXT PRIMARY KEY,
      date TEXT,
      category TEXT,
      item_key TEXT,
      item_label TEXT,
      status TEXT,
      source TEXT,
      confidence TEXT,
      linked_run_id TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_reflections (
      date TEXT PRIMARY KEY,
      energy_level INTEGER,
      mood TEXT,
      sleep_quality INTEGER,
      soreness_level INTEGER,
      skin_status TEXT,
      focus_quality INTEGER,
      biggest_win TEXT,
      main_blocker TEXT,
      tomorrow_adjustment TEXT,
      notes TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS routine_protocols (
      id TEXT PRIMARY KEY,
      category TEXT,
      title TEXT,
      description TEXT,
      intensity TEXT,
      estimated_minutes INTEGER,
      safety_notes TEXT,
      version TEXT DEFAULT '1.0',
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS routine_steps (
      id TEXT PRIMARY KEY,
      protocol_id TEXT,
      step_order INTEGER,
      title TEXT,
      description TEXT,
      sets TEXT,
      reps TEXT,
      duration TEXT,
      caution TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS weekly_routine_schedule (
      id TEXT PRIMARY KEY,
      day_of_week TEXT,
      time_block TEXT,
      category TEXT,
      protocol_id TEXT,
      label TEXT,
      start_time TEXT,
      end_time TEXT,
      is_required INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS routine_overrides (
      id TEXT PRIMARY KEY,
      date TEXT,
      mode TEXT,
      reason TEXT,
      affected_category TEXT,
      replacement_protocol_id TEXT,
      notes TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS daily_routine_plan (
      date TEXT PRIMARY KEY,
      generated_at TEXT,
      plan_json TEXT,
      source TEXT,
      confidence TEXT
    );

    CREATE TABLE IF NOT EXISTS notification_deliveries (
      id TEXT PRIMARY KEY,
      date TEXT,
      type TEXT,
      channel TEXT,
      title TEXT,
      message_preview TEXT,
      message_hash TEXT,
      source TEXT,
      delivery_status TEXT,
      telegram_ok INTEGER,
      scheduled_task_name TEXT,
      action_run_id TEXT,
      stdout_summary TEXT,
      stderr_summary TEXT,
      error_message TEXT,
      sent_at TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS scheduled_task_audits (
      id TEXT PRIMARY KEY,
      captured_at TEXT,
      task_name TEXT,
      expected_type TEXT,
      expected_time TEXT,
      exists_in_os INTEGER,
      enabled INTEGER,
      state TEXT,
      next_run_time TEXT,
      last_run_time TEXT,
      last_task_result TEXT,
      command_ok INTEGER,
      type_ok INTEGER,
      timing_ok INTEGER,
      duplicate_detected INTEGER,
      warning TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_jobs (
      id TEXT PRIMARY KEY,
      job_type TEXT,
      title TEXT,
      status TEXT,
      priority TEXT,
      requested_by TEXT,
      requires_approval INTEGER,
      approved_at TEXT,
      started_at TEXT,
      finished_at TEXT,
      duration_ms INTEGER,
      preflight_status TEXT,
      preflight_summary TEXT,
      command_action_id TEXT,
      action_run_id TEXT,
      result_summary TEXT,
      error_message TEXT,
      retry_count INTEGER DEFAULT 0,
      max_retries INTEGER DEFAULT 0,
      idempotency_key TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS agent_job_events (
      id TEXT PRIMARY KEY,
      job_id TEXT,
      event_type TEXT,
      message TEXT,
      metadata_json TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS mission_templates (
      id TEXT PRIMARY KEY,
      job_type TEXT,
      title TEXT,
      description TEXT,
      category TEXT,
      is_heavy INTEGER,
      requires_approval INTEGER,
      requires_openclaw INTEGER,
      default_priority TEXT,
      expected_duration_label TEXT,
      safety_notes TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS artifact_reviews (
      id TEXT PRIMARY KEY,
      file_path TEXT,
      file_name TEXT,
      artifact_type TEXT,
      related_job_id TEXT,
      related_action_run_id TEXT,
      review_status TEXT,
      reviewer TEXT,
      rating INTEGER,
      review_notes TEXT,
      decision_reason TEXT,
      reviewed_at TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS artifact_review_events (
      id TEXT PRIMARY KEY,
      artifact_review_id TEXT,
      event_type TEXT,
      message TEXT,
      metadata_json TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS artifact_evidence_notes (
      id TEXT PRIMARY KEY,
      artifact_review_id TEXT NOT NULL,
      evidence_type TEXT NOT NULL,
      title TEXT NOT NULL,
      business_value TEXT,
      technical_value TEXT,
      demo_safety_level TEXT NOT NULL,
      demo_talking_points TEXT,
      risks_or_redactions TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (artifact_review_id) REFERENCES artifact_reviews(id)
    );

    CREATE TABLE IF NOT EXISTS demo_evidence_packages (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      package_status TEXT NOT NULL,
      artifact_ids_json TEXT NOT NULL,
      summary_markdown TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
};

export const getDbCounts = () => {
  const getCount = (table: string) => {
    try {
      const row = db.prepare(`SELECT count(*) as c FROM ${table}`).get() as any;
      return row ? row.c : 0;
    } catch {
      return 0;
    }
  };

  const getLatest = (table: string, col: string) => {
    try {
      const row = db.prepare(`SELECT ${col} FROM ${table} ORDER BY ${col} DESC LIMIT 1`).get() as any;
      return row ? row[col] : null;
    } catch {
      return null;
    }
  };

  return {
    actionRunsCount: getCount('action_runs'),
    generatedFilesCount: getCount('generated_files'),
    healthSnapshotsCount: getCount('health_snapshots'),
    dynamicAdjustmentsCount: getCount('dynamic_adjustments'),
    dailyScoresCount: getCount('daily_scores'),
    taskCheckinsCount: getCount('task_checkins'),
    dailyReflectionsCount: getCount('daily_reflections'),
    routineProtocolsCount: getCount('routine_protocols'),
    routineStepsCount: getCount('routine_steps'),
    weeklyRoutineScheduleCount: getCount('weekly_routine_schedule'),
    routineOverridesCount: getCount('routine_overrides'),
    dailyRoutinePlanCount: getCount('daily_routine_plan'),
    notificationDeliveriesCount: getCount('notification_deliveries'),
    scheduledTaskAuditsCount: getCount('scheduled_task_audits'),
    agentJobsCount: getCount('agent_jobs'),
    agentJobEventsCount: getCount('agent_job_events'),
    missionTemplatesCount: getCount('mission_templates'),
    artifactReviewsCount: getCount('artifact_reviews'),
    artifactReviewEventsCount: getCount('artifact_review_events'),
    artifactEvidenceNotesCount: getCount('artifact_evidence_notes'),
    demoEvidencePackagesCount: getCount('demo_evidence_packages'),
    latestHealthSnapshotAt: getLatest('health_snapshots', 'captured_at'),
    latestGeneratedFileAt: getLatest('generated_files', 'detected_at')
  };
};
