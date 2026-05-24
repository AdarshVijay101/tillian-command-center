import { useState, useEffect } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { Settings as SettingsIcon, ShieldCheck, ShieldAlert, Link, Folder, Trash2, Cpu, MessageSquare } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';
import { api } from '../../services/api';

export default function Settings() {
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const res = await api.getConfig();
      if (res.ok) setConfig(res.data);
    };
    load();
  }, []);

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#09090b] text-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8 pb-24">
        
        {/* Header */}
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gray-500/20 rounded-xl flex items-center justify-center border border-gray-500/30">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          </div>
          <p className="text-gray-400">Configure Tillian Command Center behavior and boundaries.</p>
        </div>

        {/* Global Demo Mode */}
        <GlassCard className="p-6 border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl ${isDemoMode ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isDemoMode ? <ShieldAlert className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
              </div>
              <div>
                <h3 className="text-lg font-medium text-white">System Operation Mode</h3>
                <p className="text-sm text-gray-400 mt-1 max-w-lg">
                  {isDemoMode 
                    ? 'Demo Mode is active. API responses are simulated, no real jobs will run, and the database will not be mutated.' 
                    : 'Local Live Mode is active. Tillian can run allowlisted local actions and database updates. OpenClaw must be started manually in WSL.'}
                </p>
              </div>
            </div>
            <button 
              onClick={toggleDemoMode}
              className={`px-6 py-2 rounded-xl font-medium transition-all ${
                isDemoMode 
                  ? 'bg-amber-500 hover:bg-amber-600 text-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {isDemoMode ? 'Disable Demo Mode' : 'Enable Demo Mode'}
            </button>
          </div>
        </GlassCard>

        {/* Core Config */}
        <GlassCard className="p-6 border-white/10">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Link className="w-5 h-5 text-cyan-400" /> Connection Endpoints
          </h3>
          <div className="space-y-4">
            <div className="grid grid-cols-[1fr_2fr] gap-4 p-3 bg-black/20 rounded-lg border border-white/5 items-center">
              <div className="text-sm font-medium text-gray-300">Backend API</div>
              <code className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded w-fit">
                {config?.BACKEND_URL || 'http://127.0.0.1:8787'}
              </code>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-4 p-3 bg-black/20 rounded-lg border border-white/5 items-center">
              <div className="text-sm font-medium text-gray-300">OpenClaw Gateway</div>
              <code className="text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded w-fit">
                {config?.OPENCLAW_URL || 'http://127.0.0.1:18789'}
              </code>
            </div>
            <div className="grid grid-cols-[1fr_2fr] gap-4 p-3 bg-black/20 rounded-lg border border-white/5 items-center">
              <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Folder className="w-4 h-4" /> Drop Folder
              </div>
              <code className="text-xs text-gray-400 bg-white/5 px-2 py-1 rounded w-fit">
                {config?.DROP_FOLDER || '[REDACTED_LOCAL_PATH]'}
              </code>
            </div>
          </div>
        </GlassCard>

        {/* Telegram Studio Shortcut */}
        <GlassCard className="p-6 border-white/10 cursor-pointer hover:bg-white/5 transition-colors" onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'telegram-studio' }))}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg"><MessageSquare className="w-5 h-5 text-blue-400" /></div>
              <div>
                <h3 className="text-lg font-medium text-white">Telegram Message Studio</h3>
                <p className="text-sm text-gray-400">Configure and test message overrides for your Telegram bot.</p>
              </div>
            </div>
            <span className="text-blue-400 text-sm font-medium">Open Studio &rarr;</span>
          </div>
        </GlassCard>

        {/* Maintenance */}
        <GlassCard className="p-6 border-white/10">
          <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-gray-400" /> Maintenance
          </h3>
          <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/5">
            <div>
              <div className="font-medium text-white">Clear UI Cache</div>
              <div className="text-xs text-gray-400">Clears local storage and reloads the Command Center.</div>
            </div>
            <button 
              onClick={() => { localStorage.clear(); window.location.reload(); }}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Clear Cache
            </button>
          </div>
        </GlassCard>

        <div className="text-center text-xs text-gray-500 pt-4">
          Tillian Command Center v1.0-local
        </div>

      </div>
    </div>
  );
}
