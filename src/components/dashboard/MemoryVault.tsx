import React, { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Database, FileText, Eye, Copy, RefreshCw, Loader2 } from 'lucide-react';
import { useLatestFiles } from '../../hooks/useData';
import { api } from '../../services/api';

export const MemoryVault: React.FC = () => {
  const { data: files, loading, refetch } = useLatestFiles(30000);
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handlePreview = async (path: string, fileName: string) => {
    setPreviewLoading(true);
    setPreviewFile(fileName);
    const res = await api.previewFile(path);
    if (res.ok) {
      setPreviewContent(res.data as string);
    } else {
      setPreviewContent(`[ERROR] ${res.error}`);
    }
    setPreviewLoading(false);
  };

  const copyPath = (path: string) => {
    navigator.clipboard.writeText(path);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={24} className="text-white/80" />
          <h2 className="text-2xl font-display font-semibold text-white tracking-wide">Memory Vault</h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => document.querySelector<HTMLButtonElement>('[title="REVIEW INBOX"]')?.click()}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium transition-colors border border-indigo-500/30 flex items-center gap-2"
          >
            <FileText size={16} />
            Review Inbox
          </button>
          <button onClick={refetch} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
            <RefreshCw size={18} className={loading ? "animate-spin text-white/50" : "text-white/50"} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file, idx) => (
          <GlassCard key={idx} glowColor="blue" className="p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <FileText size={18} className="text-blue-400" />
                <span className="text-xs uppercase tracking-widest text-blue-400 font-display font-semibold truncate">
                  {file.type.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-sm text-white/80 font-mono truncate mb-1" title={file.fileName}>{file.fileName}</p>
              <p className="text-xs text-white/40 mb-4">{new Date(file.lastWriteTime).toLocaleString()}</p>
            </div>
            
            <div className="flex gap-2 border-t border-white/5 pt-4">
              <button 
                onClick={() => handlePreview(file.fullPath, file.fileName)}
                className="flex-1 py-1.5 flex items-center justify-center gap-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Eye size={14} /> Preview
              </button>
              <button 
                onClick={() => copyPath(file.fullPath)}
                className="flex-1 py-1.5 flex items-center justify-center gap-2 text-xs text-white/60 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Copy size={14} /> Copy Path
              </button>
            </div>
          </GlassCard>
        ))}
        {files.length === 0 && !loading && (
          <div className="col-span-full p-8 text-center text-white/40 border border-dashed border-white/10 rounded-3xl">
            No files found in authorized drop zones.
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewFile && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-[#0B1026] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-full">
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
              <span className="font-mono text-sm text-white/80">{previewFile}</span>
              <button onClick={() => setPreviewFile(null)} className="text-white/50 hover:text-white">Close</button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-white/70 whitespace-pre-wrap">
              {previewLoading ? <Loader2 className="animate-spin text-primary mx-auto" /> : previewContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
