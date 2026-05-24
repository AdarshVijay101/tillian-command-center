import { execa } from 'execa';
import { PATHS } from '../config';
import { logScheduledTaskAudits, ScheduledTaskAuditRow } from '../db/schedulerRepository';

export const EXPECTED_SCHEDULE = [
  { type: 'wake', taskName: 'Adarsh Telegram Wake Reminder', time: '6:30 AM' },
  { type: 'gym', taskName: 'Adarsh Telegram Gym Reminder', time: '7:00 AM' },
  { type: 'post_gym_bodycare', taskName: 'Adarsh Telegram Post Gym Body Care Reminder', time: '9:15 AM' },
  { type: 'morning_skincare', taskName: 'Adarsh Telegram Morning Skincare Reminder', time: '9:45 AM' },
  { type: 'study1', taskName: 'Adarsh Telegram Study Block 1 Reminder', time: '11:15 AM' },
  { type: 'study2', taskName: 'Adarsh Telegram Study Block 2 Reminder', time: '1:45 PM' },
  { type: 'study3', taskName: 'Adarsh Telegram Study Block 3 Reminder', time: '4:15 PM' },
  { type: 'evening_walk', taskName: 'Adarsh Telegram Evening Walk Reminder', time: '6:15 PM' },
  { type: 'evening_cooking', taskName: 'Adarsh Telegram Evening Cooking Reminder', time: '6:45 PM' },
  { type: 'reading', taskName: 'Adarsh Telegram Reading Reminder', time: '10:15 PM' },
  { type: 'night_skincare', taskName: 'Adarsh Telegram Night Skincare Reminder', time: '9:30 PM' },
  { type: 'sleep', taskName: 'Adarsh Telegram Sleep Wind Down Reminder', time: '11:15 PM' }
];

export const getExpectedReminderTasks = () => EXPECTED_SCHEDULE;

export async function auditReminderScheduledTasks(dryRun = false) {
  const psArray = '@(' + EXPECTED_SCHEDULE.map(t => `'${t.taskName.replace(/'/g, "''")}'`).join(',') + ')';
  
  const psCommand = `
    $tasks = ${psArray}
    $results = foreach ($t in $tasks) {
      $taskObjects = Get-ScheduledTask -TaskName $t -ErrorAction SilentlyContinue
      
      if ($null -ne $taskObjects) {
        $task = if ($taskObjects -is [array]) { $taskObjects[0] } else { $taskObjects }
        $duplicate = if ($taskObjects -is [array]) { $true } else { $false }
        
        $info = Get-ScheduledTaskInfo -TaskName $t -ErrorAction SilentlyContinue
        
        $action = if ($task.Actions) { $task.Actions[0] } else { $null }
        $trigger = if ($task.Triggers) { $task.Triggers[0] } else { $null }
        
        [PSCustomObject]@{
          taskName = $t
          exists = $true
          state = $task.State.ToString()
          nextRunTime = if ($info) { $info.NextRunTime } else { $null }
          lastRunTime = if ($info) { $info.LastRunTime } else { $null }
          lastTaskResult = if ($info) { $info.LastTaskResult } else { $null }
          execute = if ($action) { $action.Execute } else { $null }
          arguments = if ($action) { $action.Arguments } else { $null }
          startBoundary = if ($trigger) { $trigger.StartBoundary } else { $null }
          duplicateDetected = $duplicate
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

  let stdout = '';
  try {
    const res = await execa(PATHS.powershell, ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', psCommand]);
    stdout = res.stdout;
  } catch (err: any) {
    throw new Error('Failed to run scheduler audit: ' + err.message);
  }

  if (!stdout || stdout.trim() === '') return [];
  
  const parsed = JSON.parse(stdout);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  
  const auditRows: ScheduledTaskAuditRow[] = [];
  const repairPlans = [];

  for (const expected of EXPECTED_SCHEDULE) {
    const found = arr.find((t: any) => t.taskName === expected.taskName);
    
    let commandOk = false;
    let typeOk = false;
    let timingOk = false;
    let enabled = false;
    const warnings: string[] = [];
    const changes: string[] = [];
    
    if (found && found.exists) {
      enabled = found.state !== 'Disabled';
      
      if (found.execute && found.execute.toLowerCase().includes('powershell')) {
        commandOk = true;
      } else {
        warnings.push('Action executable is not powershell.');
        changes.push('Update Action to execute powershell.exe');
      }

      if (found.arguments) {
        if (!found.arguments.includes(expected.type)) {
          warnings.push(`Arguments missing expected type: ${expected.type}`);
          changes.push(`Ensure -Type ${expected.type} argument`);
        } else {
          typeOk = true;
        }
        if (!found.arguments.includes('Send-Personal-Routine-Reminder-To-Telegram.ps1')) {
          warnings.push('Script path incorrect.');
          changes.push('Ensure script path points to Send-Personal-Routine-Reminder-To-Telegram.ps1');
        }
      } else {
        warnings.push('Action arguments are empty.');
        changes.push(`Add correct powershell arguments with -Type ${expected.type}`);
      }

      if (found.startBoundary && typeof found.startBoundary === 'string') {
        const timeStr = found.startBoundary; 
        const dateObj = new Date(timeStr);
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        const formattedFoundTime = `${hours % 12 === 0 ? 12 : hours % 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
        
        if (formattedFoundTime === expected.time) {
          timingOk = true;
        } else {
          warnings.push(`Trigger time is ${formattedFoundTime}, expected ${expected.time}`);
          changes.push(`Update trigger time to ${expected.time}`);
        }
      } else {
        warnings.push('No trigger start boundary found.');
        changes.push(`Add Daily trigger at ${expected.time}`);
      }

      if (found.duplicateDetected) {
        warnings.push('Duplicate task definitions detected.');
        changes.push('Repair will overwrite all duplicates with a clean task');
      }
      
      if (!enabled) {
        warnings.push('Task is disabled.');
        changes.push('Enable task');
      }
    } else {
      warnings.push('Task is missing.');
      changes.push(`Create new Scheduled Task at ${expected.time} for type ${expected.type}`);
    }

    const isSafeToRepair = true; // All 12 types are unconditionally safe to repair

    repairPlans.push({
      type: expected.type,
      taskName: expected.taskName,
      safeToRepair: isSafeToRepair,
      changes: changes.length ? changes : ['No changes needed, task is healthy'],
      needsRepair: changes.length > 0
    });

    auditRows.push({
      task_name: expected.taskName,
      expected_type: expected.type,
      expected_time: expected.time,
      exists_in_os: found ? found.exists === true : false,
      enabled,
      state: found ? found.state : 'Missing',
      next_run_time: found ? found.nextRunTime : null,
      last_run_time: found ? found.lastRunTime : null,
      last_task_result: found ? found.lastTaskResult : null,
      command_ok: commandOk,
      type_ok: typeOk,
      timing_ok: timingOk,
      duplicate_detected: found ? found.duplicateDetected === true : false,
      warning: warnings.length ? warnings.join(' | ') : null
    });
  }

  if (!dryRun) {
    logScheduledTaskAudits(auditRows);
  }

  return {
    auditRows,
    repairPlans
  };
}

