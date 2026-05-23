import { useEffect, useState } from 'react';
import { ShieldCheck, Key, FileText, CheckCircle2, AlertTriangle, XCircle, Code, Copy } from 'lucide-react';
import { api } from '../../services/api';

export default function Release() {
  const [readiness, setReadiness] = useState<any>(null);
  const [checklist, setChecklist] = useState<any>(null);
  const [repoSafety, setRepoSafety] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const [readRes, checkRes, repoRes] = await Promise.all([
        api.getReleaseReadiness(),
        api.getReleaseChecklist(),
        api.getRepoSafety()
      ]);

      if (readRes.ok) setReadiness(readRes.data);
      if (checkRes.ok) setChecklist(checkRes.data);
      if (repoRes.ok) setRepoSafety(repoRes.data);
    };
    loadData();
  }, []);

  const copyDemoScript = () => {
    const text = `Tillian Command Center v1.0-local Demo Workflow:\n1. Open Tillian Dashboard on 127.0.0.1:5173\n2. Show Release Readiness Score\n3. Show Evidence UI and generate package\n4. Trigger Demo Mode from Navbar\n5. Prove safe action interception without secrets exposure.`;
    navigator.clipboard.writeText(text);
  };

  if (!readiness || !checklist || !repoSafety) {
    return <div className="text-white">Loading release data...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Release Readiness</h1>
        <p className="text-gray-400">Final release metrics and GitHub portfolio pack validation.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              Readiness Score
            </h3>
            <span className={`text-2xl font-bold ${readiness.readinessScore === 100 ? 'text-green-400' : readiness.readinessScore > 80 ? 'text-yellow-400' : 'text-red-400'}`}>
              {readiness.readinessScore}/100
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Recommendation</span>
              <span className={`px-2 py-0.5 rounded text-xs ${readiness.recommendation === 'READY' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{readiness.recommendation}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">App Version</span>
              <span className="text-white">{readiness.appVersion}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-400" />
              Repo Hygiene
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Secrets Audit</span>
              <span className={`px-2 py-0.5 rounded text-xs ${readiness.secretsAuditStatus === 'Secure' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{readiness.secretsAuditStatus}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Gitignore</span>
              <span className={`px-2 py-0.5 rounded text-xs ${readiness.gitignoreStatus === 'Secure' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{readiness.gitignoreStatus}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-400" />
              Documentation
            </h3>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-400">Status</span>
              <span className={`px-2 py-0.5 rounded text-xs ${readiness.documentationStatus === 'Complete' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>{readiness.documentationStatus}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-5">
          <h3 className="text-lg font-medium text-white mb-4">Safety Checklist</h3>
          <div className="space-y-3">
            {Object.entries(checklist).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{key}</span>
                {value ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {(readiness.blockers.length > 0 || readiness.warnings.length > 0) && (
            <div className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-5">
              <h3 className="text-lg font-medium text-white mb-4">Issues</h3>
              <div className="space-y-3">
                {readiness.blockers.map((b: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 p-2 rounded">
                    <XCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{b}</span>
                  </div>
                ))}
                {readiness.warnings.map((w: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 p-2 rounded">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-800/30 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-blue-100 flex items-center gap-2">
                <Code className="w-5 h-5 text-blue-400" />
                Final Demo Flow
              </h3>
              <button
                onClick={copyDemoScript}
                className="p-2 hover:bg-white/5 rounded transition-colors text-blue-300"
                title="Copy Demo Script Summary"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-blue-200/80 mb-4">
              Tillian is a local-first system. Use Demo Mode to safely show portfolio viewers how it works without mutating your underlying system or exposing secrets.
            </p>
            <div className="space-y-2 text-sm text-blue-200">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">1.</span>
                <p>Toggle <strong>Demo Mode</strong> from the top navigation bar.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">2.</span>
                <p>Navigate to <strong>Evidence</strong> and generate a portfolio package.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">3.</span>
                <p>Show <strong>Mission Control</strong> and safely trigger a simulated job.</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-blue-400 mt-0.5">4.</span>
                <p>Display this <strong>Release</strong> page to prove strict path and secret hygiene.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
