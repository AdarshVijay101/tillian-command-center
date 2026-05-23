import { 
  getArtifactReviewInbox, 
  getArtifactReviewById, 
  getArtifactReviewStats, 
  bulkSyncArtifactReviews, 
  updateArtifactReviewStatus, 
  addArtifactReviewEvent 
} from '../db/artifactReviewRepository';
import { getLatestFiles } from '../fileService';
import fs from 'fs';
import path from 'path';
import { PATHS } from '../config';

export const inferArtifactType = (fileName: string): string => {
  const lower = fileName.toLowerCase();
  if (lower.includes('daily_plan') || lower.includes('daily plan')) return 'daily_plan';
  if (lower.includes('morning_brief') || lower.includes('morning brief')) return 'morning_brief';
  if (lower.includes('evening_review') || lower.includes('evening review')) return 'evening_review';
  if (lower.includes('weekly_digest') || lower.includes('weekly digest')) return 'weekly_digest';
  if (lower.includes('dynamic_adjustment')) return 'dynamic_adjustment';
  if (lower.endsWith('.md')) return 'markdown_note';
  return 'unknown';
};

export const inferRelatedMission = (fileName: string): string | null => {
  const lower = fileName.toLowerCase();
  if (lower.includes('daily_plan')) return 'run_daily_planner';
  if (lower.includes('morning_brief')) return 'run_morning_brief';
  if (lower.includes('evening_review')) return 'run_evening_review';
  if (lower.includes('weekly_digest')) return 'run_weekly_digest';
  return null;
};

export const syncGeneratedFilesToReviewInbox = async () => {
  const files = await getLatestFiles(100);
  
  const filesToSync = files.map(f => ({
    full_path: f.fullPath,
    file_name: f.fileName,
    type: inferArtifactType(f.fileName)
  }));

  const newCount = bulkSyncArtifactReviews(filesToSync);
  return { success: true, syncedCount: newCount };
};

export const getReviewInbox = (filters?: { status?: string }) => {
  return getArtifactReviewInbox(filters);
};

export const getArtifactReviewDashboard = () => {
  return {
    stats: getArtifactReviewStats(),
    recent: getReviewInbox().slice(0, 5)
  };
};

export const previewArtifactForReview = (reviewId: string) => {
  const review = getArtifactReviewById(reviewId);
  if (!review) throw new Error('Artifact review not found');

  const filePath = review.file_path;
  
  // Safe preview roots check using canonical paths
  const resolvedPath = path.resolve(filePath);
  const dropRoot = path.resolve(PATHS.dropFolder);
  const processedRoot = path.resolve(PATHS.processedFolder);

  function isPathInside(childPath: string, parentPath: string): boolean {
    const relative = path.relative(parentPath, childPath);
    return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative);
  }

  const allowed = 
    isPathInside(resolvedPath, dropRoot) || 
    isPathInside(resolvedPath, processedRoot) ||
    resolvedPath === dropRoot ||
    resolvedPath === processedRoot;
  
  if (!allowed) {
    throw new Error('Unauthorized path: File is not in an allowed review directory.');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error('File no longer exists on disk');
  }

  // Cap size and lines
  const stat = fs.statSync(filePath);
  if (stat.size > 2 * 1024 * 1024) { // 2MB cap
    throw new Error('File too large to preview');
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const previewLines = lines.slice(0, 200);
  const isTruncated = lines.length > 200;

  return {
    id: review.id,
    fileName: review.file_name,
    content: previewLines.join('\n'),
    isTruncated,
    totalLines: lines.length
  };
};

export const submitArtifactReview = (reviewId: string, payload: {
  reviewStatus: string;
  rating?: number;
  reviewNotes?: string;
  decisionReason?: string;
}) => {
  const review = getArtifactReviewById(reviewId);
  if (!review) throw new Error('Artifact review not found');

  const validStatuses = ['pending', 'approved', 'rejected', 'needs_revision', 'archived', 'demo_ready'];
  if (!validStatuses.includes(payload.reviewStatus)) {
    throw new Error('Invalid review status');
  }

  const updated = updateArtifactReviewStatus(
    reviewId, 
    payload.reviewStatus, 
    payload.reviewNotes, 
    payload.rating, 
    payload.decisionReason
  );

  addArtifactReviewEvent(
    reviewId,
    'status_updated',
    `Status updated to ${payload.reviewStatus}`,
    payload
  );

  return updated;
};
