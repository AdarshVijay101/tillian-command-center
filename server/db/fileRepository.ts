import { db } from './db';
import crypto from 'crypto';

const insertFileStmt = db.prepare(`
  INSERT INTO generated_files (
    id, file_name, full_path, type, location, length, last_write_time, detected_at
  ) VALUES (
    @id, @file_name, @full_path, @type, @location, @length, @last_write_time, @detected_at
  )
  ON CONFLICT(id) DO UPDATE SET
    length=excluded.length,
    last_write_time=excluded.last_write_time,
    detected_at=excluded.detected_at
`);

export const upsertGeneratedFile = (file: any) => {
  insertFileStmt.run({
    id: crypto.createHash('md5').update(file.fullPath).digest('hex'),
    file_name: file.fileName || 'unknown',
    full_path: file.fullPath,
    type: file.type || 'markdown',
    location: file.location || 'unknown',
    length: file.length || 0,
    last_write_time: file.lastWriteTime instanceof Date ? file.lastWriteTime.toISOString() : String(file.lastWriteTime),
    detected_at: new Date().toISOString()
  });
};

export const getLatestGeneratedFiles = (limit = 10) => {
  return db.prepare('SELECT * FROM generated_files ORDER BY detected_at DESC LIMIT ?').all(limit);
};

export const getGeneratedFilesToday = () => {
  const today = new Date().toISOString().split('T')[0];
  return db.prepare('SELECT * FROM generated_files WHERE detected_at LIKE ?').all(today + '%');
};
