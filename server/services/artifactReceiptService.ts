import fs from 'fs/promises';
import path from 'path';
import { PATHS } from '../config';
import { getArtifactReviewById, addArtifactReviewEvent } from '../db/artifactReviewRepository';

export async function writeArtifactReviewReceipt(id: string, payload: any): Promise<{ success: boolean; receiptFileName: string }> {
  const review = getArtifactReviewById(id);
  if (!review) throw new Error('Artifact not found');

  const safeFileName = review.file_name.replace(/[^a-z0-9_-]/gi, '_');
  const receiptName = `receipt_${safeFileName}_${Date.now()}.md`;
  
  // Use canonical resolve and ensure we don't traverse directories
  const safeBaseName = path.basename(receiptName);
  const destPath = path.resolve(PATHS.dropFolder, safeBaseName);
  
  const relative = path.relative(path.resolve(PATHS.dropFolder), destPath);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('Path traversal detected');
  }

  const reviewStatus = String(payload.reviewStatus || review.review_status).replace(/"/g, "'");
  const rating = Number(payload.rating || review.rating || 0);
  const decisionReason = String(payload.decisionReason || review.decision_reason || '').replace(/"/g, "'");
  const reviewNotes = String(payload.reviewNotes || review.review_notes || 'No notes provided.');
  
  const receiptContent = `---
type: artifact_review_receipt
artifact_id: ${review.id}
file_name: "${review.file_name.replace(/"/g, "'")}"
review_status: "${reviewStatus}"
rating: ${rating}
decision_reason: "${decisionReason}"
date_written: "${new Date().toISOString()}"
---

# Review Notes
${reviewNotes}
`;

  // Use exclusive flag 'wx' to never overwrite
  await fs.writeFile(destPath, receiptContent, { encoding: 'utf-8', flag: 'wx' });
  
  addArtifactReviewEvent(id, `Receipt written to safe drop folder: ${safeBaseName}`);

  return { success: true, receiptFileName: safeBaseName };
}
