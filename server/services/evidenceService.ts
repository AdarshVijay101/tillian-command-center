import { getArtifactReviewById, getArtifactReviewInbox } from '../db/artifactReviewRepository';
import { 
  createOrUpdateEvidenceNote, 
  getEvidenceStats, 
  getEvidenceNotes,
  createEvidencePackage,
  getEvidencePackages,
  getEvidencePackageById,
  updateEvidencePackageStatus,
  updateEvidencePackageMarkdown
} from '../db/evidenceRepository';

export const getDemoReadyArtifacts = () => {
  return getArtifactReviewInbox({ status: 'demo_ready' });
};

export const suggestEvidenceFromApprovedArtifact = (reviewId: string) => {
  const review = getArtifactReviewById(reviewId);
  if (!review) throw new Error('Artifact review not found');
  if (review.review_status !== 'approved' && review.review_status !== 'demo_ready') {
    throw new Error('Can only suggest evidence for approved or demo_ready artifacts');
  }

  // Generate a safe metadata-based suggestion without reading the file
  const suggestion = {
    artifact_review_id: review.id,
    evidence_type: inferEvidenceType(review.artifact_type),
    title: `Evidence: ${review.file_name}`,
    business_value: `Automatically processed ${review.artifact_type} providing workflow continuity.`,
    technical_value: `Local-first metadata generation, tracking human approval states.`,
    demo_safety_level: review.review_status === 'demo_ready' ? 'portfolio_ready' : 'safe_internal_demo',
    demo_talking_points: `Notice how this artifact was generated safely and reviewed by ${review.reviewer || 'a human'}.`,
    risks_or_redactions: 'Ensure local file paths are redacted in public previews.'
  };

  return suggestion;
};

const inferEvidenceType = (artifactType: string): string => {
  switch (artifactType) {
    case 'daily_plan':
    case 'morning_brief':
    case 'evening_review':
    case 'weekly_digest':
      return 'workflow_proof';
    case 'dynamic_adjustment':
      return 'automation_proof';
    default:
      return 'project_proof';
  }
};

export const redactLocalPaths = (text: string): string => {
  return text
    .replace(/[a-zA-Z]:\\[^\n"'`]+/g, '[REDACTED_LOCAL_PATH]')
    .replace(/\\\\[^\n"'`]+/g, '[REDACTED_LOCAL_PATH]')
    .replace(/\/mnt\/[a-zA-Z]\/[^\n"'`]+/g, '[REDACTED_LOCAL_PATH]')
    .replace(/\/home\/[^\n"'`]+/g, '[REDACTED_LOCAL_PATH]')
    .replace(/\/tmp\/[^\n"'`]+/g, '[REDACTED_LOCAL_PATH]');
};

export const buildEvidencePackageDraft = (title: string, description: string | null, artifactIds: string[]) => {
  if (!artifactIds || artifactIds.length === 0) {
    throw new Error('Must provide at least one artifact ID for the package');
  }

  const pkg = createEvidencePackage({
    title,
    description,
    artifact_ids_json: JSON.stringify(artifactIds),
    package_status: 'draft'
  });

  return pkg;
};

export const generateEvidenceSummaryMarkdown = (packageId: string) => {
  const pkg = getEvidencePackageById(packageId);
  if (!pkg) throw new Error('Evidence package not found');

  const artifactIds: string[] = JSON.parse(pkg.artifact_ids_json);
  
  let markdown = `# ${pkg.title}\n\n`;
  if (pkg.description) markdown += `${pkg.description}\n\n`;
  markdown += `*Generated: ${new Date().toISOString()}*\n\n`;
  markdown += `## Evidence Included\n\n`;

  for (const id of artifactIds) {
    const review = getArtifactReviewById(id);
    if (review) {
      markdown += `### Artifact: ${review.file_name}\n`;
      markdown += `- Type: ${review.artifact_type}\n`;
      markdown += `- Path: ${redactLocalPaths(review.file_path)}\n`;
      markdown += `- Status: ${review.review_status}\n\n`;
    }
  }

  markdown += `## Disclaimer\nThis package was safely generated from local metadata using Tillian Command Center.\n`;

  // Return dynamically without mutating database on GET request
  return markdown;
};

export const getEvidenceDashboard = () => {
  return {
    stats: getEvidenceStats(),
    demoReadyArtifacts: getDemoReadyArtifacts().slice(0, 10),
    recentNotes: getEvidenceNotes().slice(0, 5),
    recentPackages: getEvidencePackages().slice(0, 5)
  };
};
