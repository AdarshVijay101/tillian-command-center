import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import type { ActionState } from '../../hooks/useAgentActions';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  actionName: string;
  state: ActionState;
  startTime: number | null;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export const ActionOutputDrawer: React.FC<DrawerProps> = ({ isOpen, onClose, actionName, state, startTime, onConfirm, onCancel }) => {
  
  const getDuration = () => {
    if (!startTime) return '';
    const end = state.isRunning ? Date.now() : (state.result?.durationMs ? startTime + state.result.durationMs : Date.now());
    return ((end - startTime) / 1000).toFixed(1) + 's';
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Drawer Panel */}
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 w-full md:w-[600px] h-full bg-[#070B1F]/95 backdrop-blur-2xl border-l border-white/10 z-50 flex flex-col shadow-[0_0_50px_rgba(34,211,238,0.1)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Terminal className="text-primary" size={20} />
                <h2 className="font-display font-semibold tracking-wide text-lg text-white">Mission Log</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                <X size={20} className="text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-display mb-1">Target Action</p>
                  <p className="text-lg font-medium text-white/90">{state.runRecord ? state.runRecord.actionLabel : actionName}</p>
                  {state.runRecord && (
                    <p className="text-[10px] text-white/30 font-mono mt-1 flex items-center gap-2">
                      <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{state.runRecord.id.slice(0,8)}</span>
                      {state.runRecord.category}
                    </p>
                  )}
                </div>
                
                <div className="text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-display mb-1">Status</p>
                  <div className="flex items-center justify-end gap-2">
                    {state.isPreflight && (
                      <><Loader2 size={14} className="animate-spin text-purple-400" /><span className="text-purple-400 text-sm tracking-widest">PREFLIGHT</span></>
                    )}
                    {state.isPreflightBlocked && (
                      <><AlertCircle size={14} className="text-red-400" /><span className="text-red-400 text-sm tracking-widest">BLOCKED</span></>
                    )}
                    {state.isPreflightPassed && (
                      <><CheckCircle2 size={14} className="text-emerald-400" /><span className="text-emerald-400 text-sm tracking-widest">CLEARED</span></>
                    )}
                    {state.isRunning && (
                      <><Loader2 size={14} className="animate-spin text-primary" /><span className="text-primary text-sm tracking-widest">RUNNING</span></>
                    )}
                    {state.isSuccess && (
                      <><CheckCircle2 size={14} className="text-emerald-400" /><span className="text-emerald-400 text-sm tracking-widest">SUCCESS</span></>
                    )}
                    {state.isError && (
                      <><AlertCircle size={14} className="text-red-400" /><span className="text-red-400 text-sm tracking-widest">{state.runRecord?.status?.toUpperCase() || 'FAILED'}</span></>
                    )}
                  </div>
                  {(startTime || state.runRecord?.startedAt) && !state.isPreflight && !state.isPreflightBlocked && !state.isPreflightPassed && (
                    <p className="text-xs text-white/40 mt-1">Duration: {state.runRecord?.durationMs ? (state.runRecord.durationMs / 1000).toFixed(1) + 's' : getDuration()}</p>
                  )}
                </div>
              </div>

              {/* Console Output */}
              <div className="flex-1 bg-[#02040A]/80 rounded-xl border border-primary/20 p-4 font-mono text-xs overflow-hidden flex flex-col shadow-[inset_0_0_20px_rgba(34,211,238,0.05)] relative group/console">
                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(34,211,238,0.05),transparent)]"></div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-primary/20 text-primary/60 uppercase tracking-widest relative z-10">
                  <span>Standard Output</span>
                  <button className="opacity-0 group-hover/console:opacity-100 transition-opacity hover:text-primary">Copy Log</button>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 relative z-10 custom-scrollbar pr-2">
                  {state.isPreflight && (
                    <div className="text-purple-400/80 animate-pulse flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping"></span>
                      Running preflight checks...
                    </div>
                  )}

                  {state.isPreflightBlocked && state.preflightData && (
                    <div className="space-y-4">
                      <div className="text-red-400 border-l-2 border-red-500/50 pl-3 bg-red-950/20 py-2 pr-2">
                        [PREFLIGHT_FAILED]: Dependencies missing or offline.
                      </div>
                      <div className="text-white/60">
                        Failed Checks: 
                        <ul className="list-disc pl-5 mt-1 text-red-300">
                          {state.preflightData.failedChecks.map((fc: string) => <li key={fc}>{fc}</li>)}
                        </ul>
                      </div>
                      {state.preflightData.fixCommands?.length > 0 && (
                        <div className="bg-black/50 p-3 rounded-lg border border-red-500/30">
                          <p className="text-[10px] uppercase tracking-widest text-red-400 mb-2">Required Fix</p>
                          <code className="text-white/80">{state.preflightData.fixCommands[0]}</code>
                        </div>
                      )}
                      <p className="text-xs text-white/40 italic">Check System Doctor for more details.</p>
                    </div>
                  )}

                  {state.isPreflightPassed && (
                    <div className="space-y-4">
                      <div className="text-emerald-400 border-l-2 border-emerald-500/50 pl-3 bg-emerald-950/20 py-2 pr-2">
                        [PREFLIGHT_PASSED]: All systems nominal.
                      </div>
                      <div className="text-white/80">Launch mission '{actionName}'?</div>
                      <div className="flex gap-3 pt-4 border-t border-white/5">
                        <button onClick={onConfirm} className="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded border border-primary/30 transition-colors">Launch Mission</button>
                        <button onClick={onCancel} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}

                  {state.isRunning && !state.runRecord?.sanitizedOutput && !state.isPreflight && (
                    <div className="text-primary/70 animate-pulse flex items-center gap-3">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-ping"></span>
                      Initializing execution protocol...
                    </div>
                  )}

                  {state.runRecord?.sanitizedOutput && (
                    <div className="text-white/80 whitespace-pre-wrap break-words">{state.runRecord.sanitizedOutput}</div>
                  )}
                  {!state.runRecord && state.result?.stdout && (
                    <div className="text-white/80 whitespace-pre-wrap break-words">{state.result.stdout}</div>
                  )}

                  {state.runRecord?.stderr && (
                    <div className="text-amber-400/90 whitespace-pre-wrap break-words border-l-2 border-amber-400/50 pl-3 bg-amber-950/20 py-2 pr-2">
                      {state.runRecord.stderr}
                    </div>
                  )}
                  {!state.runRecord && state.result?.stderr && (
                    <div className="text-amber-400/90 whitespace-pre-wrap break-words border-l-2 border-amber-400/50 pl-3 bg-amber-950/20 py-2 pr-2">
                      {state.result.stderr}
                    </div>
                  )}

                  {(state.runRecord?.error || state.error) && !state.isPreflightBlocked && (
                    <div className="text-red-400 whitespace-pre-wrap break-words border-l-2 border-red-500/50 pl-3 mt-4 bg-red-950/20 py-2 pr-2">
                      [CRITICAL_FAILURE]: {state.runRecord?.error || state.error}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