export async function repairReminderTask(type: string) {
  const expected = EXPECTED_SCHEDULE.find(t => t.type === type);
  if (!expected) throw new Error(`Type ${type} is not an allowlisted reminder task.`);

  // Validate we aren't doing code injection
  if (!/^[a-z0-9_]+$/.test(type)) throw new Error(`Invalid type format: ${type}`);

  // The powershell script must run New-ScheduledTaskAction, New-ScheduledTaskTrigger, Register-ScheduledTask
  const scriptPath = "C:\\Users\\kadar\\OpenClawAutomation\\Send-Personal-Routine-Reminder-To-Telegram.ps1";
  
  const psCommand = `
    $ErrorActionPreference = 'Stop'
    
    # Remove existing to cleanly recreate
    Get-ScheduledTask -TaskName "${expected.taskName}" -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false
    
    $action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File \`"${scriptPath}\`" -Type ${type}"
    $trigger = New-ScheduledTaskTrigger -Daily -At "${expected.time}"
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    Register-ScheduledTask -Action $action -Trigger $trigger -Settings $settings -TaskName "${expected.taskName}" -Description "Local AI ${type} routine reminder" -Force | Out-Null
    Write-Output "Successfully repaired ${expected.taskName}"
  `;

  try {
    const { stdout } = await execa(PATHS.powershell, ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', psCommand]);
    return { success: true, stdout };
  } catch (err: any) {
    throw new Error('Failed to repair task: ' + err.message);
  }
}

export async function repairAllMissingOrBrokenReminderTasks() {
  const { repairPlans } = await auditReminderScheduledTasks(true); // dry run
  const repairedTasks = [];
  const skippedTasks = [];

  for (const plan of repairPlans) {
    if (plan.needsRepair && plan.safeToRepair) {
      await repairReminderTask(plan.type);
      repairedTasks.push(plan.taskName);
    } else {
      skippedTasks.push(plan.taskName);
    }
  }

  return {
    repairedTasks,
    skippedTasks
  };
}

export async function toggleReminderTask(type: string, enable: boolean) {
  const expected = EXPECTED_SCHEDULE.find(t => t.type === type);
  if (!expected) throw new Error(`Type ${type} is not an allowlisted reminder task.`);

  const cmd = enable ? `Enable-ScheduledTask -TaskName "${expected.taskName}"` : `Disable-ScheduledTask -TaskName "${expected.taskName}"`;
  
  try {
    await execa(PATHS.powershell, ['-ExecutionPolicy', 'Bypass', '-NoProfile', '-Command', cmd]);
    return true;
  } catch (err: any) {
    throw new Error(`Failed to ${enable ? 'enable' : 'disable'} task: ` + err.message);
  }
}

