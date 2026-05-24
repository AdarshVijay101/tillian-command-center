import { getIsDemoMode } from '../hooks/useDemoMode';

const API_URL = 'http://127.0.0.1:8787/api';

export interface ApiResponse<T = any> {
  ok: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}

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

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  if (getIsDemoMode()) {
    const isPreflight = endpoint.startsWith('/actions/preflight/');
    const isPost = options?.method === 'POST';
    const isClear = endpoint === '/runs/clear';
    const isCheckin = endpoint.startsWith('/checkins');
    const isRoutine = endpoint.startsWith('/routines');

    if (isPreflight) {
      const actionName = endpoint.split('/').pop() || 'unknown-action';
      return {
        ok: true,
        data: {
          actionId: actionName,
          allowedToRun: true,
          requiredChecks: ["Backend Online", "Script Exists"],
          passedChecks: ["Backend Online", "Script Exists", "[DEMO] Simulated Success"],
          failedChecks: [],
          warnings: ["Running in DEMO MODE. Results are simulated."],
          fixCommands: []
        } as any,
        error: null,
        timestamp: new Date().toISOString()
      };
    }

    // Phase 9 Demo Interception (GET endpoints)
    const isReminderPreview = endpoint.startsWith('/reminders/preview');
    if (isReminderPreview) {
      return {
        ok: true,
        data: {
          type: endpoint.split('/').pop(),
          title: 'Demo Reminder',
          message: 'This is a demo preview message.\n\nSimulated from Demo Mode.',
          sections: [],
          priority: 'high',
          source: 'routine_protocol_engine'
        }
      } as any;
    }
    const isReminderTypes = endpoint === '/reminders/types';
    if (isReminderTypes) {
      return {
        ok: true,
        data: { types: ['gym', 'night_skincare', 'morning_skincare', 'study1', 'sleep'] }
      } as any;
    }

    // Phase 10 Demo Interception (GET endpoints)
    const isNotification = endpoint.startsWith('/notifications');
    if (isNotification && !isPost) {
      if (endpoint === '/notifications/stats') {
        return {
          ok: true,
          data: {
            deliveriesToday: 3, sentToday: 2, failedToday: 0, fallbackToday: 1, simulatedToday: 0,
            protocolPayloadCount: 2, staticFallbackCount: 1, lastDeliveryAt: new Date().toISOString(),
            byType: { gym: 1, morning_skincare: 1, sleep: 1 },
            byStatus: { sent: 2, fallback_sent: 1 },
            recentCount: 3
          }
        } as any;
      }
      if (endpoint === '/notifications/today' || endpoint.startsWith('/notifications/latest')) {
        return {
          ok: true,
          data: [
            {
              id: 'demo-notif-1', date: new Date().toISOString().split('T')[0], type: 'gym', channel: 'telegram',
              title: 'Gym Block - Demo', message_preview: 'Simulated gym message preview...',
              message_hash: 'abc123demo', source: 'demo_simulated', delivery_status: 'simulated',
              telegram_ok: 1, sent_at: new Date().toISOString()
            }
          ]
        } as any;
      }
      if (endpoint === '/notifications/schedule-audit') {
        return {
          ok: true,
          data: [{ expectedTask: 'Demo Task', found: true, taskName: 'Demo Task', state: 'Ready', nextRunTime: null, type: 'gym', warning: null }]
        } as any;
      }
    }

    // Job Interception
    const isJobCreate = endpoint === '/jobs/create' && options?.method === 'POST';
    if (isJobCreate) {
      const bodyStr = options?.body as string;
      const parsed = JSON.parse(bodyStr || '{}');
      return {
        ok: true,
        data: {
          id: `demo-job-${Date.now()}`,
          job_type: parsed.jobType,
          title: parsed.title || 'Simulated Job',
          status: 'pending',
          priority: parsed.priority || 'normal',
          requires_approval: ['run_daily_planner', 'run_morning_brief', 'run_evening_review', 'run_weekly_digest'].includes(parsed.jobType) ? 1 : 0,
          created_at: new Date().toISOString()
        }
      } as any;
    }

    // Phase 14 Demo Interception (Mission Templates)
    const isMissionTemplates = endpoint.startsWith('/mission-templates');
    if (isMissionTemplates) {
      if (endpoint === '/mission-templates/recommendations/today') {
        return {
          ok: true,
          data: [
            { template_id: 'daily_planner', reason: '[DEMO] Daily plan has not been generated for today.', priority: 'high' },
            { template_id: 'reliability_test', reason: '[DEMO] System health is simulated.', priority: 'normal' }
          ]
        } as any;
      }
      if (endpoint === '/mission-templates') {
        return {
          ok: true,
          data: [
            {
              id: 'daily_planner', job_type: 'run_daily_planner', title: 'Daily Planner Mission',
              description: 'Generates the daily combined plan from Notion/routine rules', category: 'planning',
              is_heavy: 1, requires_approval: 1, requires_openclaw: 1, default_priority: 'high',
              expected_duration_label: '45-90s', safety_notes: 'Modifies daily schedule. Requires OpenClaw and Notion API access.',
              is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            },
            {
              id: 'health_snapshot', job_type: 'capture_health_snapshot', title: 'Health Snapshot Mission',
              description: 'Captures an immediate system health snapshot.', category: 'system',
              is_heavy: 0, requires_approval: 0, requires_openclaw: 0, default_priority: 'normal',
              expected_duration_label: '5-10s', safety_notes: 'Safe, read-only local execution.',
              is_active: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString()
            }
          ]
        } as any;
      }
      if (endpoint.endsWith('/readiness')) {
        return {
          ok: true,
          data: {
            template_available: true,
            openclaw_required: true,
            openclaw_reachable: true,
            duplicate_exists: false,
            approval_required: true,
            safe_to_create: true,
            warnings: ['[DEMO] Simulated Readiness'],
            next_step: 'Create mission and await approval.'
          }
        } as any;
      }
      if (endpoint.endsWith('/create-job')) {
        const templateId = endpoint.split('/')[2];
        return {
          ok: true,
          data: {
            id: `demo-job-${Date.now()}`,
            job_type: templateId === 'daily_planner' ? 'run_daily_planner' : 'capture_health_snapshot',
            title: `Simulated ${templateId} Mission`,
            status: 'pending',
            priority: 'normal',
            requires_approval: templateId === 'daily_planner' ? 1 : 0,
            created_at: new Date().toISOString()
          }
        } as any;
      }
      if (endpoint.endsWith('/seed-defaults')) {
        return { ok: true, data: { success: true } } as any;
      }
      
      // Fallback for /:id
      return {
        ok: true,
        data: {
          id: endpoint.split('/')[2],
          title: 'Simulated Mission Template',
          description: 'Simulated description',
          safety_notes: 'Simulated safety notes',
          expected_duration_label: '0s',
          is_heavy: true,
          requires_approval: true
        }
      } as any;
    }

    const isJobPreflight = endpoint.startsWith('/jobs/') && endpoint.endsWith('/preflight');
    if (isJobPreflight) {
      return {
        ok: true,
        data: {
          id: endpoint.split('/')[2],
          status: 'awaiting_approval',
          preflight_status: 'passed',
          preflight_summary: 'All checks passed (Simulated)'
        }
      } as any;
    }

    const isJobApprove = endpoint.startsWith('/jobs/') && endpoint.endsWith('/approve');
    if (isJobApprove) {
      return {
        ok: true,
        data: {
          id: endpoint.split('/')[2],
          status: 'approved',
          approved_at: new Date().toISOString()
        }
      } as any;
    }

    const isJobExecute = endpoint.startsWith('/jobs/') && endpoint.endsWith('/execute');
    if (isJobExecute) {
      return {
        ok: true,
        data: {
          id: endpoint.split('/')[2],
          status: 'running',
          started_at: new Date().toISOString()
        }
      } as any;
    }
    
    const isJobStats = endpoint === '/jobs/stats';
    if (isJobStats) {
      return {
        ok: true,
        data: {
          pending: 2,
          running: 1,
          succeededToday: 5,
          failedToday: 0,
          blockedToday: 0,
          averageDuration: 45000,
          latestFailure: null,
          queueHealthScore: 100
        }
      } as any;
    }
    
    const isJobGet = endpoint === '/jobs' || (endpoint.startsWith('/jobs/') && endpoint.split('/').length === 3);
    if (isJobGet && !isJobStats) {
      if (endpoint === '/jobs') {
        return {
          ok: true,
          data: [
            {
              id: 'demo-job-running',
              job_type: 'run_daily_planner',
              title: 'Daily Planner [DEMO JOBS - SIMULATED]',
              status: 'running',
              priority: 'high',
              created_at: new Date().toISOString()
            }
          ]
        } as any;
      } else {
        return {
          ok: true,
          data: {
            job: {
              id: endpoint.split('/')[2],
              job_type: 'run_daily_planner',
              title: 'Daily Planner [DEMO JOBS - SIMULATED]',
              status: 'succeeded',
              priority: 'high',
              created_at: new Date().toISOString()
            },
            events: []
          }
        } as any;
      }
    }

    // Phase 11 Demo Interception (GET endpoints)
    const isScheduler = endpoint.startsWith('/scheduler');
    if (isScheduler && !isPost) {
      if (endpoint === '/scheduler/expected') {
        return { ok: true, data: [{ type: 'gym', taskName: 'Adarsh Telegram Gym Reminder', time: '7:00 AM' }] } as any;
      }
      if (endpoint === '/scheduler/audit') {
        return {
          ok: true,
          data: {
            auditRows: [
              { task_name: 'Adarsh Telegram Gym Reminder', expected_type: 'gym', expected_time: '7:00 AM', exists_in_os: true, enabled: true, state: 'Ready', command_ok: false, type_ok: true, timing_ok: false, warning: 'Trigger time is 6:50 AM, expected 7:00 AM' }
            ],
            repairPlans: [
              { type: 'gym', taskName: 'Adarsh Telegram Gym Reminder', safeToRepair: true, needsRepair: true, changes: ['Update trigger time to 7:00 AM', 'Update Action to execute powershell.exe'] }
            ]
          }
        } as any;
      }
      if (endpoint === '/scheduler/health') {
        return {
          ok: true,
          data: {
            expectedCount: 12, foundCount: 11, enabledCount: 11,
            missingCount: 1, misconfiguredCount: 0, duplicateCount: 0,
            healthScore: 85, warnings: []
          }
        } as any;
      }
      if (endpoint === '/scheduler/latest-audit') {
        return { ok: true, data: [] } as any;
      }
    }

    // Phase 12 Demo Interception (GET endpoints)
    const isSystemTest = endpoint.startsWith('/system');
    if (isSystemTest && !isPost) {
      if (endpoint === '/system/test-suite') {
        return {
          ok: true,
          data: {
            backendOnline: true, safetyEndpointOk: true, configValidateOk: true, dbStatusOk: true,
            routinesStatusOk: true, schedulerHealthOk: true, notificationStatsOk: true, analyticsOk: true,
            filesLatestOk: true, remindersPayloadOk: true, openclawStatus: 'online',
            warnings: [], errors: [], overallReadinessScore: 100
          }
        } as any;
      }
      if (endpoint === '/system/report') {
        return {
          ok: true,
          data: {
            timestamp: new Date().toISOString(),
            appVersion: '1.0.0-Demo',
            backendHost: '127.0.0.1:8787',
            safetySummary: 'Demo Sandbox Active',
            configValidation: 'Valid',
            dbStatus: 'Online',
            latestAnalytics: { runs: 42 },
            notificationStats: { deliveriesToday: 3, failedToday: 0, fallbackToday: 0 },
            schedulerHealth: { healthScore: 100, missingCount: 0, misconfiguredCount: 0 },
            routineStatus: '12 routines configured',
            latestFilesCount: 7,
            openclawStatus: 'online',
            demoModeNote: 'Demo Mode active. Real systems are not queried.',
            redactionStatus: 'Secure',
            warnings: [],
            errors: []
          }
        } as any;
      }
    }

    // Phase 17 Demo Interception (Release Readiness)
    const isRelease = endpoint.startsWith('/release');
    if (isRelease) {
      if (endpoint === '/release/readiness') {
        return {
          ok: true,
          data: {
            appVersion: '1.0.0-local',
            backendHost: '127.0.0.1',
            demoModeSupported: true,
            safetyStatus: 'Secure',
            dbStatus: 'Connected',
            schedulerStatus: 'Healthy',
            notificationStatus: 'Healthy',
            jobQueueStatus: 'Healthy',
            missionTemplateStatus: 'Healthy',
            artifactReviewStatus: 'Healthy',
            evidenceLayerStatus: 'Healthy',
            documentationStatus: 'Complete',
            secretsAuditStatus: 'Secure',
            gitignoreStatus: 'Secure',
            readinessScore: 100,
            warnings: [],
            blockers: [],
            recommendation: 'READY'
          }
        } as any;
      }
      if (endpoint === '/release/checklist') {
        return {
          ok: true,
          data: {
            'build passes': true,
            'backend local only': true,
            'database ignored': true,
            'action ledgers ignored': true,
            'env files ignored': true,
            'no secrets in tracked files': true,
            'demo mode available': true,
            'read-only preview enforced': true,
            'evidence markdown redacts paths': true,
            'scheduler repair allowlisted': true,
            'heavy jobs approval gated': true,
            'OpenClaw offline handled as degraded': true,
            'docs exist': true,
            'demo script exists': true
          }
        } as any;
      }
      if (endpoint === '/release/repo-safety') {
        return {
          ok: true,
          data: {
            gitignoreValid: true,
            dbIgnored: true,
            ledgersIgnored: true,
            envIgnored: true,
            noTokensInCode: true,
            backendHost: '127.0.0.1'
          }
        } as any;
      }
    }

    // Phase 16 Demo Interception (Evidence Layer)
    const isEvidence = endpoint.startsWith('/evidence');
    if (isEvidence) {
      if (endpoint === '/evidence/stats') {
        return {
          ok: true,
          data: {
            approvedArtifacts: 5,
            demoReadyArtifacts: 3,
            portfolioReadyArtifacts: 2,
            needsRedaction: 1,
            evidenceNotesCount: 3,
            packagesCount: 1
          }
        } as any;
      }
      if (endpoint === '/evidence/demo-ready') {
        return {
          ok: true,
          data: [
            { id: 'demo-art-1', file_name: 'Simulated Demo Ready Artifact.md', artifact_type: 'markdown_note', review_status: 'demo_ready', created_at: new Date().toISOString() }
          ]
        } as any;
      }
      if (endpoint === '/evidence/notes' && !isPost) {
        return {
          ok: true,
          data: [
            { id: 'demo-note-1', title: 'Simulated Evidence Note', evidence_type: 'automation_proof', demo_safety_level: 'portfolio_ready', business_value: 'Proves UI integration works.', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ]
        } as any;
      }
      if (endpoint === '/evidence/notes' && isPost) {
        return {
          ok: true,
          data: { id: 'demo-note-1', title: 'Simulated Evidence Note Saved', updated_at: new Date().toISOString() }
        } as any;
      }
      if (endpoint.startsWith('/evidence/suggest')) {
        return {
          ok: true,
          data: {
            evidence_type: 'workflow_proof',
            title: 'Suggested Demo Evidence',
            business_value: 'Automatically inferred business value.',
            technical_value: 'Local-first metadata tracking.',
            demo_safety_level: 'portfolio_ready',
            demo_talking_points: 'Point out the safety features.',
            risks_or_redactions: 'No risks found.'
          }
        } as any;
      }
      if (endpoint === '/evidence/packages' && !isPost) {
        return {
          ok: true,
          data: [
            { id: 'demo-pkg-1', title: 'Simulated Demo Package', package_status: 'ready', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
          ]
        } as any;
      }
      if (endpoint === '/evidence/packages' && isPost) {
        return {
          ok: true,
          data: { id: 'demo-pkg-2', title: 'New Demo Package', package_status: 'draft', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
        } as any;
      }
      if (endpoint.endsWith('/markdown')) {
        return {
          ok: true,
          data: { markdown: '# Simulated Package\n\nThis is a simulated demo evidence package.\n\n- Path: [REDACTED_LOCAL_PATH]\n' }
        } as any;
      }
      if (endpoint.endsWith('/status')) {
        return { ok: true, data: { package_status: 'ready' } } as any;
      }
    }

    if (isPost && !isClear) {
      // Phase 9 Demo Interception (POST endpoints)
      const isSendReminder = endpoint === '/actions/send-routine-reminder';
      if (isSendReminder) {
        return {
          ok: true,
          data: { success: true, stdout: 'Demo Mode: Telegram message send simulated.' }
        } as any;
      }

      if (isCheckin) {
        return {
          ok: true,
          data: {
            success: true,
            message: "Demo Mode: Check-in saved virtually"
          }
        } as any;
      }

      // Mock Telegram Studio
      if (endpoint.startsWith('/telegram/messages/types')) {
        return { ok: true, data: ['daily_planner', 'morning_brief', 'evening_reflection'] } as any;
      }
      if (endpoint.startsWith('/telegram/messages/preview/')) {
        const t = endpoint.split('/').pop() || 'unknown';
        return {
          ok: true,
          data: {
            default_template: `Mock template for ${t}`,
            current_override: null,
            default_preview: `[DEMO] This is a simulated payload for ${t}.\nTime: ${new Date().toLocaleTimeString()}`
          }
        } as any;
      }
      if (endpoint.startsWith('/telegram/messages/override') || endpoint.startsWith('/telegram/messages/reset/') || endpoint.startsWith('/telegram/messages/send-test')) {
        return { ok: true, data: { success: true, simulated: true } } as any;
      }
      if (endpoint.startsWith('/config/public')) {
        return {
          ok: true,
          data: {
            BACKEND_URL: 'http://127.0.0.1:8787',
            OPENCLAW_URL: 'http://127.0.0.1:18789',
            DROP_FOLDER: '[REDACTED_LOCAL_PATH]'
          }
        } as any;
      }

      if (isRoutine) {
        return {
          ok: true,
          data: {
            success: true,
            message: "Demo Mode: Routine action simulated virtually"
          }
        } as any;
      }

      if (isNotification) {
        return {
          ok: true,
          data: { success: true, id: 'demo-log-id' }
        } as any;
      }

      // Phase 15 Demo Interception
      const isArtifacts = endpoint.startsWith('/artifacts');
      if (isArtifacts) {
        if (endpoint === '/artifacts/review-stats') {
          return {
            ok: true,
            data: {
              pendingCount: 2,
              approvedCount: 15,
              needsRevisionCount: 1,
              rejectedCount: 0,
              demoReadyCount: 4,
              generatedToday: 3,
              reviewedToday: 1,
              oldestPendingArtifact: new Date().toISOString()
            }
          } as any;
        }
        if (endpoint === '/artifacts/sync-reviews') {
          return { ok: true, data: { success: true, syncedCount: 3 } } as any;
        }
        if (endpoint.startsWith('/artifacts/review-inbox')) {
          return {
            ok: true,
            data: [
              {
                id: 'demo-1',
                file_name: 'morning_brief_2026-05-22.md',
                artifact_type: 'morning_brief',
                review_status: endpoint.includes('status=') ? endpoint.split('=')[1] : 'pending',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              }
            ]
          } as any;
        }
        if (endpoint.endsWith('/preview')) {
          return {
            ok: true,
            data: {
              id: 'demo-1',
              fileName: 'morning_brief_2026-05-22.md',
              content: '# DEMO REVIEW INBOX - SIMULATED\n\nThis is a mock artifact preview.',
              isTruncated: false,
              totalLines: 3
            }
          } as any;
        }
        if (endpoint.endsWith('/events')) {
          return {
            ok: true,
            data: [
              {
                id: 'event-1',
                event_type: 'status_updated',
                message: 'Status updated to pending',
                created_at: new Date().toISOString()
              }
            ]
          } as any;
        }
        if (endpoint.endsWith('/review') && isPost) {
          return {
            ok: true,
            data: { success: true, status: 'simulated_update' }
          } as any;
        }
        if (endpoint.endsWith('/receipt') && isPost) {
          return {
            ok: true,
            data: { success: true, receiptFileName: 'mock_receipt.md' }
          } as any;
        }
        if (endpoint.match(/^\/artifacts\/[a-zA-Z0-9-]+$/)) {
          return {
            ok: true,
            data: {
              id: 'demo-1',
              file_name: 'morning_brief_2026-05-22.md',
              artifact_type: 'morning_brief',
              review_status: 'pending',
              created_at: new Date().toISOString()
            }
          } as any;
        }
      }

      const isSchedulerPost = endpoint.startsWith('/scheduler/');
      if (isSchedulerPost) {
        return {
          ok: true,
          data: { success: true, stdout: 'Demo Mode: Scheduler action simulated virtually' }
        } as any;
      }

      return {
        ok: true,
        data: {
          ok: true,
          success: true,
          stdout: `[DEMO MODE: SIMULATED]\nAction executed successfully in mock environment.\nNo real scripts were triggered.`,
          message: `[DEMO MODE: SIMULATED] Action triggered.`,
          durationMs: Math.floor(Math.random() * 500) + 100,
          runId: `demo-run-${Date.now()}`
        } as any,
        error: null,
        timestamp: new Date().toISOString()
      };
    }

    return {
      ok: true,
      data: isCheckin || isRoutine ? { success: true, message: '[DEMO] Check-in/Routine success' } : { success: true, message: '[DEMO] Action success', id: `demo-${Date.now()}` }
    } as any;
  }

  try {
    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      }
    });
    
    // We expect the server to always return JSON in ApiResponse format
    const json = await res.json();
    return json;
  } catch (err: any) {
    return {
      ok: false,
      data: null as any,
      error: err.message || 'Network error',
      timestamp: new Date().toISOString()
    };
  }
}

