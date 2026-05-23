import { db } from './db';
import { randomUUID } from 'crypto';

export interface ArtifactEvidenceNote {
  id: string;
  artifact_review_id: string;
  evidence_type: string;
  title: string;
  business_value: string | null;
  technical_value: string | null;
  demo_safety_level: string;
  demo_talking_points: string | null;
  risks_or_redactions: string | null;
  created_at: string;
  updated_at: string;
}

export interface DemoEvidencePackage {
  id: string;
  title: string;
  description: string | null;
  package_status: string;
  artifact_ids_json: string;
  summary_markdown: string | null;
  created_at: string;
  updated_at: string;
}

export const createOrUpdateEvidenceNote = (note: Partial<ArtifactEvidenceNote> & { artifact_review_id: string }) => {
  const existing = getEvidenceNoteByArtifactReviewId(note.artifact_review_id);
  const now = new Date().toISOString();

  if (existing) {
    const stmt = db.prepare(`
      UPDATE artifact_evidence_notes
      SET
        evidence_type = @evidence_type,
        title = @title,
        business_value = @business_value,
        technical_value = @technical_value,
        demo_safety_level = @demo_safety_level,
        demo_talking_points = @demo_talking_points,
        risks_or_redactions = @risks_or_redactions,
        updated_at = @updated_at
      WHERE id = @id
    `);

    stmt.run({
      id: existing.id,
      evidence_type: note.evidence_type || existing.evidence_type,
      title: note.title || existing.title,
      business_value: note.business_value !== undefined ? note.business_value : existing.business_value,
      technical_value: note.technical_value !== undefined ? note.technical_value : existing.technical_value,
      demo_safety_level: note.demo_safety_level || existing.demo_safety_level,
      demo_talking_points: note.demo_talking_points !== undefined ? note.demo_talking_points : existing.demo_talking_points,
      risks_or_redactions: note.risks_or_redactions !== undefined ? note.risks_or_redactions : existing.risks_or_redactions,
      updated_at: now
    });

    return getEvidenceNoteByArtifactReviewId(note.artifact_review_id);
  } else {
    const id = randomUUID();
    const stmt = db.prepare(`
      INSERT INTO artifact_evidence_notes (
        id, artifact_review_id, evidence_type, title, business_value, technical_value,
        demo_safety_level, demo_talking_points, risks_or_redactions, created_at, updated_at
      ) VALUES (
        @id, @artifact_review_id, @evidence_type, @title, @business_value, @technical_value,
        @demo_safety_level, @demo_talking_points, @risks_or_redactions, @created_at, @updated_at
      )
    `);

    stmt.run({
      id,
      artifact_review_id: note.artifact_review_id,
      evidence_type: note.evidence_type || 'workflow_proof',
      title: note.title || 'Untitled Evidence',
      business_value: note.business_value || null,
      technical_value: note.technical_value || null,
      demo_safety_level: note.demo_safety_level || 'private_only',
      demo_talking_points: note.demo_talking_points || null,
      risks_or_redactions: note.risks_or_redactions || null,
      created_at: now,
      updated_at: now
    });

    return getEvidenceNoteByArtifactReviewId(note.artifact_review_id);
  }
};

export const getEvidenceNoteByArtifactReviewId = (reviewId: string): ArtifactEvidenceNote | undefined => {
  return db.prepare('SELECT * FROM artifact_evidence_notes WHERE artifact_review_id = ?').get(reviewId) as ArtifactEvidenceNote;
};

export const getEvidenceNotes = (filters?: { demo_safety_level?: string }): ArtifactEvidenceNote[] => {
  let query = 'SELECT * FROM artifact_evidence_notes';
  const params: any[] = [];

  if (filters?.demo_safety_level) {
    query += ' WHERE demo_safety_level = ?';
    params.push(filters.demo_safety_level);
  }

  query += ' ORDER BY updated_at DESC';
  return db.prepare(query).all(...params) as ArtifactEvidenceNote[];
};

export const getEvidenceStats = () => {
  const notesCount = (db.prepare('SELECT COUNT(*) as count FROM artifact_evidence_notes').get() as any).count;
  const packagesCount = (db.prepare('SELECT COUNT(*) as count FROM demo_evidence_packages').get() as any).count;
  
  const approvedArtifacts = (db.prepare('SELECT COUNT(*) as count FROM artifact_reviews WHERE review_status = ?').get('approved') as any).count;
  const demoReadyArtifacts = (db.prepare('SELECT COUNT(*) as count FROM artifact_reviews WHERE review_status = ?').get('demo_ready') as any).count;
  
  const portfolioReadyArtifacts = (db.prepare('SELECT COUNT(*) as count FROM artifact_evidence_notes WHERE demo_safety_level = ?').get('portfolio_ready') as any).count;
  const needsRedactionCount = (db.prepare('SELECT COUNT(*) as count FROM artifact_evidence_notes WHERE demo_safety_level = ?').get('needs_redaction') as any).count;

  return {
    approvedArtifacts,
    demoReadyArtifacts,
    portfolioReadyArtifacts,
    needsRedaction: needsRedactionCount,
    evidenceNotesCount: notesCount,
    packagesCount
  };
};

export const createEvidencePackage = (packageData: Partial<DemoEvidencePackage> & { title: string, artifact_ids_json: string }) => {
  const id = randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO demo_evidence_packages (
      id, title, description, package_status, artifact_ids_json, summary_markdown, created_at, updated_at
    ) VALUES (
      @id, @title, @description, @package_status, @artifact_ids_json, @summary_markdown, @created_at, @updated_at
    )
  `);

  stmt.run({
    id,
    title: packageData.title,
    description: packageData.description || null,
    package_status: packageData.package_status || 'draft',
    artifact_ids_json: packageData.artifact_ids_json,
    summary_markdown: packageData.summary_markdown || null,
    created_at: now,
    updated_at: now
  });

  return getEvidencePackageById(id);
};

export const getEvidencePackages = (): DemoEvidencePackage[] => {
  return db.prepare('SELECT * FROM demo_evidence_packages ORDER BY updated_at DESC').all() as DemoEvidencePackage[];
};

export const getEvidencePackageById = (id: string): DemoEvidencePackage | undefined => {
  return db.prepare('SELECT * FROM demo_evidence_packages WHERE id = ?').get(id) as DemoEvidencePackage;
};

export const updateEvidencePackageStatus = (id: string, status: string) => {
  db.prepare('UPDATE demo_evidence_packages SET package_status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), id);
  return getEvidencePackageById(id);
};

export const updateEvidencePackageMarkdown = (id: string, markdown: string) => {
  db.prepare('UPDATE demo_evidence_packages SET summary_markdown = ?, updated_at = ? WHERE id = ?').run(markdown, new Date().toISOString(), id);
  return getEvidencePackageById(id);
};
