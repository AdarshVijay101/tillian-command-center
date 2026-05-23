
import { GlassCard } from '../ui/GlassCard';
import { motion } from 'framer-motion';
import { Network, Database, BrainCircuit, ArrowRight, BookOpen, Clock, Shield, MessageSquare, Monitor } from 'lucide-react';
import { useHealth } from '../../hooks/useData';
import { clsx } from 'clsx';

export const Workflow = () => {
  const { data: health } = useHealth(15000);

  const nodes = [
    { id: 'notion', label: 'Notion Tracker', icon: BookOpen, type: 'source', status: 'active' },
    { id: 'snapshot', label: 'Notion Snapshot', icon: Clock, type: 'script', status: health?.scriptsExist?.morningBrief ? 'active' : 'missing' },
    { id: 'drop', label: '_OPENCLAW_DROP', icon: Database, type: 'folder', status: health?.dropFolderExists ? 'active' : 'missing' },
    { id: 'openclaw', label: 'OpenClaw Agent', icon: BrainCircuit, type: 'ai', status: health?.openclawGatewayReachable ? 'active' : 'offline' },
    { id: 'markdown', label: 'AI Markdown', icon: FileTextIcon, type: 'file', status: 'active' },
    { id: 'watcher', label: 'Folder Watcher', icon: Shield, type: 'service', status: 'active' },
    { id: 'processed', label: '_PROCESSED', icon: Database, type: 'folder', status: health?.processedFolderExists ? 'active' : 'missing' },
    { id: 'inbox', label: 'Agent Inbox', icon: Database, type: 'folder', status: 'active' },
    { id: 'telegram', label: 'Telegram Alert', icon: MessageSquare, type: 'network', status: 'active' },
    { id: 'dashboard', label: 'Command Center', icon: Monitor, type: 'ui', status: 'active' }
  ];



  const getColor = (status: string, type: string) => {
    if (status === 'offline' || status === 'missing') return 'text-red-400 border-red-500/50 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.2)]';
    if (type === 'ai') return 'text-purple-400 border-purple-500/50 bg-purple-500/10 shadow-[0_0_15px_rgba(168,85,247,0.2)]';
    if (type === 'source' || type === 'ui') return 'text-cyan-400 border-cyan-500/50 bg-cyan-500/10 shadow-[0_0_15px_rgba(34,211,238,0.2)]';
    if (type === 'folder') return 'text-amber-400 border-amber-500/50 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
    return 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20 text-primary">
          <Network size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-white tracking-wide">Mission Workflow</h1>
          <p className="text-sm text-white/40">System architecture and local automation pipeline</p>
        </div>
      </div>

      <GlassCard className="p-12 overflow-hidden relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px]" />
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-y-16 gap-x-8">
          {nodes.map((node, idx) => {
            const Icon = node.icon;
            const style = getColor(node.status, node.type);
            
            return (
              <motion.div 
                key={node.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                className="flex flex-col items-center text-center relative group"
              >
                <div className={clsx("w-16 h-16 rounded-2xl border flex items-center justify-center mb-4 transition-transform group-hover:scale-110", style)}>
                  <Icon size={24} />
                </div>
                <h3 className="font-display font-semibold text-white/90 text-sm">{node.label}</h3>
                <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{node.type}</p>
                
                {node.status !== 'active' && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
                )}
                {node.status !== 'active' && (
                  <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full border-2 border-[#070B1F]" />
                )}

                {/* Animated Arrow to next in basic flow (for desktop grid approximation) */}
                {idx !== nodes.length - 1 && idx !== 5 && idx !== 6 && idx !== 8 && (
                  <div className="hidden lg:block absolute top-8 -right-8 w-8 text-white/10 group-hover:text-primary transition-colors">
                    <ArrowRight size={24} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};

// Quick mock for FileText since it's not exported above
const FileTextIcon = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>
);
