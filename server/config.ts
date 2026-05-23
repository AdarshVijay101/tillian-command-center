import path from 'path';

// Backend Configuration
export const PORT = 8787;
export const HOST = '127.0.0.1'; // Localhost only

// Paths
export const PATHS = {
  powershell: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
  automationRoot: 'C:\\Users\\kadar\\OpenClawAutomation',
  inboxRoot: 'D:\\SECOND BRAIN\\Adarsh_Obsidian_Vault\\Adarsh Second Brain\\04_PROJECTS\\WinningEdge\\_AI_AGENT_INBOX',
  dropFolder: 'D:\\SECOND BRAIN\\Adarsh_Obsidian_Vault\\Adarsh Second Brain\\04_PROJECTS\\WinningEdge\\_AI_AGENT_INBOX\\_OPENCLAW_DROP',
  processedFolder: 'D:\\SECOND BRAIN\\Adarsh_Obsidian_Vault\\Adarsh Second Brain\\04_PROJECTS\\WinningEdge\\_AI_AGENT_INBOX\\_OPENCLAW_DROP\\_PROCESSED',
  watchersScript: 'D:\\SECOND BRAIN\\Adarsh_Obsidian_Vault\\automation\\Start-OpenClaw-Watchers.ps1',
};

// Allowlists
export const ALLOWED_SCRIPTS = {
  dailyPlanner: path.join(PATHS.automationRoot, 'Run-OpenClaw-Daily-Combined-Planner.ps1'),
  morningBrief: path.join(PATHS.automationRoot, 'Run-OpenClaw-AI-Morning-Brief.ps1'),
  eveningReview: path.join(PATHS.automationRoot, 'Run-OpenClaw-AI-Evening-Review.ps1'),
  weeklyDigest: path.join(PATHS.automationRoot, 'Run-OpenClaw-AI-Weekly-Digest.ps1'),
  routineReminder: path.join(PATHS.automationRoot, 'Send-Personal-Routine-Reminder-To-Telegram.ps1'),
  dynamicAdjustment: path.join(PATHS.automationRoot, 'Send-Dynamic-Day-Adjustment-To-Telegram.ps1'),
};

export const ALLOWED_ROUTINE_MODES = [
  'wake',
  'gym',
  'post_gym_bodycare',
  'morning_skincare',
  'study1',
  'study2',
  'study3',
  'evening_walk',
  'evening_cooking',
  'reading',
  'night_skincare',
  'sleep'
];

export const OPENCLAW_GATEWAY_URL = 'http://127.0.0.1:18789';

export const ALLOWED_DYNAMIC_MODES = [
  'late_wakeup',
  'tired',
  'skin_irritated',
  'employer_meeting',
  'skip_gym',
  'work_emergency'
];

export const ALLOWED_SCHEDULED_TASKS = [
  'Adarsh Daily Combined Planner Telegram',
  'Adarsh OpenClaw AI Morning Brief',
  'Adarsh OpenClaw AI Evening Review',
  'Adarsh OpenClaw AI Weekly Digest',
  'Adarsh Telegram Wake Reminder',
  'Adarsh Telegram Gym Reminder',
  'Adarsh Telegram Post Gym Body Care Reminder',
  'Adarsh Telegram Morning Skincare Reminder',
  'Adarsh Telegram Study Block 1 Reminder',
  'Adarsh Telegram Study Block 2 Reminder',
  'Adarsh Telegram Study Block 3 Reminder',
  'Adarsh Telegram Evening Walk Reminder',
  'Adarsh Telegram Evening Cooking Reminder',
  'Adarsh Telegram Night Skincare Reminder',
  'Adarsh Telegram Reading Reminder',
  'Adarsh Telegram Sleep Wind Down Reminder'
];

// Ports for Health Checks
export const PORTS = {
  openclawGateway: 18789,
  openclawBrowserServer: 18791,
};
