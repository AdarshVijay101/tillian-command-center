import { db } from './db';
import { randomUUID } from 'crypto';

export interface ArtifactReview {
  id: string;
  file_path: string;
  file_name: string;
  artifact_type: string;
  related_job_id: string | null;
  related_action_run_id: string | null;
  review_status: string;
  reviewer: string | null;
  rating: number | null;
  review_notes: string | null;
  decision_reason: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ArtifactReviewEvent {
  id: string;
  artifact_review_id: string;
  event_type: string;
  message: string;
  metadata_json: string | null;
  created_at: string;
}

export const getArtifactReviewById = (id: string): ArtifactReview | null => {
  const stmt = db.prepare('SELECT * FROM artifact_reviews WHERE id = ?');
  return (stmt.get(id) as ArtifactReview) || null;
};

export const getArtifactReviewByPath = (filePath: string): ArtifactReview | null => {
  const stmt = db.prepare('SELECT * FROM artifact_reviews WHERE file_path = ?');
  return (stmt.get(filePath) as ArtifactReview) || null;
};

export const upsertArtifactReviewFromGeneratedFile = (
  file: { full_path: string; file_name: string },
  inferredType: string,
  relatedJobId: string | null = null,
  relatedActionRunId: string | null = null
): ArtifactReview => {
  const existing = getArtifactReviewByPath(file.full_path);
  const now = new Date().toISOString();

  if (existing) {
    let needsUpdate = false;
    let updateJob = existing.related_job_id;
    let updateRun = existing.related_action_run_id;

    if (!existing.related_job_id && relatedJobId) {
      updateJob = relatedJobId;
      needsUpdate = true;
    }
    if (!existing.related_action_run_id && relatedActionRunId) {
      updateRun = relatedActionRunId;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const stmt = db.prepare(`
        UPDATE artifact_reviews 
        SET related_job_id = ?, related_action_run_id = ?, updated_at = ?
        WHERE id = ?
      `);
      stmt.run(updateJob, updateRun, now, existing.id);
      return getArtifactReviewById(existing.id)!;
    }
    return existing;
  }

  const newId = randomUUID();
  const stmt = db.prepare(`
    INSERT INTO artifact_reviews (
      id, file_path, file_name, artifact_type, related_job_id, related_action_run_id,
      review_status, reviewer, rating, review_notes, decision_reason, reviewed_at,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NULL, NULL, NULL, NULL, NULL, ?, ?)
  `);

  stmt.run(
    newId,
    file.full_path,
    file.file_name,
    inferredType,
    relatedJobId,
    relatedActionRunId,
    now,
    now
  );

  return getArtifactReviewById(newId)!;
};

export const getArtifactReviewInbox = (filters?: { status?: string }): ArtifactReview[] => {
  if (filters?.status) {
    const stmt = db.prepare('SELECT * FROM artifact_reviews WHERE review_status = ? ORDER BY created_at DESC');
    return stmt.all(filters.status) as ArtifactReview[];
  }
  const stmt = db.prepare('SELECT * FROM artifact_reviews ORDER BY created_at DESC');
  return stmt.all() as ArtifactReview[];
};

export const updateArtifactReviewStatus = (
  id: string,
  status: string,
  notes?: string,
  rating?: number,
  decisionReason?: string
): ArtifactReview => {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE artifact_reviews 
    SET review_status = ?, review_notes = ?, rating = ?, decision_reason = ?, reviewer = 'Adarsh', reviewed_at = ?, updated_at = ?
    WHERE id = ?
  `);
  stmt.run(status, notes || null, rating || null, decisionReason || null, now, now, id);
  return getArtifactReviewById(id)!;
};

export const addArtifactReviewEvent = (
  reviewId: string,
  eventType: string,
  message: string,
  metadata?: any
): ArtifactReviewEvent => {
  const id = randomUUID();
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO artifact_review_events (id, artifact_review_id, event_type, message, metadata_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(id, reviewId, eventType, message, metadata ? JSON.stringify(metadata) : null, now);
  
  const getStmt = db.prepare('SELECT * FROM artifact_review_events WHERE id = ?');
  return getStmt.get(id) as ArtifactReviewEvent;
};

export const getArtifactReviewEvents = (reviewId: string): ArtifactReviewEvent[] => {
  const stmt = db.prepare('SELECT * FROM artifact_review_events WHERE artifact_review_id = ? ORDER BY created_at ASC');
  return stmt.all(reviewId) as ArtifactReviewEvent[];
};

export const getArtifactReviewStats = () => {
  const counts = db.prepare(`
    SELECT review_status, COUNT(*) as count 
    FROM artifact_reviews 
    GROUP BY review_status
  `).all() as { review_status: string, count: number }[];

  let pendingCount = 0;
  let approvedCount = 0;
  let needsRevisionCount = 0;
  let rejectedCount = 0;
  let demoReadyCount = 0;

  for (const c of counts) {
    if (c.review_status === 'pending') pendingCount = c.count;
    if (c.review_status === 'approved') approvedCount = c.count;
    if (c.review_status === 'needs_revision') needsRevisionCount = c.count;
    if (c.review_status === 'rejected') rejectedCount = c.count;
    if (c.review_status === 'demo_ready') demoReadyCount = c.count;
  }

  const todayStr = new Date().toISOString().split('T')[0];
  
  const generatedToday = (db.prepare(`
    SELECT COUNT(*) as count FROM artifact_reviews WHERE created_at LIKE ?
  `).get(`${todayStr}%`) as any).count;

  const reviewedToday = (db.prepare(`
    SELECT COUNT(*) as count FROM artifact_reviews WHERE reviewed_at LIKE ?
  `).get(`${todayStr}%`) as any).count;

  const oldestPendingArtifact = db.prepare(`
    SELECT created_at FROM artifact_reviews WHERE review_status = 'pending' ORDER BY created_at ASC LIMIT 1
  `).get() as any;

  return {
    pendingCount,
    approvedCount,
    needsRevisionCount,
    rejectedCount,
    demoReadyCount,
    generatedToday,
    reviewedToday,
    oldestPendingArtifact: oldestPendingArtifact ? oldestPendingArtifact.created_at : null
  };
};

export const linkArtifactToJob = (reviewId: string, jobId: string) => {
  const now = new Date().toISOString();
  const stmt = db.prepare('UPDATE artifact_reviews SET related_job_id = ?, updated_at = ? WHERE id = ?');
  stmt.run(jobId, now, reviewId);
};

export const bulkSyncArtifactReviews = (files: { full_path: string; file_name: string; type?: string }[]) => {
  let newCount = 0;
  for (const file of files) {
    const existing = getArtifactReviewByPath(file.full_path);
    if (!existing) {
      const type = file.type || 'unknown';
      upsertArtifactReviewFromGeneratedFile(file, type);
      newCount++;
    }
  }
  return newCount;
};
