import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Server, Activity, CheckCircle2, Database, Terminal, Play, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface Step {
  label: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  icon: any;
  delayMs: number;
}

export const RunReplayModal = ({ run, onClose }: { run: any; onClose: () => void }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    // Infer steps based on run
    const baseSteps: Step[] = [
      { label: 'Dashboard Action Triggered', status: 'success', icon: Play, delayMs: 400 },
      { label: 'Backend Endpoint Accepted Request', status: 'success', icon: Server, delayMs: 800 },
      { label: 'Run Ledger Entry Created', status: 'success', icon: Database, delayMs: 1200 },
      { label: 'PowerShell Script Launched', status: 'success', icon: Terminal, delayMs: 1600 }
    ];

    let delay = 2000;

    if (run.category === 'Routine Reminder' || run.category === 'Dynamic Adjustment') {
      baseSteps.push({ label: 'Reminder Type Validated', status: 'success', icon: Activity, delayMs: delay });
      delay += 600;
      baseSteps.push({ label: 'Telegram Send Confirmed', status: run.status === 'error' ? 'error' : 'success', icon: CheckCircle2, delayMs: delay });
      delay += 600;
    } else if (run.category === 'Agent Orchestration') {
      baseSteps.push({ label: 'Snapshot Selected (if applicable)', status: 'success', icon: Activity, delayMs: delay });
      delay += 600;
      baseSteps.push({ label: 'OpenClaw Agent Launched', status: 'success', icon: Activity, delayMs: delay });
      delay += 600;
      baseSteps.push({ label: 'Markdown Output Created', status: run.status === 'error' ? 'error' : 'success', icon: Activity, delayMs: delay });
      delay += 600;
    }

    baseSteps.push({ 
      label: 'Run Completed', 
      status: run.status === 'success' ? 'success' : run.status === 'error' ? 'error' : 'warning', 
      icon: CheckCircle2, 
      delayMs: delay 
    });

    setSteps(baseSteps);

    const timeouts = baseSteps.map((step, idx) => {
      return setTimeout(() => {
        setCurrentStepIdx(idx);
      }, step.delayMs);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [run]);

  const getColorConfig = (status: string, isPast: boolean, isCurrent: boolean) => {
    if (!isPast && !isCurrent) return { text: 'text-white/20', border: 'border-white/10', glow: '' };
    if (status === 'success') return { text: 'text-emerald-400', border: 'border-emerald-500/50', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]' };
    if (status === 'error') return { text: 'text-red-400', border: 'border-red-500/50', glow: 'shadow-[0_0_15px_rgba(239,68,68,0.3)]' };
    if (status === 'warning') return { text: 'text-amber-400', border: 'border-amber-500/50', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.3)]' };
    return { text: 'text-primary', border: 'border-primary/50', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.3)]' };
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex flex-col p-8"
      >
        <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto w-full">
          <div>
            <h2 className="text-3xl font-display font-bold text-white tracking-wide">Agent Replay</h2>
            <p className="text-primary font-mono text-sm tracking-widest uppercase mt-1">{run.actionLabel}</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 max-w-5xl mx-auto w-full flex flex-col md:flex-row gap-12">
          
          {/* Timeline Nodes */}
          <div className="w-full md:w-1/2 flex flex-col gap-2">
            {steps.map((step, idx) => {
              const isPast = idx < currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const Icon = step.icon;
              const colors = getColorConfig(step.status, isPast, isCurrent);

              return (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: step.delayMs / 1000 }}
                  className="flex items-start gap-4 relative"
                >
                  <div className="relative flex flex-col items-center">
                    <div className={clsx("w-10 h-10 rounded-full border flex items-center justify-center bg-[#070B1F] z-10", colors.border, colors.glow, colors.text)}>
                      {isCurrent && step.status !== 'error' && step.status !== 'success' ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Icon size={16} className={isCurrent ? "animate-pulse" : ""} />
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={clsx("w-0.5 h-10 my-1", isPast ? "bg-emerald-500/50" : "bg-white/10")} />
                    )}
                  </div>
                  
                  <div className="pt-2">
                    <p className={clsx("font-display font-semibold tracking-wide transition-colors duration-500", isPast || isCurrent ? "text-white" : "text-white/30")}>
                      {step.label}
                    </p>
                    {isCurrent && <p className="text-[10px] uppercase font-mono text-primary mt-1 tracking-widest animate-pulse">Processing...</p>}
                    {isPast && <p className={clsx("text-[10px] uppercase font-mono mt-1 tracking-widest", step.status === 'error' ? 'text-red-400' : 'text-emerald-400')}>
                      {step.status === 'error' ? 'Failed' : 'Completed'}
                    </p>}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Details & Output */}
          <div className="w-full md:w-1/2 flex flex-col">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex-1 bg-[#02040A]/90 rounded-2xl border border-white/10 p-6 flex flex-col shadow-2xl relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(34,211,238,0.05),transparent_50%)] pointer-events-none" />
              
              <h3 className="text-sm font-mono text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                <Terminal size={14} /> Run Output
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar text-xs font-mono pr-2">
                {currentStepIdx >= 3 && (
                  <div className="text-white/80 whitespace-pre-wrap break-words">
                    {run.sanitizedOutput || run.stdout || "No standard output captured."}
                  </div>
                )}
                {currentStepIdx >= 3 && run.stderr && (
                  <div className="text-amber-400/90 whitespace-pre-wrap break-words border-l-2 border-amber-400/50 pl-3 bg-amber-950/20 py-2 pr-2">
                    {run.stderr}
                  </div>
                )}
                {currentStepIdx === steps.length - 1 && run.error && (
                  <div className="text-red-400 whitespace-pre-wrap break-words border-l-2 border-red-500/50 pl-3 bg-red-950/20 py-2 pr-2">
                    [ERROR]: {run.error}
                  </div>
                )}
                {currentStepIdx < 3 && (
                  <div className="text-white/20 italic flex items-center gap-2 animate-pulse">
                    Awaiting output stream...
                  </div>
                )}
              </div>
            </motion.div>
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
