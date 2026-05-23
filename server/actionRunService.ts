import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { upsertRun } from './db/runRepository';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface RunRecord {
  id: string;
  actionId: string;
  actionLabel: string;
  category: string;
  startedAt: string;
  endedAt?: string;
  durationMs?: number;
  status: 'running' | 'success' | 'error' | 'timeout';
  stdout?: string;
  stderr?: string;
  sanitizedOutput?: string;
  endpoint: string;
  triggeredBy: string;
  relatedFileCandidates?: string[];
  notes?: string;
}

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'action-runs.json');
const ARCHIVE_FILE = path.join(DATA_DIR, 'action-runs.archive.json');

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try { await fs.access(DATA_FILE); } catch { await fs.writeFile(DATA_FILE, JSON.stringify([])); }
    try { await fs.access(ARCHIVE_FILE); } catch { await fs.writeFile(ARCHIVE_FILE, JSON.stringify([])); }
  } catch (err) {
    console.error('Failed to initialize action runs ledger:', err);
  }
}

export async function getRuns(): Promise<RunRecord[]> {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    const runs = JSON.parse(data) as RunRecord[];
    // Newest first
    return runs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  } catch (err) {
    console.error('Error reading action runs:', err);
    return [];
  }
}

export async function getRun(id: string): Promise<RunRecord | null> {
  const runs = await getRuns();
  return runs.find(r => r.id === id) || null;
}

export async function createRun(record: Omit<RunRecord, 'id' | 'startedAt'>): Promise<RunRecord> {
  await ensureDataFile();
  // We want to work with the raw file to manage rotation
  let data = await fs.readFile(DATA_FILE, 'utf-8');
  let runs = JSON.parse(data) as RunRecord[];
  
  const newRun: RunRecord = {
    ...record,
    id: crypto.randomUUID(),
    startedAt: new Date().toISOString()
  };
  
  runs.push(newRun);
  
  // Rotate if over 500
  if (runs.length > 500) {
    const toArchive = runs.slice(0, runs.length - 500);
    runs = runs.slice(runs.length - 500);
    
    try {
      const archiveData = await fs.readFile(ARCHIVE_FILE, 'utf-8');
      const archive = JSON.parse(archiveData) as RunRecord[];
      archive.push(...toArchive);
      await fs.writeFile(ARCHIVE_FILE, JSON.stringify(archive, null, 2));
    } catch (err) {
      console.error('Error writing archive:', err);
    }
  }
  
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(runs, null, 2));
    // SQLite dual-write
    try {
      upsertRun(newRun);
    } catch (dbErr) {
      console.error('Failed to dual-write run to SQLite:', dbErr);
    }
  } catch (err) {
    console.error('Error writing action run:', err);
  }
  
  return newRun;
}

export async function updateRun(id: string, updates: Partial<Omit<RunRecord, 'id'>>): Promise<RunRecord | null> {
  await ensureDataFile();
  let data = await fs.readFile(DATA_FILE, 'utf-8');
  let runs = JSON.parse(data) as RunRecord[];
  
  const index = runs.findIndex(r => r.id === id);
  if (index === -1) return null;
  
  runs[index] = { ...runs[index], ...updates };
  
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(runs, null, 2));
    // SQLite dual-write
    try {
      upsertRun(runs[index]);
    } catch (dbErr) {
      console.error('Failed to dual-write updated run to SQLite:', dbErr);
    }
  } catch (err) {
    console.error('Error updating action run:', err);
  }
  
  return runs[index];
}

export async function clearRuns(): Promise<void> {
  await ensureDataFile();
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify([]));
  } catch (err) {
    console.error('Error clearing action runs:', err);
  }
}
