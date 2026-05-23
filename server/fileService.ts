import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import readline from 'readline';
import { PATHS } from './config';

export interface FileMetadata {
  fileName: string;
  fullPath: string;
  type: string;
  lastWriteTime: Date;
  length: number;
  location: 'drop' | 'processed';
}

const FILE_TYPES = [
  { id: 'notion_task_snapshot', match: /notion.*snapshot/i },
  { id: 'ai_generated_daily_combined_plan', match: /daily.*combined.*plan/i },
  { id: 'ai_generated_morning_brief_from_notion', match: /morning.*brief/i },
  { id: 'ai_generated_evening_review_from_notion', match: /evening.*review/i },
  { id: 'ai_generated_weekly_digest_from_notion', match: /weekly.*digest/i },
  { id: 'dynamic_adjustment', match: /dynamic.*adjustment/i },
  { id: 'openclaw_tillian_ai_final_runbook', match: /openclaw.*runbook/i },
];

async function scanFolder(folderPath: string, location: 'drop' | 'processed'): Promise<FileMetadata[]> {
  try {
    const files = await fs.readdir(folderPath);
    const metadata: FileMetadata[] = [];

    for (const file of files) {
      const fullPath = path.join(folderPath, file);
      try {
        const stats = await fs.stat(fullPath);
        if (stats.isFile()) {
          // Determine type
          let type = 'unknown';
          for (const ft of FILE_TYPES) {
            if (ft.match.test(file)) {
              type = ft.id;
              break;
            }
          }

          metadata.push({
            fileName: file,
            fullPath,
            type,
            lastWriteTime: stats.mtime,
            length: stats.size,
            location
          });
        }
      } catch (err) {
        // Skip inaccessible files
      }
    }
    return metadata;
  } catch (err) {
    // Return empty if folder doesn't exist or is inaccessible
    return [];
  }
}

export async function getLatestFiles(): Promise<FileMetadata[]> {
  const dropFiles = await scanFolder(PATHS.dropFolder, 'drop');
  const processedFiles = await scanFolder(PATHS.processedFolder, 'processed');
  
  const allFiles = [...dropFiles, ...processedFiles];
  
  // Sort descending by time
  allFiles.sort((a, b) => b.lastWriteTime.getTime() - a.lastWriteTime.getTime());

  // Group by type and take latest
  const latestByType = new Map<string, FileMetadata>();
  for (const file of allFiles) {
    if (file.type !== 'unknown' && !latestByType.has(file.type)) {
      latestByType.set(file.type, file);
    }
  }

  return Array.from(latestByType.values());
}

export async function previewFile(targetPath: string): Promise<string> {
  // Security checks
  const resolvedPath = path.resolve(targetPath);
  const isDrop = resolvedPath.startsWith(path.resolve(PATHS.dropFolder));
  const isProcessed = resolvedPath.startsWith(path.resolve(PATHS.processedFolder));

  if (!isDrop && !isProcessed) {
    throw new Error('Unauthorized path. Can only preview files in authorized drop folders.');
  }

  return new Promise((resolve, reject) => {
    let lines: string[] = [];
    const fileStream = createReadStream(resolvedPath, { encoding: 'utf-8' });
    const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

    let count = 0;
    rl.on('line', (line) => {
      if (count < 200) {
        lines.push(line);
        count++;
      } else {
        rl.close();
        fileStream.destroy();
      }
    });

    rl.on('close', () => {
      if (count >= 200) {
        lines.push('\n... [TRUNCATED AT 200 LINES] ...');
      }
      resolve(lines.join('\n'));
    });

    fileStream.on('error', (err) => {
      reject(err);
    });
  });
}
