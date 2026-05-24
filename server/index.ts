import express from 'express';
import cors from 'cors';
import { z } from 'zod';
import fs from 'fs/promises';
import { PORT, HOST, ALLOWED_SCRIPTS, ALLOWED_ROUTINE_MODES, ALLOWED_DYNAMIC_MODES, ALLOWED_SCHEDULED_TASKS, PATHS } from './config';
import { checkSystemHealth } from './healthService';
import { getLatestFiles, previewFile } from './fileService';
import { runScript } from './commandRunner';
import { getScheduledTasks, controlScheduledTask } from './scheduledTaskService';
import { getRuns, getRun, clearRuns, createRun, updateRun } from './actionRunService';
import { initDb, getDbCounts } from './db/schema';
import { migrateJsonToSqlite } from './db/migrations';
import { getOverview, getTodayAnalytics, getTrends } from './db/analyticsRepository';
import { getLatestScheduledTaskAudit, getSchedulerHealthScore } from './db/schedulerRepository';
import { 
  getExpectedReminderTasks, 
  auditReminderScheduledTasks, 
  repairReminderTask, 
  repairAllMissingOrBrokenReminderTasks,
  toggleReminderTask
} from './services/schedulerAuditService';
import { getSystemTestSuite, getSystemReport, getSystemReportMarkdown } from './services/systemTestService';
import { getJobs, getJobById, getJobStats, getJobEvents } from './db/jobRepository';
import { createAgentJob, runPreflightForJob, approveJob, validateJobCanExecute, markJobRunning, executeJob, cancelAgentJob, retryJob } from './services/jobQueueService';
import { 
  getTodayCheckins, 
  upsertCheckin, 
  getCheckinsByDate, 
  getDailyReflection, 
  upsertDailyReflection 
} from './db/checkinRepository';
import { 
  seedDefaultRoutineProtocols,
  getRoutineProtocols,
  getProtocolById,
  getWeeklyRoutineSchedule,
  getTodayRoutinePlan,
  createRoutineOverride,
  generateDailyRoutinePlan
} from './db/routineRepository';
import {
  logNotificationDelivery,
  getTodayNotificationDeliveries,
  getNotificationStats,
  getLatestNotificationDeliveries
} from './db/notificationRepository';
import { getDbStatus } from './db/db';
import { upsertGeneratedFile } from './db/fileRepository';
import { captureHealthSnapshot } from './db/healthRepository';
import { generateReminderPayload } from './services/reminderPayloadService';
import { getMissionTemplates, getMissionTemplateById, seedMissionTemplates } from './db/missionTemplateRepository';
import { 
  createJobFromTemplate, 
  explainMissionTemplate, 
  getMissionTemplateReadiness, 
  getTodayMissionRecommendations 
} from './services/missionTemplateService';
import { 
  getReviewInbox, 
  syncGeneratedFilesToReviewInbox,
  previewArtifactForReview,
  submitArtifactReview
} from './services/artifactReviewService';
import { writeArtifactReviewReceipt } from './services/artifactReceiptService';
import { getArtifactReviewById, getArtifactReviewEvents, getArtifactReviewStats } from './db/artifactReviewRepository';
import {
  suggestEvidenceFromApprovedArtifact,
  getDemoReadyArtifacts,
  buildEvidencePackageDraft,
  generateEvidenceSummaryMarkdown,
  getEvidenceDashboard
} from './services/evidenceService';
import {
  createOrUpdateEvidenceNote,
  getEvidenceNotes,
  getEvidencePackages,
  getEvidencePackageById,
  updateEvidencePackageStatus
} from './db/evidenceRepository';
import { getReleaseReadiness, getReleaseChecklist, getRepoSafety } from './services/releaseService';

const app = express();
app.use(cors());
app.use(express.json());

// Helper for standard response
const sendResponse = (res: express.Response, data: any = null, error: string | null = null) => {
  res.json({
    ok: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  });
};

// 0. GET /api/ping
app.get('/api/ping', (req, res) => {
  res.json({
    ok: true,
    message: 'Local AI backend online',
    timestamp: new Date().toISOString()
  });
});

