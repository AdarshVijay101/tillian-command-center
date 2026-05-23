import { GlassCard } from '../ui/GlassCard';
import { Clock, PlayCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const events = [
  { id: 'gym', title: 'Gym Protocol', type: 'routine' },
  { id: 'morning_skincare', title: 'Morning Skincare', type: 'routine' },
  { id: 'study1', title: 'Study Block 1', type: 'routine' },
  { id: 'skip_gym', title: 'Skip Gym (Adjustment)', type: 'adjustment' },
  { id: 'late_wakeup', title: 'Late Wakeup (Adjustment)', type: 'adjustment' },
  { id: 'evening_cooking', title: 'Evening Cooking', type: 'routine' },
  { id: 'sleep', title: 'Sleep Protocol', type: 'routine' },
];

export const Timeline = ({ onRunAction }: { onRunAction: (name: string, id: string) => void }) => {
  return (
    <GlassCard className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Clock size={20} className="text-white/60" />
        <h3 className="font-display font-semibold text-white tracking-wide">Mission Timeline</h3>
      </div>
      
      <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
        {events.map((event, idx) => {
          return (
            <motion.button 
              key={idx}
              onClick={() => onRunAction(event.title, event.id)}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                "flex-shrink-0 w-48 p-4 rounded-2xl border snap-start text-left group",
                event.type === 'routine' ? "bg-white/5 border-emerald-500/20 hover:border-emerald-400/50 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]" : 
                "bg-primary/5 border-primary/20 hover:border-primary/50 hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
              )}
            >
              <div className="flex justify-between items-center mb-3">
                <span className={clsx(
                  "text-[10px] font-display font-bold tracking-widest",
                  event.type === 'routine' ? "text-emerald-400" : "text-primary"
                )}>
                  TRIGGER
                </span>
                <PlayCircle size={14} className={event.type === 'routine' ? "text-emerald-400 group-hover:animate-pulse" : "text-primary group-hover:animate-pulse"} />
              </div>
              <p className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                {event.title}
              </p>
            </motion.button>
          );
        })}
      </div>
    </GlassCard>
  );
};
