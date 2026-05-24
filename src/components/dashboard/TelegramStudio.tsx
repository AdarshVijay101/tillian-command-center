import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { MessageSquare, Send, Save, RefreshCw, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';
import { api } from '../../services/api';

export const TelegramStudio = () => {
  const { isDemoMode } = useDemoMode();
  const [types, setTypes] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const [overrideText, setOverrideText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    const loadTypes = async () => {
      const res = await api.getTelegramMessageTypes();
      if (res.ok) {
        const data = res.data as string[];
        setTypes(data);
        if (data.length > 0) handleSelectType(data[0]);
      }
    };
    loadTypes();
  }, []);

  const handleSelectType = async (type: string) => {
    setSelectedType(type);
    setLoading(true);
    const res = await api.getTelegramMessagePreview(type);
    if (res.ok) {
      const data = res.data as any;
      setPreview(data.default_preview);
      setOverrideText(data.current_override || data.default_template);
    }
    setLoading(false);
  };

  const showToast = (msg: string, type: 'success' | 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async () => {
    setLoading(true);
    const res = await api.saveTelegramMessageOverride(selectedType, overrideText);
    setLoading(false);
    if (res.ok) {
      showToast('Override saved successfully.', 'success');
      handleSelectType(selectedType); // Refresh preview
    } else {
      showToast('Failed to save override.', 'error');
    }
  };

  const handleReset = async () => {
    setLoading(true);
    const res = await api.resetTelegramMessageOverride(selectedType);
    setLoading(false);
    if (res.ok) {
      showToast('Reset to default template.', 'success');
      handleSelectType(selectedType);
    } else {
      showToast('Failed to reset.', 'error');
    }
  };

  const handleTestSend = async () => {
    setLoading(true);
    const res = await api.sendTelegramTestMessage(selectedType, overrideText);
    setLoading(false);
    if (res.ok) {
      showToast('Test message sent to Telegram!', 'success');
    } else {
      showToast('Failed to send test message.', 'error');
    }
  };

  const insertHelper = (helper: string) => {
    setOverrideText(prev => prev + '\n' + helper);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090b] text-gray-100 min-h-screen relative">
      {toast && (
        <div className={`absolute top-4 right-8 px-4 py-2 rounded-lg shadow-lg font-medium text-sm flex items-center gap-2 z-50 ${toast.type === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
          {toast.type === 'success' ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      <div className="max-w-5xl mx-auto space-y-8 pb-24">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center border border-blue-500/30">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Telegram Studio</h1>
          </div>
          <p className="text-gray-400">Design, preview, and test Local AI notification payloads.</p>
        </div>

        {isDemoMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <p className="text-amber-300 text-sm">DEMO MODE â€” Messages will not actually be sent to Telegram.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Sidebar */}
          <GlassCard className="p-4 border-white/10 h-fit">
            <h3 className="text-sm font-medium text-gray-400 mb-3 uppercase tracking-wider">Message Types</h3>
            <div className="space-y-1">
              {types.length === 0 && <div className="text-xs text-gray-500 p-2">Loading types...</div>}
              {types.map(t => (
                <button 
                  key={t}
                  onClick={() => handleSelectType(t)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedType === t ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
                >
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Editor Area */}
          <div className="space-y-6">
            
            {/* Editor */}
            <GlassCard className="p-6 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-white capitalize">{selectedType.replace(/_/g, ' ')} Template</h2>
                <div className="flex items-center gap-2">
                  <button onClick={handleReset} disabled={loading} className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded transition-colors flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Reset Default
                  </button>
                  <button onClick={handleSave} disabled={loading} className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-medium rounded transition-colors flex items-center gap-1">
                    <Save className="w-3 h-3" /> Save Override
                  </button>
                </div>
              </div>

              <textarea 
                value={overrideText}
                onChange={e => setOverrideText(e.target.value)}
                className="w-full h-48 bg-black/40 border border-white/10 rounded-lg p-4 text-gray-200 font-mono text-sm focus:border-blue-500/50 outline-none resize-y"
                placeholder="Write your template here... use {{variables}} if supported."
              />

              <div className="mt-4 pt-4 border-t border-white/5">
                <div className="bg-white/5 border border-white/10 p-3 rounded-lg mb-4 text-sm text-gray-400">
                  <span className="text-white font-medium">AI Tone Rewrite</span> is currently unavailable (OpenClaw Control Plane is read-only in Phase 18).
                </div>
                <div className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Local Template Helpers</div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => insertHelper("Please keep it short.")} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300">Make shorter</button>
                  <button onClick={() => insertHelper("Tone: Warm and encouraging.")} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300">Make warmer</button>
                  <button onClick={() => insertHelper("Tone: Strict military execution.")} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300">Make strict</button>
                  <button onClick={() => insertHelper("{{protocol_steps}}")} className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-xs text-gray-300">Insert Protocol Steps</button>
                </div>
              </div>
            </GlassCard>

            {/* Preview & Test Send */}
            <GlassCard className="p-6 border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wider">Live Payload Preview</h3>
                <button onClick={handleTestSend} disabled={loading} className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 border border-blue-500/30">
                  <Send className="w-4 h-4" /> Send Test Message
                </button>
              </div>
              <div className="bg-black/60 border border-white/5 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/50" />
                <div className="pl-3 whitespace-pre-wrap font-mono text-sm text-gray-300">
                  {preview || 'No preview available.'}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Token remains outside Node/React boundary (PowerShell execution).
              </p>
            </GlassCard>

          </div>
        </div>
      </div>
    </div>
  );
};

