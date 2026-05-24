import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { api } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, XCircle, AlertTriangle, Play, RefreshCw, X } from 'lucide-react';
import { getIsDemoMode } from '../../hooks/useDemoMode';

export const ReviewInbox = () => {
  const [stats, setStats] = useState<any>(null);
  const [inbox, setInbox] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArtifact, setSelectedArtifact] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [decisionReason, setDecisionReason] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [refreshKey, setRefreshKey] = useState(0);
  const [events, setEvents] = useState<any[]>([]);
  const [evidenceSuggestion, setEvidenceSuggestion] = useState<any | null>(null);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const isDemo = getIsDemoMode();

  useEffect(() => {
    let mounted = true;
    const fetchInbox = async () => {
      try {
        const [statsRes, inboxRes] = await Promise.all([
          api.getArtifactReviewStats(),
          api.getArtifactReviewInbox(activeTab === 'all' ? undefined : activeTab)
        ]);
        
        if (mounted && statsRes.ok) setStats(statsRes.data);
        if (mounted && inboxRes.ok) setInbox(inboxRes.data as any[]);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchInbox();
  }, [activeTab, refreshKey]);

  useEffect(() => {
    if (!selectedArtifact) return;
    let mounted = true;
    const fetchPreview = async () => {
      const [prevRes, eventsRes] = await Promise.all([
        api.previewArtifact(selectedArtifact.id),
        api.getArtifactReviewEvents(selectedArtifact.id)
      ]);
      if (mounted && prevRes.ok) setPreviewData(prevRes.data);
      if (mounted && eventsRes.ok) setEvents(eventsRes.data as any[]);
    };
    fetchPreview();
  }, [selectedArtifact, refreshKey]);

  const refresh = () => setRefreshKey(k => k + 1);

  const handleSync = async () => {
    await api.syncArtifactReviews();
    refresh();
  };

  const handleReviewDecision = async (status: string) => {
    if (!selectedArtifact) return;
    const payload = {
      reviewStatus: status,
      rating: reviewRating || undefined,
      reviewNotes: reviewNotes || undefined,
      decisionReason: decisionReason || undefined
    };
    const res = await api.submitArtifactReview(selectedArtifact.id, payload);
    if (res.ok) {
      setSelectedArtifact(null);
      setPreviewData(null);
      setReviewNotes('');
      setReviewRating(0);
      setDecisionReason('');
      refresh();
    }
  };

  const handleSuggestEvidence = async () => {
    if (!selectedArtifact) return;
    try {
      const res = await api.suggestEvidenceNote(selectedArtifact.id);
      if (res.ok) {
        setEvidenceSuggestion(res.data);
      } else {
        showToast(res.error || 'Failed to suggest evidence', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveEvidence = async () => {
    if (!evidenceSuggestion) return;
    try {
      const res = await api.saveEvidenceNote(evidenceSuggestion);
      if (res.ok) {
        setEvidenceSuggestion(null);
        showToast('Evidence Note Saved Successfully', 'success');
      } else {
        showToast(res.error || 'Failed to save evidence note', 'error');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCopyNotes = () => {
    navigator.clipboard.writeText(reviewNotes);
    showToast('Review notes copied to clipboard', 'success');
  };

  const handleCreateRevisionJob = async () => {
    if (!selectedArtifact) return;
    const res = await api.createJob({
      title: `Revise ${selectedArtifact.file_name}`,
      jobType: 'run_revision',
      options: { artifact_id: selectedArtifact.id, notes: reviewNotes }
    });
    if (res.ok) {
      showToast('Revision job created successfully', 'success');
    } else {
      showToast('Failed to create revision job', 'error');
    }
  };

  const handleWriteReceipt = async () => {
    if (!selectedArtifact) return;
    const payload = {
      reviewStatus: selectedArtifact.review_status,
      rating: reviewRating || undefined,
      reviewNotes: reviewNotes || undefined,
      decisionReason: decisionReason || undefined
    };
    const res = await api.writeArtifactReviewReceipt(selectedArtifact.id, payload);
    if (res.ok) {
      showToast(`Receipt written as ${(res.data as any).receiptFileName}`, 'success');
    } else {
      showToast(res.error || 'Failed to write receipt', 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved': return 'text-emerald-400 bg-emerald-400/10';
      case 'rejected': return 'text-rose-400 bg-rose-400/10';
      case 'needs_revision': return 'text-amber-400 bg-amber-400/10';
      case 'demo_ready': return 'text-indigo-400 bg-indigo-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-6 relative">
      {toast && (
        <div className={`absolute top-0 right-0 px-4 py-2 rounded-lg shadow-lg font-medium text-sm flex items-center gap-2 z-50 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            Artifact Review Inbox
          </h2>
          <p className="text-sm text-gray-400">Human-in-the-loop approval memory for AI-generated artifacts</p>
          {isDemo && (
            <div className="mt-1 inline-flex items-center gap-2 px-2 py-0.5 rounded text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <AlertTriangle className="w-3 h-3" /> DEMO REVIEW INBOX - SIMULATED
            </div>
          )}
        </div>
        <button
          onClick={handleSync}
          className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg border border-slate-700/50 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Sync Inbox
        </button>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <GlassCard className="col-span-1 p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-300">{stats?.pendingCount || 0}</span>
          <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">Pending</span>
        </GlassCard>
        <GlassCard className="col-span-1 p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-emerald-400">{stats?.approvedCount || 0}</span>
          <span className="text-sm text-emerald-400/70 uppercase tracking-wider mt-1">Approved</span>
        </GlassCard>
        <GlassCard className="col-span-1 p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-amber-400">{stats?.needsRevisionCount || 0}</span>
          <span className="text-sm text-amber-400/70 uppercase tracking-wider mt-1">Needs Revision</span>
        </GlassCard>
        <GlassCard className="col-span-1 p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-indigo-400">{stats?.demoReadyCount || 0}</span>
          <span className="text-sm text-indigo-400/70 uppercase tracking-wider mt-1">Demo Ready</span>
        </GlassCard>
        <GlassCard className="col-span-1 p-4 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-300">{stats?.generatedToday || 0}</span>
          <span className="text-sm text-gray-400 uppercase tracking-wider mt-1">Generated Today</span>
        </GlassCard>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'needs_revision', 'demo_ready', 'all'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' : 'bg-slate-800/40 text-slate-400 hover:text-slate-300'}`}
          >
            {tab === 'needs_revision' ? 'Needs Revision' : tab === 'demo_ready' ? 'Demo Ready' : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-1 space-y-4">
          <GlassCard className="p-4">
            <h3 className="text-lg font-medium text-white mb-4">Inbox ({inbox.length})</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {loading && <div className="text-center py-4 text-slate-400 animate-pulse">Loading inbox...</div>}
              {!loading && inbox.length === 0 && <div className="text-center py-8 text-slate-500 text-sm">No artifacts found.</div>}
              
              <AnimatePresence>
                {inbox.map(artifact => (
                  <motion.div
                    key={artifact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={() => setSelectedArtifact(artifact)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedArtifact?.id === artifact.id 
                        ? 'bg-slate-800 border-indigo-500/50 ring-1 ring-indigo-500/50' 
                        : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm text-slate-200 truncate pr-2" title={artifact.file_name}>
                        {artifact.file_name}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-medium border border-transparent whitespace-nowrap ${getStatusColor(artifact.review_status)}`}>
                        {artifact.review_status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-400">
                      <span>{artifact.artifact_type}</span>
                      <span>{new Date(artifact.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </GlassCard>
        </div>

        <div className="col-span-1 lg:col-span-2">
          {selectedArtifact ? (
            <GlassCard className="p-0 overflow-hidden flex flex-col h-full border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]">
              <div className="p-4 border-b border-slate-700/50 bg-slate-800/80 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-white">{selectedArtifact.file_name}</h3>
                  <div className="flex gap-4 mt-1 text-sm text-slate-400">
                    <span>Type: {selectedArtifact.artifact_type}</span>
                    <span>Date: {new Date(selectedArtifact.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedArtifact(null)} className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 grid grid-cols-2 p-4 gap-4">
                <div className="col-span-2 lg:col-span-1 flex flex-col">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Artifact Preview</h4>
                  <div className="flex-1 bg-[#0f111a] rounded-lg border border-slate-800 overflow-y-auto custom-scrollbar p-3 max-h-[400px]">
                    {previewData ? (
                      <>
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">
                          {previewData.content}
                        </pre>
                        {previewData.isTruncated && (
                          <div className="mt-4 pt-4 border-t border-slate-800 text-center text-xs text-slate-500 italic">
                            -- Preview truncated (showing first 200 of {previewData.totalLines} lines) --
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-500 text-sm animate-pulse">Loading preview...</div>
                    )}
                  </div>
                </div>

                <div className="col-span-2 lg:col-span-1 flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium text-slate-300">Review Decision Panel</h4>
                    <p className="text-[10px] text-indigo-400/80 uppercase tracking-widest font-semibold border border-indigo-500/20 px-2 py-0.5 rounded bg-indigo-500/10">Updates metadata only. Does not modify Obsidian.</p>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Rating (1-5)</label>
                      <div className="flex gap-2">
                        {[1,2,3,4,5].map(r => (
                          <button 
                            key={r}
                            onClick={() => setReviewRating(r)}
                            className={`w-8 h-8 rounded flex items-center justify-center text-sm font-medium transition-colors ${reviewRating === r ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Decision Reason</label>
                      <input 
                        value={decisionReason}
                        onChange={e => setDecisionReason(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Why was this accepted/rejected?"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="block text-xs font-medium text-slate-400">Review Notes</label>
                        <button onClick={handleCopyNotes} className="text-[10px] text-slate-400 hover:text-slate-200">Copy Notes</button>
                      </div>
                      <textarea 
                        value={reviewNotes}
                        onChange={e => setReviewNotes(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors resize-none h-24"
                        placeholder="Any additional notes or feedback..."
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-slate-700/50 grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => handleReviewDecision('approved')}
                      className="flex items-center justify-center gap-2 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                    <button 
                      onClick={() => handleReviewDecision('demo_ready')}
                      className="flex items-center justify-center gap-2 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Play className="w-4 h-4" /> Demo Ready
                    </button>
                    <button 
                      onClick={() => handleReviewDecision('needs_revision')}
                      className="flex items-center justify-center gap-2 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <AlertTriangle className="w-4 h-4" /> Needs Revision
                    </button>
                    <button 
                      onClick={() => handleReviewDecision('rejected')}
                      className="flex items-center justify-center gap-2 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </div>

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button 
                      onClick={handleCreateRevisionJob}
                      className="flex items-center justify-center gap-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
                    >
                      Create Revision Job
                    </button>
                    <button 
                      onClick={handleWriteReceipt}
                      className="flex items-center justify-center gap-2 py-1.5 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium transition-colors"
                    >
                      Write Receipt to Drop
                    </button>
                  </div>
                </div>
              </div>

              {(selectedArtifact.review_status === 'approved' || selectedArtifact.review_status === 'demo_ready') && (
                <div className="px-4 pb-4">
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="text-sm font-medium text-purple-300">Demo Evidence Layer</h4>
                      {!evidenceSuggestion && (
                        <button 
                          onClick={handleSuggestEvidence}
                          className="px-3 py-1 bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 text-xs rounded transition-colors"
                        >
                          Suggest Evidence Note
                        </button>
                      )}
                    </div>
                    {evidenceSuggestion && (
                      <div className="space-y-3 mt-3">
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-gray-500 block mb-1">Title</span>
                            <input 
                              value={evidenceSuggestion.title}
                              onChange={e => setEvidenceSuggestion({...evidenceSuggestion, title: e.target.value})}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                            />
                          </div>
                          <div>
                            <span className="text-gray-500 block mb-1">Type</span>
                            <input 
                              value={evidenceSuggestion.evidence_type}
                              onChange={e => setEvidenceSuggestion({...evidenceSuggestion, evidence_type: e.target.value})}
                              className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-white"
                            />
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs block mb-1">Business Value</span>
                          <input 
                            value={evidenceSuggestion.business_value}
                            onChange={e => setEvidenceSuggestion({...evidenceSuggestion, business_value: e.target.value})}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                          />
                        </div>
                        <div className="flex justify-end gap-2 mt-2">
                          <button 
                            onClick={() => setEvidenceSuggestion(null)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors"
                          >
                            Cancel
                          </button>
                          <button 
                            onClick={handleSaveEvidence}
                            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
                          >
                            Save Evidence Note
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {events.length > 0 && (
                <div className="px-4 pb-4">
                  <h4 className="text-sm font-medium text-slate-300 mb-2">Event History</h4>
                  <div className="space-y-2 bg-slate-900/50 rounded-lg p-3 max-h-32 overflow-y-auto custom-scrollbar border border-slate-800">
                    {events.map((evt: any) => (
                      <div key={evt.id} className="text-xs flex gap-3">
                        <span className="text-slate-500 min-w-[60px]">{new Date(evt.created_at).toLocaleTimeString()}</span>
                        <span className="text-slate-300">{evt.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </GlassCard>
          ) : (
            <GlassCard className="h-full flex flex-col items-center justify-center p-8 text-center border border-dashed border-slate-700/50 bg-slate-800/20">
              <div className="w-16 h-16 rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-slate-500" />
              </div>
              <h3 className="text-xl font-medium text-slate-300 mb-2">No Artifact Selected</h3>
              <p className="text-slate-400 max-w-sm">
                Select an artifact from the inbox to preview its contents and submit a human review decision.
              </p>
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
};
