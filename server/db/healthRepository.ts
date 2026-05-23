import { db } from './db';
import crypto from 'crypto';

const insertHealthStmt = db.prepare(`
  INSERT INTO health_snapshots (
    id, captured_at, overall_status, openclaw_gateway, openclaw_browser, wsl_detected,
    drop_folder_exists, processed_folder_exists, scheduled_tasks_detected_count, warnings, errors
  ) VALUES (
    @id, @captured_at, @overall_status, @openclaw_gateway, @openclaw_browser, @wsl_detected,
    @drop_folder_exists, @processed_folder_exists, @scheduled_tasks_detected_count, @warnings, @errors
  )
`);

export const captureHealthSnapshot = (health: any) => {
  const id = crypto.randomUUID();
  insertHealthStmt.run({
    id,
    captured_at: new Date().toISOString(),
    overall_status: health.status,
    openclaw_gateway: health.openclawGatewayReachable ? 1 : 0,
    openclaw_browser: health.openclawBrowserReachable ? 1 : 0,
    wsl_detected: health.wslDefault ? 1 : 0,
    drop_folder_exists: health.dropFolderExists ? 1 : 0,
    processed_folder_exists: health.processedFolderExists ? 1 : 0,
    scheduled_tasks_detected_count: health.scheduledTasksDetectedCount || 0,
    warnings: health.warnings ? JSON.stringify(health.warnings) : '[]',
    errors: health.errors ? JSON.stringify(health.errors) : '[]'
  });
  return id;
};

export const getLatestHealthSnapshot = () => {
  return db.prepare('SELECT * FROM health_snapshots ORDER BY captured_at DESC LIMIT 1').get() as any;
};
