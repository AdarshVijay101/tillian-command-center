import { useState, useEffect } from 'react';
import { Search, Activity, Clock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useDemoMode } from '../../hooks/useDemoMode';
import { CommandPalette } from '../ui/CommandPalette';

export const TopBar = () => {
  const [time, setTime] = useState(new Date());
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const [cmdOpen, setCmdOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCmdOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="w-full h-20 px-8 flex items-center justify-between border-b border-white/5">
      
      {/* Command Palette Search */}
      <button 
        onClick={() => setCmdOpen(true)}
        className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white/50 transition-colors w-64 backdrop-blur-md group"
      >
        <Search size={16} className="text-white/30 group-hover:text-primary transition-colors" />
        <span>Command...</span>
        <div className="ml-auto flex gap-1">
          <kbd className="bg-white/10 px-1.5 rounded text-xs">⌘</kbd>
          <kbd className="bg-white/10 px-1.5 rounded text-xs">K</kbd>
        </div>
      </button>

      <CommandPalette isOpen={cmdOpen} onClose={() => setCmdOpen(false)} />

      {/* Center - System Mode */}
      <div className="flex items-center gap-4">
        <button 
          onClick={toggleDemoMode}
          className={`px-4 py-1.5 rounded-full border text-xs font-display font-semibold tracking-widest flex items-center gap-2 transition-all cursor-pointer ${
            isDemoMode 
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20' 
              : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/20'
          }`}
        >
          {isDemoMode ? (
            <>
              <ShieldAlert size={14} className="animate-pulse" />
              DEMO MODE — SIMULATED
            </>
          ) : (
            <>
              <ShieldCheck size={14} />
              LOCAL LIVE MODE
            </>
          )}
        </button>
        {isDemoMode && (
          <span className="text-[10px] uppercase tracking-widest text-amber-500/50">
            No real scripts will run
          </span>
        )}
      </div>

      {/* Right - AI Status & Clock */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2 text-xs font-display tracking-widest text-emerald-400">
          <Activity size={14} />
          AI CORE ONLINE
        </div>
        
        <div className="flex items-center gap-2 text-white/60 font-display text-sm tracking-widest">
          <Clock size={14} />
          {time.toLocaleTimeString([], { hour12: true, hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

    </div>
  );
};