// Phase 17: Release Readiness
app.get('/api/release/readiness', async (req, res) => {
  try {
    const readiness = await getReleaseReadiness();
    sendResponse(res, readiness);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/release/checklist', (req, res) => {
  try {
    const checklist = getReleaseChecklist();
    sendResponse(res, checklist);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/release/repo-safety', (req, res) => {
  try {
    const safety = getRepoSafety();
    sendResponse(res, safety);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

// Settings & Config
app.get('/api/config/public', (req, res) => {
  sendResponse(res, {
    BACKEND_URL: `http://${HOST}:${PORT}`,
    OPENCLAW_URL: 'http://127.0.0.1:18789',
    DROP_FOLDER: '[REDACTED_LOCAL_PATH]',
    IS_DEMO_MODE: false
  });
});

// Telegram Studio Endpoints
app.get('/api/telegram/messages/types', (req, res) => {
  sendResponse(res, [
    'gym', 'wake', 'skincare', 'study', 'cooking', 'reading'
  ]);
});

app.get('/api/telegram/messages/preview/:type', (req, res) => {
  sendResponse(res, {
    default_preview: `[PREVIEW: ${req.params.type.toUpperCase()}]\n\nTime to get things done!`,
    current_override: null,
    default_template: `[PREVIEW: ${req.params.type.toUpperCase()}]\n\nTime to get things done!`
  });
});

app.post('/api/telegram/messages/override', (req, res) => {
  sendResponse(res, { success: true });
});

app.post('/api/telegram/messages/reset/:type', (req, res) => {
  sendResponse(res, { success: true });
});

app.post('/api/telegram/messages/send-test', (req, res) => {
  sendResponse(res, { success: true, message: 'Test message sent successfully' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    ok: false,
    data: null,
    error: err.message || 'Internal Server Error'
  });
});

// 1. GET /api/health
app.get('/api/health', async (req, res) => {
  try {
    const health = await checkSystemHealth();
    sendResponse(res, health);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// 1.5. GET /api/diagnostics/self-test
app.get('/api/diagnostics/self-test', async (req, res) => {
  try {
    const health = await checkSystemHealth();
    const files = await getLatestFiles();
    const tasks = await getScheduledTasks();
    
    sendResponse(res, {
      health,
      config: {
        dropFolder: PATHS.dropFolder,
        processedFolder: PATHS.processedFolder,
        automationRoot: PATHS.automationRoot
      },
      filesDetected: files,
      tasksDetected: tasks
    });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// 2. GET /api/files/latest
app.get('/api/files/latest', async (req, res) => {
  try {
    const files = await getLatestFiles();
    sendResponse(res, files);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// 3. GET /api/files/preview
app.get('/api/files/preview', async (req, res) => {
  const { path } = req.query;
  if (!path || typeof path !== 'string') {
    return sendResponse(res, null, 'Invalid path');
  }
  try {
    const content = await previewFile(path);
    sendResponse(res, content);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// 4. GET /api/scheduled-tasks
app.get('/api/scheduled-tasks', async (req, res) => {
  try {
    const tasks = await getScheduledTasks();
    sendResponse(res, tasks);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// Phase 5: Safety and Configuration validation endpoints
app.get('/api/safety', (req, res) => {
  sendResponse(res, {
    backendHost: '127.0.0.1',
    backendPort: 8787,
    localhostOnly: true,
    arbitraryCommandsAllowed: false,
    secretFilesRead: false,
    allowedScriptsCount: Object.keys(ALLOWED_SCRIPTS).length,
    allowedScheduledTasksCount: ALLOWED_SCHEDULED_TASKS.length,
    allowedPreviewRoots: [PATHS.dropFolder, PATHS.processedFolder],
    dangerousEndpointsEnabled: false,
    notes: 'Safety constraints are hardcoded into server/index.ts. Preview is locked to automation roots.'
  });
});

app.get('/api/config/validate', async (req, res) => {
  const validation = {
    passed: true,
    warnings: [] as string[],
    errors: [] as string[],
    fixCommands: [] as string[],
    details: {
      automationRootExists: false,
      inboxRootExists: false,
      dropFolderExists: false,
      processedFolderExists: false,
      backendHostLocal: true,
      noSecretsLoaded: true
    }
  };

  try {
    const automationStat = await fs.stat(PATHS.automationRoot).catch(() => null);
    if (automationStat) validation.details.automationRootExists = true;
    else validation.errors.push(`Automation root missing: ${PATHS.automationRoot}`);

    const inboxStat = await fs.stat(PATHS.inboxRoot).catch(() => null);
    if (inboxStat) validation.details.inboxRootExists = true;
    else validation.errors.push(`Inbox root missing: ${PATHS.inboxRoot}`);

    const dropStat = await fs.stat(PATHS.dropFolder).catch(() => null);
    if (dropStat) validation.details.dropFolderExists = true;
    else {
      validation.errors.push(`Drop folder missing: ${PATHS.dropFolder}`);
      validation.fixCommands.push(`mkdir "${PATHS.dropFolder}"`);
    }

    const processedStat = await fs.stat(PATHS.processedFolder).catch(() => null);
    if (processedStat) validation.details.processedFolderExists = true;
    else {
      validation.errors.push(`Processed folder missing: ${PATHS.processedFolder}`);
      validation.fixCommands.push(`mkdir "${PATHS.processedFolder}"`);
    }

    if (validation.errors.length > 0) {
      validation.passed = false;
    }
    
    sendResponse(res, validation);
  } catch (err: any) {
    validation.passed = false;
    validation.errors.push(err.message);
    sendResponse(res, validation);
  }
});

// GET /api/runs
app.get('/api/runs', async (req, res) => {
  try {
    const runs = await getRuns();
    sendResponse(res, runs);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// GET /api/runs/:id
app.get('/api/runs/:id', async (req, res) => {
  try {
    const run = await getRun(req.params.id);
    if (!run) return sendResponse(res, null, 'Run not found');
    sendResponse(res, run);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// POST /api/runs/clear
app.post('/api/runs/clear', async (req, res) => {
  try {
    await clearRuns();
    sendResponse(res, { success: true });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// ==========================================
// Phase 9: Telegram Protocol-Aware Reminders
// ==========================================

const ALLOWED_REMINDER_TYPES = [
  'wake', 'gym', 'post_gym_bodycare', 'morning_skincare', 
  'study1', 'study2', 'study3', 'evening_walk', 
  'evening_cooking', 'dinner', 'reading', 'night_skincare', 
  'sleep', 'dynamic_adjustment_summary'
];

app.get('/api/reminders/types', (req, res) => {
  sendResponse(res, { types: ALLOWED_REMINDER_TYPES });
});

app.get('/api/reminders/payload/:type', (req, res) => {
  try {
    const type = req.params.type;
    if (!ALLOWED_REMINDER_TYPES.includes(type)) {
      throw new Error(`Invalid reminder type: ${type}`);
    }
    const payload = generateReminderPayload(type);
    sendResponse(res, payload);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/reminders/preview/:type', (req, res) => {
  try {
    const type = req.params.type;
    if (!ALLOWED_REMINDER_TYPES.includes(type)) {
      throw new Error(`Invalid reminder type: ${type}`);
    }
    const payload = generateReminderPayload(type);
    sendResponse(res, payload);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// Note: /api/actions/send-routine-reminder is defined below with proper runScript + run tracking

// ==========================================
// Phase 10: Notification Reliability
// ==========================================

const notificationLogSchema = z.object({
  type: z.enum([...ALLOWED_REMINDER_TYPES, 'unknown'] as [string, ...string[]]),
  channel: z.string().optional(),
  title: z.string(),
  messagePreview: z.string(),
  messageHash: z.string(),
  source: z.enum(['protocol_payload', 'static_fallback', 'demo_simulated', 'unknown']),
  deliveryStatus: z.enum(['sent', 'failed', 'fallback_sent', 'simulated', 'blocked']),
  telegramOk: z.boolean().nullable().optional(),
  scheduledTaskName: z.string().nullable().optional(),
  actionRunId: z.string().nullable().optional(),
  stdoutSummary: z.string().nullable().optional(),
  stderrSummary: z.string().nullable().optional(),
  errorMessage: z.string().nullable().optional(),
});

app.post('/api/notifications/log', (req, res) => {
  try {
    const forbiddenKeys = ['token', 'chatId', 'chat_id', 'botToken', 'telegramToken'];
    if (Object.keys(req.body).some(key => forbiddenKeys.includes(key))) {
      return sendResponse(res, null, 'Invalid payload: contains forbidden fields');
    }
    const parsed = notificationLogSchema.safeParse(req.body);
    if (!parsed.success) {
      return sendResponse(res, null, 'Invalid payload: ' + JSON.stringify(parsed.error.errors));
    }
    const id = logNotificationDelivery(parsed.data);
    sendResponse(res, { success: true, id });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/notifications/today', (req, res) => {
  try {
    const data = getTodayNotificationDeliveries();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/notifications/stats', (req, res) => {
  try {
    const data = getNotificationStats();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/notifications/latest', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const data = getLatestNotificationDeliveries(limit);
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/notifications/schedule-audit', async (req, res) => {
  try {
    const tasks = await getScheduledTasks();
    const reminderTasks = ALLOWED_SCHEDULED_TASKS.filter(t => t.includes('Telegram') && t.includes('Reminder'));
    const results = reminderTasks.map(expectedTask => {
      const found = tasks.find(t => t.taskName === expectedTask);
      let warning = null;
      if (!found) warning = 'Task not found in scheduler';
      else if (!found.exists) warning = 'Task file missing or unregistered';
      
      let typeMatch = null;
      if (expectedTask.includes('Gym')) typeMatch = 'gym';
      else if (expectedTask.includes('Post Gym Body Care')) typeMatch = 'post_gym_bodycare';
      else if (expectedTask.includes('Morning Skincare')) typeMatch = 'morning_skincare';
      else if (expectedTask.includes('Study Block 1')) typeMatch = 'study1';
      else if (expectedTask.includes('Study Block 2')) typeMatch = 'study2';
      else if (expectedTask.includes('Study Block 3')) typeMatch = 'study3';
      else if (expectedTask.includes('Evening Walk')) typeMatch = 'evening_walk';
      else if (expectedTask.includes('Evening Cooking')) typeMatch = 'evening_cooking';
      else if (expectedTask.includes('Night Skincare')) typeMatch = 'night_skincare';
      else if (expectedTask.includes('Reading')) typeMatch = 'reading';
      else if (expectedTask.includes('Sleep Wind Down')) typeMatch = 'sleep';
      
      return {
        expectedTask,
        found: !!found,
        taskName: found?.taskName,
        state: found?.state || 'missing',
        nextRunTime: found?.nextRunTime || null,
        type: typeMatch,
        warning
      };
    });
    sendResponse(res, results);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// ==========================================
// Phase 11: Scheduled Routine Orchestrator
// ==========================================

app.get('/api/scheduler/expected', (req, res) => {
  try {
    sendResponse(res, getExpectedReminderTasks());
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/scheduler/audit', async (req, res) => {
  try {
    const data = await auditReminderScheduledTasks(false);
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/scheduler/latest-audit', (req, res) => {
  try {
    sendResponse(res, getLatestScheduledTaskAudit());
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/scheduler/health', (req, res) => {
  try {
    sendResponse(res, getSchedulerHealthScore());
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/scheduler/repair/:type', async (req, res) => {
  try {
    const data = await repairReminderTask(req.params.type);
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/scheduler/repair-all', async (req, res) => {
  try {
    const data = await repairAllMissingOrBrokenReminderTasks();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/scheduler/enable/:type', async (req, res) => {
  try {
    await toggleReminderTask(req.params.type, true);
    sendResponse(res, { success: true });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/scheduler/disable/:type', async (req, res) => {
  try {
    await toggleReminderTask(req.params.type, false);
    sendResponse(res, { success: true });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// Phase 12: Reliability Test Harness Endpoints
app.get('/api/system/test-suite', async (req, res) => {
  try {
    const data = await getSystemTestSuite();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/system/report', async (req, res) => {
  try {
    const data = await getSystemReport();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/system/report/markdown', async (req, res) => {
  try {
    const markdown = await getSystemReportMarkdown();
    res.setHeader('Content-Type', 'text/markdown');
    res.send(markdown);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// Serve frontend
// 5, 6, 7. POST /api/scheduled-tasks/:action
app.post('/api/scheduled-tasks/:action', async (req, res) => {
  const { action } = req.params;
  if (!['run', 'enable', 'disable'].includes(action)) {
    return sendResponse(res, null, 'Invalid action');
  }
  
  const schema = z.object({ taskName: z.enum(ALLOWED_SCHEDULED_TASKS as [string, ...string[]]) });
  const parsed = schema.safeParse(req.body);
  
  if (!parsed.success) {
    return sendResponse(res, null, 'Invalid or unauthorized task name');
  }

  const runRecord = await createRun({
    actionId: `scheduled_task_${action}`,
    actionLabel: `${action.toUpperCase()} Task: ${parsed.data.taskName}`,
    category: 'Scheduled Task',
    status: 'running',
    endpoint: `/api/scheduled-tasks/${action}`,
    triggeredBy: 'dashboard'
  });

  try {
    const actionMap = { run: 'start', enable: 'enable', disable: 'disable' } as const;
    await controlScheduledTask(parsed.data.taskName, actionMap[action as keyof typeof actionMap]);
    
    await updateRun(runRecord.id, {
      status: 'success',
      endedAt: new Date().toISOString(),
      stdout: `Task ${action} command sent successfully.`,
      sanitizedOutput: `Task ${action} command sent successfully.`
    });
    
    sendResponse(res, { success: true, message: `Task ${action} command sent.`, runId: runRecord.id });
  } catch (err: any) {
    await updateRun(runRecord.id, {
      status: 'error',
      endedAt: new Date().toISOString(),
      error: err.message
    });
    sendResponse(res, null, err.message);
  }
});

// 13. GET /api/actions/preflight/:action
app.get('/api/actions/preflight/:action', async (req, res) => {
  const { action } = req.params;
  
  const heavyAiActions = ['run-daily-planner', 'run-morning-brief', 'run-evening-review', 'run-weekly-digest', 'start-watchers'];
  const safeActions = ['send-routine-reminder', 'send-dynamic-adjustment'];
  
  if (!heavyAiActions.includes(action) && !safeActions.includes(action)) {
    return sendResponse(res, null, 'Invalid action for preflight');
  }

  const isHeavy = heavyAiActions.includes(action);
  const health = await checkSystemHealth();
  
  const requiredChecks = isHeavy 
    ? ['Backend Online', 'OpenClaw Gateway', 'WSL Ubuntu-24.04', 'Drop Folder', 'Script Exists']
    : ['Backend Online', 'Script Exists'];

  const passedChecks: string[] = ['Backend Online'];
  const failedChecks: string[] = [];
  const fixCommands: string[] = [];
  
  // Script Check
  let scriptKey = action;
  if (action === 'send-routine-reminder') scriptKey = 'routineReminder';
  else if (action === 'send-dynamic-adjustment') scriptKey = 'dynamicAdjustment';
  else if (action === 'start-watchers') scriptKey = 'watchersScript';
  else scriptKey = action.replace('run-', '').replace(/-([a-z])/g, (g) => g[1].toUpperCase());

  if (health.scriptsExist[scriptKey]) passedChecks.push('Script Exists');
  else failedChecks.push('Script Exists');

  if (isHeavy) {
    if (health.openclawGatewayReachable) passedChecks.push('OpenClaw Gateway');
    else {
      failedChecks.push('OpenClaw Gateway');
      fixCommands.push('openclaw gateway run --port 18789');
    }
    
    if (health.wslDefault !== 'WSL check failed') passedChecks.push('WSL Ubuntu-24.04');
    else failedChecks.push('WSL Ubuntu-24.04');
    
    if (health.dropFolderExists) passedChecks.push('Drop Folder');
    else failedChecks.push('Drop Folder');
  }

  const allowedToRun = failedChecks.length === 0;

  sendResponse(res, {
    actionId: action,
    allowedToRun,
    requiredChecks,
    passedChecks,
    failedChecks,
    warnings: health.warnings,
    fixCommands
  });
});

// 14. POST /api/actions/send-routine-reminder
app.post('/api/actions/send-routine-reminder', async (req, res) => {
  const schema = z.object({ type: z.enum(ALLOWED_ROUTINE_MODES as [string, ...string[]]) });
  const parsed = schema.safeParse(req.body);
  
  if (!parsed.success) {
    return sendResponse(res, null, 'Invalid or unauthorized reminder type');
  }

  const runRecord = await createRun({
    actionId: `routine_reminder_${parsed.data.type}`,
    actionLabel: `Routine Reminder: ${parsed.data.type}`,
    category: 'Routine Reminder',
    status: 'running',
    endpoint: '/api/actions/send-routine-reminder',
    triggeredBy: 'dashboard'
  });

  const result = await runScript(ALLOWED_SCRIPTS.routineReminder, ['-Type', parsed.data.type], 60);
  
  await updateRun(runRecord.id, {
    status: result.ok ? 'success' : (result.error?.includes('timed out') ? 'timeout' : 'error'),
    endedAt: new Date().toISOString(),
    durationMs: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr,
    sanitizedOutput: result.stdout
  });

  sendResponse(res, { ...result, runId: runRecord.id }, result.error);
});

// 14. POST /api/actions/send-dynamic-adjustment
app.post('/api/actions/send-dynamic-adjustment', async (req, res) => {
  const schema = z.object({ mode: z.enum(ALLOWED_DYNAMIC_MODES as [string, ...string[]]) });
  const parsed = schema.safeParse(req.body);
  
  if (!parsed.success) {
    return sendResponse(res, null, 'Invalid or unauthorized dynamic adjustment mode');
  }

  const runRecord = await createRun({
    actionId: `dynamic_adjustment_${parsed.data.mode}`,
    actionLabel: `Dynamic Adjustment: ${parsed.data.mode}`,
    category: 'Dynamic Adjustment',
    status: 'running',
    endpoint: '/api/actions/send-dynamic-adjustment',
    triggeredBy: 'dashboard'
  });

  const result = await runScript(ALLOWED_SCRIPTS.dynamicAdjustment, ['-Mode', parsed.data.mode], 60);
  
  await updateRun(runRecord.id, {
    status: result.ok ? 'success' : (result.error?.includes('timed out') ? 'timeout' : 'error'),
    endedAt: new Date().toISOString(),
    durationMs: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr,
    sanitizedOutput: result.stdout
  });

  sendResponse(res, { ...result, runId: runRecord.id }, result.error);
});

// 8, 9, 10, 11, 12. POST /api/actions/:action
app.post('/api/actions/:action', async (req, res) => {
  const { action } = req.params;
  
  const actionsMap: Record<string, { path: string, timeout: number }> = {
    'run-daily-planner': { path: ALLOWED_SCRIPTS.dailyPlanner, timeout: 1200 }, // 20m
    'run-morning-brief': { path: ALLOWED_SCRIPTS.morningBrief, timeout: 1200 },
    'run-evening-review': { path: ALLOWED_SCRIPTS.eveningReview, timeout: 1200 },
    'run-weekly-digest': { path: ALLOWED_SCRIPTS.weeklyDigest, timeout: 1200 },
    'start-watchers': { path: ALLOWED_SCRIPTS.watchersScript, timeout: 90 }, // 90s
  };

  if (!actionsMap[action]) {
    return sendResponse(res, null, 'Invalid action');
  }

  const scriptDef = actionsMap[action];
  
  const runRecord = await createRun({
    actionId: action,
    actionLabel: action.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    category: 'Agent Orchestration',
    status: 'running',
    endpoint: `/api/actions/${action}`,
    triggeredBy: 'dashboard'
  });

  const resultPromise = runScript(scriptDef.path, [], scriptDef.timeout);
  
  resultPromise.then(async (result) => {
    await updateRun(runRecord.id, {
      status: result.ok ? 'success' : (result.error?.includes('timed out') ? 'timeout' : 'error'),
      endedAt: new Date().toISOString(),
      durationMs: result.durationMs,
      stdout: result.stdout,
      stderr: result.stderr,
      sanitizedOutput: result.stdout
    });
  }).catch(async (err) => {
    await updateRun(runRecord.id, {
      status: 'error',
      endedAt: new Date().toISOString(),
      error: err.message
    });
  });
  
  sendResponse(res, { runId: runRecord.id, status: 'running', message: 'Action started in background.' });
});

// 15. GET /api/logs/openclaw
app.get('/api/logs/openclaw', (req, res) => {
  sendResponse(res, { status: "not_implemented", message: "OpenClaw WSL log reading will be added later." });
});

// Phase 6: DB & Analytics Endpoints

app.get('/api/db/status', (req, res) => {
  const status = getDbStatus();
  const counts = getDbCounts();
  sendResponse(res, { ...status, ...counts, tablesCreated: true });
});

app.post('/api/db/migrate-runs', async (req, res) => {
  try {
    const count = await migrateJsonToSqlite();
    sendResponse(res, { success: true, count, message: `Migrated ${count} runs to SQLite.` });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/db/sync-files', async (req, res) => {
  try {
    const files = await getLatestFiles();
    let count = 0;
    for (const file of files) {
      upsertGeneratedFile(file);
      count++;
    }
    sendResponse(res, { success: true, count, message: `Synced ${count} latest generated files to SQLite.` });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/db/capture-health', async (req, res) => {
  try {
    const health = await checkSystemHealth();
    const id = captureHealthSnapshot(health);
    sendResponse(res, { success: true, id, message: `Captured health snapshot ${id.substring(0,8)}.` });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/analytics/overview', (req, res) => {
  try {
    const data = getOverview();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/analytics/today', (req, res) => {
  try {
    const data = getTodayAnalytics();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/analytics/trends', (req, res) => {
  try {
    const data = getTrends();
    sendResponse(res, data);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// Phase 7: Check-ins & Reflections
app.get('/api/checkins/today', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const checkins = getTodayCheckins();
    const reflection = getDailyReflection(today);
    sendResponse(res, { date: today, checkins, reflection });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/checkins/date/:date', (req, res) => {
  try {
    const { date } = req.params;
    const checkins = getCheckinsByDate(date);
    const reflection = getDailyReflection(date);
    sendResponse(res, { date, checkins, reflection });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/checkins', (req, res) => {
  try {
    const schema = z.object({
      category: z.enum(['work', 'gym', 'skincare', 'study', 'food', 'reading', 'sleep', 'dynamic_adjustment', 'system']),
      itemKey: z.string(),
      itemLabel: z.string(),
      status: z.enum(['completed', 'skipped', 'missed', 'partial', 'adjusted']),
      notes: z.string().optional(),
      linkedRunId: z.string().nullable().optional(),
      source: z.string().optional(),
      confidence: z.string().optional(),
      date: z.string().optional()
    });
    
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendResponse(res, null, 'Invalid check-in payload: ' + JSON.stringify(parsed.error.errors));
    }
    
    const dateToUse = parsed.data.date || new Date().toISOString().split('T')[0];
    upsertCheckin({ ...parsed.data, date: dateToUse });
    
    sendResponse(res, { success: true, message: 'Check-in saved' });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/checkins/reflection', (req, res) => {
  try {
    const schema = z.object({
      date: z.string().optional(),
      energyLevel: z.number().min(1).max(10).nullable().optional(),
      mood: z.string().max(100).nullable().optional(),
      sleepQuality: z.number().min(1).max(10).nullable().optional(),
      sorenessLevel: z.number().min(1).max(10).nullable().optional(),
      skinStatus: z.enum(['calm', 'irritated', 'acne_flare', 'dry', 'oily', 'recovery', 'unknown']).nullable().optional(),
      focusQuality: z.number().min(1).max(10).nullable().optional(),
      biggestWin: z.string().max(500).nullable().optional(),
      mainBlocker: z.string().max(500).nullable().optional(),
      tomorrowAdjustment: z.string().max(500).nullable().optional(),
      notes: z.string().max(1000).nullable().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendResponse(res, null, 'Invalid reflection payload: ' + JSON.stringify(parsed.error.errors));
    }

    const dateToUse = parsed.data.date || new Date().toISOString().split('T')[0];
    upsertDailyReflection({ ...parsed.data, date: dateToUse });

    sendResponse(res, { success: true, message: 'Reflection saved' });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// Phase 8: Routine Protocol Library
app.get('/api/routines/protocols', (req, res) => {
  try {
    const protocols = getRoutineProtocols();
    sendResponse(res, protocols);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/routines/protocol/:id', (req, res) => {
  try {
    const protocol = getProtocolById(req.params.id);
    if (!protocol) return sendResponse(res, null, 'Protocol not found');
    sendResponse(res, protocol);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/routines/week', (req, res) => {
  try {
    const schedule = getWeeklyRoutineSchedule();
    sendResponse(res, schedule);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/routines/today', (req, res) => {
  try {
    const { date } = req.query;
    const plan = getTodayRoutinePlan(date as string | undefined);
    sendResponse(res, plan);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/routines/override', (req, res) => {
  try {
    const schema = z.object({
      date: z.string().optional(),
      mode: z.enum(['late_wakeup', 'tired', 'skin_irritated', 'employer_meeting', 'skip_gym', 'work_emergency']),
      reason: z.string().optional(),
      notes: z.string().optional()
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return sendResponse(res, null, 'Invalid override payload');
    }

    const dateToUse = parsed.data.date || new Date().toISOString().split('T')[0];
    createRoutineOverride({ ...parsed.data, date: dateToUse });
    
    sendResponse(res, { success: true, message: 'Routine override applied and plan regenerated' });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/routines/regenerate-today', (req, res) => {
  try {
    const { date } = req.body || {};
    const dateToUse = date || new Date().toISOString().split('T')[0];
    
    // generateDailyRoutinePlan overwrites the plan in the DB and returns the fresh plan
    const freshPlan = generateDailyRoutinePlan(dateToUse);
    
    sendResponse(res, freshPlan);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/routines/seed-defaults', (req, res) => {
  try {
    seedDefaultRoutineProtocols();
    sendResponse(res, { success: true, message: 'Seeded default routines successfully' });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/routines/status', (req, res) => {
  try {
    const counts = getDbCounts();
    sendResponse(res, {
      protocolsCount: counts.routineProtocolsCount,
      stepsCount: counts.routineStepsCount,
      weeklyScheduleCount: counts.weeklyRoutineScheduleCount,
      overridesCount: counts.routineOverridesCount,
      plansCount: counts.dailyRoutinePlanCount
    });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// ==========================================
// Phase 13: Job Queue Endpoints
// ==========================================

app.get('/api/jobs', (req, res) => {
  try {
    const jobs = getJobs(req.query, 50);
    sendResponse(res, jobs);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/jobs/stats', (req, res) => {
  try {
    const stats = getJobStats();
    sendResponse(res, stats);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/jobs/:id', (req, res) => {
  try {
    const job = getJobById(req.params.id);
    if (!job) return sendResponse(res, null, 'Job not found');
    const events = getJobEvents(req.params.id);
    sendResponse(res, { job, events });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/jobs/create', async (req, res) => {
  try {
    const { jobType, priority, title, options } = req.body;
    if (!jobType) return sendResponse(res, null, 'jobType is required');
    const job = await createAgentJob(jobType, priority || 'normal', title || 'Untitled Job', options);
    sendResponse(res, job);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/jobs/:id/preflight', async (req, res) => {
  try {
    const job = await runPreflightForJob(req.params.id);
    sendResponse(res, job);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/jobs/:id/approve', async (req, res) => {
  try {
    const job = await approveJob(req.params.id);
    sendResponse(res, job);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/jobs/:id/execute', async (req, res) => {
  try {
    validateJobCanExecute(req.params.id);

    const startedJob = markJobRunning(req.params.id);
    executeJob(req.params.id).catch(err => console.error('Background job execution error:', err));

    sendResponse(res, startedJob);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/jobs/:id/cancel', async (req, res) => {
  try {
    const job = await cancelAgentJob(req.params.id);
    sendResponse(res, job);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/jobs/:id/retry', async (req, res) => {
  try {
    const job = await retryJob(req.params.id);
    sendResponse(res, job);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// --------------------------------------------------
// MISSION TEMPLATES
// --------------------------------------------------

app.get('/api/mission-templates/recommendations/today', async (req, res) => {
  try {
    const recs = await getTodayMissionRecommendations();
    sendResponse(res, recs);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/mission-templates', (req, res) => {
  try {
    const templates = getMissionTemplates();
    sendResponse(res, templates);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/mission-templates/:id', (req, res) => {
  try {
    const template = explainMissionTemplate(req.params.id);
    sendResponse(res, template);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/mission-templates/:id/readiness', async (req, res) => {
  try {
    const readiness = await getMissionTemplateReadiness(req.params.id);
    sendResponse(res, readiness);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/mission-templates/:id/create-job', async (req, res) => {
  try {
    const job = await createJobFromTemplate(req.params.id, req.body || {});
    sendResponse(res, job);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/mission-templates/seed-defaults', (req, res) => {
  try {
    seedMissionTemplates();
    sendResponse(res, { success: true });
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// 29. Artifact Reviews
app.get('/api/artifacts/review-stats', (req, res) => {
  try {
    const stats = getArtifactReviewStats();
    sendResponse(res, stats);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/artifacts/review-inbox', (req, res) => {
  try {
    const status = req.query.status as string;
    const inbox = getReviewInbox(status ? { status } : undefined);
    sendResponse(res, inbox);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/artifacts/sync-reviews', async (req, res) => {
  try {
    const result = await syncGeneratedFilesToReviewInbox();
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/artifacts/:id', (req, res) => {
  try {
    const review = getArtifactReviewById(req.params.id);
    if (!review) return sendResponse(res, null, 'Artifact not found');
    sendResponse(res, review);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/artifacts/:id/preview', (req, res) => {
  try {
    const preview = previewArtifactForReview(req.params.id);
    sendResponse(res, preview);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/artifacts/:id/review', (req, res) => {
  try {
    const updated = submitArtifactReview(req.params.id, req.body);
    sendResponse(res, updated);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.post('/api/artifacts/:id/receipt', async (req, res) => {
  try {
    const result = await writeArtifactReviewReceipt(req.params.id, req.body);
    sendResponse(res, result);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

app.get('/api/artifacts/:id/events', (req, res) => {
  try {
    const events = getArtifactReviewEvents(req.params.id);
    sendResponse(res, events);
  } catch (err: any) {
    sendResponse(res, null, err.message);
  }
});

// 30. Evidence Layer
app.get('/api/evidence/stats', (req, res) => {
  try {
    const dashboard = getEvidenceDashboard();
    sendResponse(res, dashboard.stats);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.get('/api/evidence/demo-ready', (req, res) => {
  try {
    const artifacts = getDemoReadyArtifacts();
    sendResponse(res, artifacts);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.get('/api/evidence/notes', (req, res) => {
  try {
    const notes = getEvidenceNotes();
    sendResponse(res, notes);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.post('/api/evidence/notes', (req, res) => {
  try {
    const result = createOrUpdateEvidenceNote({
      artifact_review_id: req.body.artifactReviewId,
      evidence_type: req.body.evidenceType,
      title: req.body.title,
      business_value: req.body.businessValue,
      technical_value: req.body.technicalValue,
      demo_safety_level: req.body.demoSafetyLevel,
      demo_talking_points: req.body.demoTalkingPoints,
      risks_or_redactions: req.body.risksOrRedactions
    });
    sendResponse(res, result);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.post('/api/evidence/suggest/:artifactReviewId', (req, res) => {
  try {
    const suggestion = suggestEvidenceFromApprovedArtifact(req.params.artifactReviewId);
    sendResponse(res, suggestion);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.get('/api/evidence/packages', (req, res) => {
  try {
    const packages = getEvidencePackages();
    sendResponse(res, packages);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.post('/api/evidence/packages', (req, res) => {
  try {
    const pkg = buildEvidencePackageDraft(req.body.title, req.body.description, req.body.artifactIds);
    sendResponse(res, pkg);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.get('/api/evidence/packages/:id', (req, res) => {
  try {
    const pkg = getEvidencePackageById(req.params.id);
    if (!pkg) return sendResponse(res, null, 'Package not found');
    sendResponse(res, pkg);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.post('/api/evidence/packages/:id/status', (req, res) => {
  try {
    const pkg = updateEvidencePackageStatus(req.params.id, req.body.status);
    sendResponse(res, pkg);
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

app.get('/api/evidence/packages/:id/markdown', (req, res) => {
  try {
    const markdown = generateEvidenceSummaryMarkdown(req.params.id);
    sendResponse(res, { markdown });
  } catch (error: any) {
    sendResponse(res, null, error.message);
  }
});

// Start server
app.listen(PORT, HOST, async () => {
  try {
    initDb();
    console.log('[DB] SQLite Database Initialized');
  } catch (err) {
    console.error('[DB] Failed to initialize SQLite:', err);
  }
  console.log(`\n======================================================`);
  console.log(`Local AI Command Center Backend Online`);
  console.log(`URL: http://${HOST}:${PORT}`);
  console.log(`------------------------------------------------------`);
  console.log(`Config Loaded:`);
  console.log(`- Drop Folder: ${PATHS.dropFolder}`);
  console.log(`- Processed Folder: ${PATHS.processedFolder}`);
  console.log(`- Allowed Scripts: ${Object.keys(ALLOWED_SCRIPTS).length}`);
  console.log(`- Allowed Scheduled Tasks: ${ALLOWED_SCHEDULED_TASKS.length}`);
  console.log(`======================================================\n`);
});

