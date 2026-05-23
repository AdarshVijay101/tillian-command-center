import fs from 'fs/promises';
import { execa } from 'execa';
import net from 'net';
import { PATHS, PORTS, ALLOWED_SCRIPTS } from './config';
import { getScheduledTasks } from './scheduledTaskService';

async function checkPort(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(2000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, host);
  });
}

async function checkFolder(folderPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(folderPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function checkFile(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function checkWslDefault(): Promise<string> {
  try {
    const { stdout } = await execa('wsl', ['-l', '-v']);
    const normalized = stdout.replace(/\0/g, ''); 
    if (normalized.includes('Ubuntu-24.04')) {
      return 'Ubuntu-24.04 detected';
    }
    return 'WSL running, specific distro not confirmed';
  } catch (err) {
    return 'WSL check failed';
  }
}

export async function checkSystemHealth() {
  const [
    openclawGatewayReachable,
    openclawBrowserReachable,
    dropFolderExists,
    processedFolderExists,
    automationRootExists,
    wslDefault
  ] = await Promise.all([
    checkPort(PORTS.openclawGateway),
    checkPort(PORTS.openclawBrowserServer),
    checkFolder(PATHS.dropFolder),
    checkFolder(PATHS.processedFolder),
    checkFolder(PATHS.automationRoot),
    checkWslDefault()
  ]);

  const scriptsExist: Record<string, boolean> = {};
  for (const [key, scriptPath] of Object.entries(ALLOWED_SCRIPTS)) {
    scriptsExist[key] = await checkFile(scriptPath);
  }

  let scheduledTasks: any[] = [];
  try {
    scheduledTasks = await getScheduledTasks();
  } catch {
    // Ignore fail for health
  }

  const missingScheduledTasks = scheduledTasks.filter(t => !t.exists).map(t => t.taskName);
  const scheduledTasksDetectedCount = scheduledTasks.filter(t => t.exists).length;

  const warnings: string[] = [];
  const errors: string[] = [];

  if (!openclawGatewayReachable) warnings.push('OpenClaw Gateway port 18789 is unreachable.');
  if (!openclawBrowserReachable) warnings.push('OpenClaw Browser Server port 18791 is unreachable.');
  if (!dropFolderExists) errors.push('OpenClaw Drop Folder not found.');
  if (!processedFolderExists) errors.push('OpenClaw Processed Folder not found.');
  if (!automationRootExists) errors.push('Automation root folder not found.');
  if (wslDefault === 'WSL check failed') warnings.push('WSL check failed.');
  
  if (missingScheduledTasks.length > 0) {
    warnings.push(`${missingScheduledTasks.length} scheduled tasks missing.`);
  }

  Object.entries(scriptsExist).forEach(([name, exists]) => {
    if (!exists) errors.push(`Script missing: ${name}`);
  });

  const overallStatus = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'healthy';

  return {
    backendOnline: true,
    openclawGatewayReachable,
    openclawBrowserReachable,
    wslDefault,
    dropFolderExists,
    processedFolderExists,
    automationRootExists,
    scriptsExist,
    latestFilesExist: {}, // Can populate if needed
    scheduledTasksDetectedCount,
    missingScheduledTasks,
    warnings,
    errors,
    overallStatus
  };
}
