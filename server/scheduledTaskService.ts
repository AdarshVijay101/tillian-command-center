import { execa } from 'execa';
import { ALLOWED_SCHEDULED_TASKS, PATHS } from './config';

export interface ScheduledTaskInfo {
  taskName: string;
  exists: boolean;
  state?: string;
  nextRunTime?: string | null;
  lastRunTime?: string | null;
  lastTaskResult?: string | number | null;
}

export async function getScheduledTasks(): Promise<ScheduledTaskInfo[]> {
  const psArray = '@(' + ALLOWED_SCHEDULED_TASKS.map(t => `'${t.replace(/'/g, "''")}'`).join(',') + ')';
  
  const psCommand = `
    $tasks = ${psArray}
    $results = foreach ($t in $tasks) {
      $task = Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue
      if ($null -ne $task) {
        $info = Get-ScheduledTaskInfo -TaskName $t -ErrorAction SilentlyContinue
        [PSCustomObject]@{
          taskName = $t
          exists = $true
          state = $task.State.ToString()
          nextRunTime = if ($info) { $info.NextRunTime } else { $null }
          lastRunTime = if ($info) { $info.LastRunTime } else { $null }
          lastTaskResult = if ($info) { $info.LastTaskResult } else { $null }
        }
      } else {
        [PSCustomObject]@{
          taskName = $t
          exists = $false
        }
      }
    }
    $results | ConvertTo-Json -Compress
  `;

  try {
    const { stdout } = await execa(PATHS.powershell, [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-Command', psCommand
    ]);

    if (!stdout || stdout.trim() === '') return [];
    
    // Parse JSON
    const parsed = JSON.parse(stdout);
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    
    return arr.map((t: any) => ({
      taskName: t.taskName || 'Unknown',
      exists: t.exists === true,
      state: t.state,
      nextRunTime: t.nextRunTime,
      lastRunTime: t.lastRunTime,
      lastTaskResult: t.lastTaskResult
    }));
  } catch (err) {
    console.error('Failed to get scheduled tasks:', err);
    // Even on catastrophic failure, return false for all rather than throwing if desired,
    // but throwing is fine since express endpoint handles it safely.
    throw new Error('PowerShell execution failed while getting scheduled tasks.');
  }
}

export async function controlScheduledTask(taskName: string, action: 'start' | 'enable' | 'disable'): Promise<boolean> {
  if (!ALLOWED_SCHEDULED_TASKS.includes(taskName)) {
    throw new Error('Unauthorized scheduled task name.');
  }

  let cmd = '';
  if (action === 'start') cmd = `Start-ScheduledTask -TaskName '${taskName}'`;
  else if (action === 'enable') cmd = `Enable-ScheduledTask -TaskName '${taskName}'`;
  else if (action === 'disable') cmd = `Disable-ScheduledTask -TaskName '${taskName}'`;

  try {
    await execa(PATHS.powershell, [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-Command', cmd
    ]);
    return true;
  } catch (err) {
    console.error(`Failed to ${action} scheduled task:`, err);
    throw new Error(`Failed to ${action} task. See logs.`);
  }
}
