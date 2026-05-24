import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle, Package, AlertTriangle, Eye, Loader } from 'lucide-react';
import { api } from '../../services/api';

const Evidence: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [demoReady, setDemoReady] = useState<any[]>([]);
  const [approved, setApproved] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [packageMarkdown, setPackageMarkdown] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, demoRes, approvedRes, notesRes, pkgRes] = await Promise.all([
        api.getEvidenceStats(),
        api.getDemoReadyEvidence(),
        api.getApprovedEvidence(),
        api.getEvidenceNotes(),
        api.getEvidencePackages()
      ]);

      if (!statsRes.ok) throw new Error(statsRes.error || 'Failed to load stats');

      setStats(statsRes.data);
      setDemoReady((demoRes.data as any[]) || []);
      setApproved((approvedRes.data as any[]) || []);
      setNotes((notesRes.data as any[]) || []);
      setPackages((pkgRes.data as any[]) || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePackage = async () => {
    if (demoReady.length === 0) return alert('No demo-ready artifacts available to package.');
    
    try {
      const res = await api.createEvidencePackage({
        title: `Demo Package - ${new Date().toLocaleDateString()}`,
        description: 'Automatically generated evidence package.',
        artifactIds: demoReady.map(a => a.id)
      });
      if (res.ok) {
        loadData();
      } else {
        alert(res.error || 'Failed to create package');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleViewMarkdown = async (pkg: any) => {
    try {
      const res = await api.getEvidencePackageMarkdown(pkg.id);
      if (res.ok) {
        setSelectedPackage(pkg);
        setPackageMarkdown((res.data as any).markdown);
      } else {
        alert(res.error || 'Failed to load markdown');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-full">
        <Loader className="animate-spin text-purple-500 mr-3" />
        <span className="text-gray-400 font-mono">Loading Evidence Layer...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-md flex items-start">
          <AlertTriangle className="text-red-400 mr-3 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <h3 className="text-red-400 font-medium mb-1">Error Loading Evidence</h3>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center mb-2">
              <Shield className="text-purple-500 mr-3" size={28} />
              Evidence & Intelligence
            </h1>
            <p className="text-gray-400">
              Safe, metadata-only intelligence tracking for human-approved artifacts. Local paths are redacted in package generation.
            </p>
          </div>
          {packages.length > 0 && (
            <button
              onClick={async () => {
                const latest = packages[0];
                const res = await api.getEvidencePackageMarkdown(latest.id);
                if (res.ok) {
                  navigator.clipboard.writeText((res.data as any).markdown || (res.data as any));
                  alert('Portfolio Summary copied to clipboard!');
                }
              }}
              className="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 rounded flex items-center text-sm transition-colors"
            >
              <Package size={16} className="mr-2" />
              Copy Portfolio Summary
            </button>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg p-5">
            <div className="text-gray-500 text-sm font-medium mb-1">Approved Artifacts</div>
            <div className="text-3xl font-light text-white">{stats?.approvedArtifacts || 0}</div>
          </div>
          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg p-5">
            <div className="text-gray-500 text-sm font-medium mb-1">Demo Ready Artifacts</div>
            <div className="text-3xl font-light text-green-400">{stats?.demoReadyArtifacts || 0}</div>
          </div>
          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg p-5">
            <div className="text-gray-500 text-sm font-medium mb-1">Portfolio Ready</div>
            <div className="text-3xl font-light text-purple-400">{stats?.portfolioReadyArtifacts || 0}</div>
          </div>
          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg p-5">
            <div className="text-gray-500 text-sm font-medium mb-1">Risk / Redaction Needed</div>
            <div className="text-3xl font-light text-orange-400">{stats?.needsRedaction || 0}</div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-5 flex flex-col justify-center items-center text-center">
            <Shield className="text-emerald-400 mb-2" size={24} />
            <div className="text-emerald-400 text-sm font-medium">Path Redaction Active</div>
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Notes & Demo Ready */}
        <div className="space-y-8">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex flex-col gap-2">
              <h2 className="text-lg font-medium text-white flex items-center">
                <CheckCircle className="text-green-500 mr-2" size={18} />
                Artifact Status Layer
              </h2>
              <div className="text-xs text-gray-400 bg-white/5 p-2 rounded">
                <strong>Approved</strong> artifacts are private and kept for internal memory.<br/>
                <strong>Demo Ready</strong> artifacts are sanitized and available to be packaged into public portfolios.
              </div>
            </div>
            
            <div className="p-0">
              {approved.length > 0 && (
                <div className="bg-white/5 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Approved (Internal Only)</div>
              )}
              <ul className="divide-y divide-white/5">
                {approved.map(art => (
                  <li key={art.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                    <div>
                      <div className="text-white font-medium">{art.file_name || art.title}</div>
                      <div className="text-xs text-gray-500 mt-1">{art.artifact_type || 'Unknown'} &bull; {new Date(art.created_at).toLocaleString()}</div>
                    </div>
                    <button 
                      onClick={async () => {
                        await api.submitArtifactReview(art.id, { reviewStatus: 'demo_ready' });
                        loadData();
                      }}
                      className="px-3 py-1.5 bg-green-600/20 hover:bg-green-600/40 text-green-400 rounded text-xs transition-colors"
                    >
                      Promote to Demo Ready
                    </button>
                  </li>
                ))}
              </ul>

              <div className="bg-white/5 px-4 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">Demo Ready (Public Safe)</div>
              {demoReady.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No demo ready artifacts found.</div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {demoReady.map(art => (
                    <li key={art.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition-colors">
                      <div>
                        <div className="text-white font-medium">{art.file_name || art.title}</div>
                        <div className="text-xs text-gray-500 mt-1">{art.artifact_type || 'Unknown'} &bull; {new Date(art.created_at).toLocaleString()}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-lg font-medium text-white flex items-center">
                <FileText className="text-blue-500 mr-2" size={18} />
                Evidence Notes
              </h2>
            </div>
            <div className="p-0">
              {notes.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No evidence notes found.</div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {notes.map(note => (
                    <li key={note.id} className="p-4">
                      <div className="text-white font-medium mb-1">{note.title}</div>
                      <div className="text-sm text-gray-400 mb-2">{note.business_value}</div>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded">{note.evidence_type}</span>
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded">{note.demo_safety_level}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Packages */}
        <div className="space-y-8">
          <div className="bg-[#1C1C1E] border border-white/5 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-medium text-white flex items-center">
                <Package className="text-purple-500 mr-2" size={18} />
                Evidence Packages
              </h2>
              <button 
                onClick={handleCreatePackage}
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
              >
                Create Package
              </button>
            </div>
            <div className="p-0">
              {packages.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No evidence packages created.</div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {packages.map(pkg => (
                    <li key={pkg.id} className="p-4 flex flex-col hover:bg-white/5 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="text-white font-medium">{pkg.title}</div>
                          <div className="text-xs text-gray-500 mt-1">{new Date(pkg.created_at).toLocaleString()} &bull; Status: {pkg.package_status}</div>
                        </div>
                        <button 
                          onClick={() => handleViewMarkdown(pkg)}
                          className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors flex items-center"
                        >
                          <Eye size={12} className="mr-1" /> View Markdown
                        </button>
                      </div>
                      <div className="text-sm text-gray-400">{pkg.description}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {selectedPackage && packageMarkdown && (
            <div className="bg-[#1C1C1E] border border-white/5 rounded-lg overflow-hidden flex flex-col h-[400px]">
              <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#252529]">
                <h2 className="text-sm font-medium text-white">Markdown Preview: {selectedPackage.title}</h2>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(packageMarkdown);
                  }}
                  className="px-2 py-1 bg-blue-600/30 text-blue-400 hover:bg-blue-600/50 rounded text-xs transition-colors"
                >
                  Copy to Clipboard
                </button>
              </div>
              <div className="p-4 flex-1 overflow-y-auto">
                <pre className="text-xs text-gray-300 font-mono whitespace-pre-wrap">{packageMarkdown}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Evidence;
