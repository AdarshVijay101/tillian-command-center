import { GlassCard } from '../ui/GlassCard';
import type { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface ProtocolCardProps {
  title: string;
  icon: LucideIcon;
  status: string;
  next: string;
  mode: string;
  glowColor: 'cyan' | 'purple' | 'blue' | 'emerald' | 'amber' | 'red';
  statusType?: 'success' | 'warning' | 'info' | 'active';
}

export const ProtocolCard: React.FC<ProtocolCardProps> = ({
  title, icon: Icon, status, next, mode, glowColor, statusType = 'active'
}) => {
  const statusColors = {
    success: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    warning: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    info: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    active: 'text-primary bg-primary/10 border-primary/20',
  };

  return (
    <GlassCard glowColor={glowColor} className="p-5 flex flex-col justify-between group h-full">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={clsx("p-2 rounded-lg border backdrop-blur-md", statusColors[statusType])}>
            <Icon size={18} />
          </div>
          <h3 className="font-display font-semibold text-white/90 tracking-wide text-lg">{title}</h3>
        </div>
        <div className={clsx("px-2 py-1 rounded text-[9px] uppercase tracking-wider border font-medium", statusColors[statusType])}>
          {mode}
        </div>
      </div>

      <div className="space-y-3 mt-4">
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-display mb-1">Current Status</p>
          <p className="text-sm text-white/80 font-medium group-hover:text-white transition-colors">{status}</p>
        </div>
        
        <div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest font-display mb-1">Next Action</p>
          <p className="text-sm text-white/60">{next}</p>
        </div>
      </div>
    </GlassCard>
  );
};
