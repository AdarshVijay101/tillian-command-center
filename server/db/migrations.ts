import { upsertRun } from './runRepository';
import { getRuns } from '../actionRunService';

export const migrateJsonToSqlite = async () => {
  try {
    const runs = await getRuns();
    if (!runs || runs.length === 0) return 0;
    
    let count = 0;
    for (const run of runs) {
      upsertRun(run);
      count++;
    }
    return count;
  } catch (error) {
    console.error('Migration error:', error);
    return 0;
  }
};