export const api = {
  getPing: () => fetchApi('/ping'),
  getHealth: () => fetchApi('/health'),
  getDiagnostics: () => fetchApi('/diagnostics/self-test'),
  getLatestFiles: () => fetchApi('/files/latest'),
  previewFile: (path: string) => fetchApi(`/files/preview?path=${encodeURIComponent(path)}`),
  getScheduledTasks: () => fetchApi('/scheduled-tasks'),
  
  runScheduledTask: (taskName: string) => fetchApi('/scheduled-tasks/run', { method: 'POST', body: JSON.stringify({ taskName }) }),
  enableScheduledTask: (taskName: string) => fetchApi('/scheduled-tasks/enable', { method: 'POST', body: JSON.stringify({ taskName }) }),
  disableScheduledTask: (taskName: string) => fetchApi('/scheduled-tasks/disable', { method: 'POST', body: JSON.stringify({ taskName }) }),
  
  getPreflightCheck: (actionName: string) => fetchApi(`/actions/preflight/${actionName}`),
  runAction: (actionName: string) => fetchApi(`/actions/${actionName}`, { method: 'POST' }),
  sendDynamicAdjustment: (mode: string) => fetchApi('/actions/send-dynamic-adjustment', { method: 'POST', body: JSON.stringify({ mode }) }),

  getRuns: () => fetchApi('/runs'),
  getRun: (id: string) => fetchApi(`/runs/${id}`),
  clearRuns: () => fetchApi('/runs/clear', { method: 'POST' }),

  getAnalyticsOverview: () => fetchApi('/analytics/overview'),
  getAnalyticsToday: () => fetchApi('/analytics/today'),
  getAnalyticsTrends: () => fetchApi('/analytics/trends'),
  getDbStatus: () => fetchApi('/db/status'),
  syncDbFiles: () => fetchApi('/db/sync-files', { method: 'POST' }),
  migrateDbRuns: () => fetchApi('/db/migrate-runs', { method: 'POST' }),
  captureHealth: () => fetchApi('/db/capture-health', { method: 'POST' }),
  
  // Phase 7
  getTodayCheckins: () => fetchApi('/checkins/today'),
  submitCheckin: (data: any) => fetchApi('/checkins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  submitReflection: (data: any) => fetchApi('/checkins/reflection', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  
  // Phase 8
  getRoutineProtocols: () => fetchApi('/routines/protocols'),
  getTodayRoutinePlan: () => fetchApi('/routines/today'),
  regenerateTodayRoutinePlan: () => fetchApi('/routines/regenerate-today', { method: 'POST' }),
  getRoutineStatus: () => fetchApi('/routines/status'),
  seedDefaultRoutines: () => fetchApi('/routines/seed-defaults', { method: 'POST' }),
  submitRoutineOverride: (mode: string) => fetchApi('/routines/override', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode })
  }),
  
  // Phase 9
  getReminderTypes: () => fetchApi('/reminders/types'),
  getReminderPreview: (type: string) => fetchApi(`/reminders/preview/${type}`),
  sendRoutineReminder: (type: string) => fetchApi('/actions/send-routine-reminder', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type })
  }),
  
  // Phase 10
  getNotificationToday: () => fetchApi('/notifications/today'),
  getNotificationStats: () => fetchApi('/notifications/stats'),
  getNotificationLatest: (limit?: number) => fetchApi(`/notifications/latest${limit ? `?limit=${limit}` : ''}`),
  logNotification: (data: any) => fetchApi('/notifications/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  getNotificationScheduleAudit: () => fetchApi('/notifications/schedule-audit'),

  // Phase 11
  getSchedulerExpected: () => fetchApi('/scheduler/expected'),
  getSchedulerAudit: () => fetchApi('/scheduler/audit'),
  getSchedulerLatestAudit: () => fetchApi('/scheduler/latest-audit'),
  getSchedulerHealth: () => fetchApi('/scheduler/health'),
  repairSchedulerTask: (type: string) => fetchApi(`/scheduler/repair/${type}`, { method: 'POST' }),
  repairAllSchedulerTasks: () => fetchApi('/scheduler/repair-all', { method: 'POST' }),
  enableSchedulerTask: (type: string) => fetchApi(`/scheduler/enable/${type}`, { method: 'POST' }),
  disableSchedulerTask: (type: string) => fetchApi(`/scheduler/disable/${type}`, { method: 'POST' }),
  
  // Phase 12
  getSystemTestSuite: () => fetchApi('/system/test-suite'),
  getSystemReport: () => fetchApi('/system/report'),
  getSystemReportMarkdown: async () => {
    if (getIsDemoMode()) {
      return `# Local AI Command Center - Diagnostic Report\n**Timestamp:** ${new Date().toISOString()}\n**Demo Mode:** Active`;
    }
    const res = await fetch(`${API_URL}/system/report/markdown`);
    return res.text();
  },

  // Phase 13 - Job Queue
  getJobs: (filters?: any) => {
    const q = new URLSearchParams(filters || {}).toString();
    return fetchApi(`/jobs${q ? `?${q}` : ''}`);
  },
  getJobStats: () => fetchApi('/jobs/stats'),
  getJobById: (id: string) => fetchApi(`/jobs/${id}`),
  createJob: (data: { jobType: string, priority?: string, title?: string, options?: any }) => fetchApi('/jobs/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }),
  preflightJob: (id: string) => fetchApi(`/jobs/${id}/preflight`, { method: 'POST' }),
  approveJob: (id: string) => fetchApi(`/jobs/${id}/approve`, { method: 'POST' }),
  executeJob: (id: string) => fetchApi(`/jobs/${id}/execute`, { method: 'POST' }),
  cancelJob: (id: string) => fetchApi(`/jobs/${id}/cancel`, { method: 'POST' }),
  retryJob: (id: string) => fetchApi(`/jobs/${id}/retry`, { method: 'POST' }),

  // Phase 14 - Mission Templates
  getMissionRecommendations: () => fetchApi('/mission-templates/recommendations/today'),
  getMissionTemplates: () => fetchApi('/mission-templates'),
  getMissionTemplate: (id: string) => fetchApi(`/mission-templates/${id}`),
  getMissionReadiness: (id: string) => fetchApi(`/mission-templates/${id}/readiness`),
  createJobFromMissionTemplate: (id: string, options?: any) => fetchApi(`/mission-templates/${id}/create-job`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options || {})
  }),
  seedMissionTemplates: () => fetchApi('/mission-templates/seed-defaults', { method: 'POST' }),

  // Phase 15
  getArtifactReviewStats: () => fetchApi('/artifacts/review-stats'),
  getArtifactReviewInbox: (status?: string) => fetchApi(`/artifacts/review-inbox${status ? `?status=${status}` : ''}`),
  syncArtifactReviews: () => fetchApi('/artifacts/sync-reviews', { method: 'POST' }),
  getArtifactReview: (id: string) => fetchApi(`/artifacts/${id}`),
  previewArtifact: (id: string) => fetchApi(`/artifacts/${id}/preview`),
  getArtifactReviewEvents: (id: string) => fetchApi(`/artifacts/${id}/events`),
  submitArtifactReview: (id: string, payload: { reviewStatus: string, rating?: number, reviewNotes?: string, decisionReason?: string }) => fetchApi(`/artifacts/${id}/review`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  writeArtifactReviewReceipt: (id: string, payload: { reviewStatus: string, rating?: number, reviewNotes?: string, decisionReason?: string }) => fetchApi(`/artifacts/${id}/receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),

  // Phase 16
  getEvidenceStats: () => fetchApi('/evidence/stats'),
  getApprovedEvidence: () => fetchApi('/artifacts/review-inbox?status=approved'),
  getDemoReadyEvidence: () => fetchApi('/artifacts/review-inbox?status=demo_ready'),
  getEvidenceNotes: () => fetchApi('/evidence/notes'),
  suggestEvidenceNote: (reviewId: string) => fetchApi(`/evidence/suggest/${reviewId}`, { method: 'POST' }),
  saveEvidenceNote: (payload: any) => fetchApi('/evidence/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  createEvidencePackage: (payload: any) => fetchApi('/evidence/packages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }),
  getEvidencePackages: () => fetchApi('/evidence/packages'),
  getEvidencePackageById: (id: string) => fetchApi(`/evidence/packages/${id}`),
  updateEvidencePackageStatus: (id: string, status: string) => fetchApi(`/evidence/packages/${id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status })
  }),
  getEvidencePackageMarkdown: (id: string) => fetchApi(`/evidence/packages/${id}/markdown`),

  // Phase 17
  getReleaseReadiness: () => fetchApi('/release/readiness'),
  getReleaseChecklist: () => fetchApi('/release/checklist'),
  getRepoSafety: () => fetchApi('/release/repo-safety'),

  // Telegram Studio
  getTelegramMessageTypes: () => fetchApi('/telegram/messages/types'),
  getTelegramMessagePreview: (type: string) => fetchApi(`/telegram/messages/preview/${type}`),
  saveTelegramMessageOverride: (type: string, overrideText: string) => fetchApi('/telegram/messages/override', {
    method: 'POST',
    body: JSON.stringify({ reminder_type: type, message_template: overrideText })
  }),
  resetTelegramMessageOverride: (type: string) => fetchApi(`/telegram/messages/reset/${type}`, { method: 'POST' }),
  sendTelegramTestMessage: (type: string, overrideText: string) => fetchApi('/telegram/messages/send-test', {
    method: 'POST',
    body: JSON.stringify({ reminder_type: type, message_template: overrideText })
  }),

  // Config
  getConfig: () => fetchApi('/config/public')
};

