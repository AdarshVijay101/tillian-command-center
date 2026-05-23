import { execa } from 'execa';
import { PATHS } from './config';

export interface CommandResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  error?: string;
  durationMs: number;
}

// Regex to redact things that look like tokens or API keys
// Example: sk-[a-zA-Z0-9]{48}, bot[0-9]{8,10}:[a-zA-Z0-9_-]{35}, secret_[a-zA-Z0-9]{40}
const REDACT_REGEX = /(sk-[a-zA-Z0-9]{32,})|(bot\d+:[a-zA-Z0-9_-]{35,})|(secret_[a-zA-Z0-9]{30,})|(ntn_[a-zA-Z0-9]{30,})/g;

function sanitize(text: string): string {
  if (!text) return '';
  return text.replace(REDACT_REGEX, '[REDACTED_TOKEN]');
}

export async function runScript(scriptPath: string, args: string[] = [], timeoutSeconds: number = 60): Promise<CommandResult> {
  const start = Date.now();
  
  try {
    const { stdout, stderr, exitCode } = await execa(PATHS.powershell, [
      '-ExecutionPolicy', 'Bypass',
      '-NoProfile',
      '-File', scriptPath,
      ...args
    ], {
      timeout: timeoutSeconds * 1000,
      all: true // interleaves stdout and stderr, but we can capture them separately
    });

    const durationMs = Date.now() - start;

    return {
      ok: exitCode === 0,
      stdout: sanitize(stdout),
      stderr: sanitize(stderr),
      durationMs
    };
  } catch (err: any) {
    const durationMs = Date.now() - start;
    
    // Handle execa timeout or throw
    const isTimeout = err.timedOut;
    
    return {
      ok: false,
      stdout: sanitize(err.stdout || ''),
      stderr: sanitize(err.stderr || ''),
      error: isTimeout ? `Action timed out after ${timeoutSeconds}s` : sanitize(err.message),
      durationMs
    };
  }
}
