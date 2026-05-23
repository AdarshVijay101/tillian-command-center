import { Home, Compass, Activity, Database, Settings, Stethoscope, List, GitMerge, Rocket, BarChart2, CheckSquare, BookOpen, Bell, CalendarClock, ShieldCheck, Server, Target, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../ui/GlassCard';

export const navItems = [
  { id: 'dashboard', icon: Home, label: 'MISSION' },
  { id: 'mission-control', icon: Target, label: 'M-CONTROL' },
  { id: 'agents', icon: Compass, label: 'AGENTS' },
  { id: 'radar', icon: Activity, label: 'RADAR' },
  { id: 'log', icon: List, label: 'LOG' },
  { id: 'jobs', icon: Server, label: 'JOBS' },
  { id: 'review-inbox', icon: FileText, label: 'REVIEW INBOX' },
  { id: 'evidence', icon: ShieldCheck, label: 'EVIDENCE' },
  { id: 'memory', icon: Database, label: 'MEMORY VAULT' },
  { id: 'checkin', icon: CheckSquare, label: 'CHECK-IN' },
  { id: 'protocols', icon: BookOpen, label: 'PROTOCOLS' },
  { id: 'notifications', icon: Bell, label: 'NOTIFICATIONS' },
  { id: 'scheduler', icon: CalendarClock, label: 'SCHEDULER' },
  { id: 'reliability', icon: ShieldCheck, label: 'RELIABILITY' },
  { id: 'analytics', icon: BarChart2, label: 'ANALYTICS' },
  { id: 'doctor', icon: Stethoscope, label: 'DOCTOR' },
  { id: 'release', icon: Rocket, label: 'RELEASE' },
  { id: 'workflow', icon: GitMerge, label: 'WORKFLOW' },
  { id: 'setup', icon: Rocket, label: 'SETUP' },
];

export const Sidebar = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) => {
  return (
    <div className="w-24 h-full border-r border-white/5 flex flex-col items-center py-8 justify-between relative z-10 bg-background/50 backdrop-blur-xl">
      {/* Logo */}
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.4)] relative">
        <div className="absolute inset-[1px] rounded-xl bg-background flex items-center justify-center">
          <div className="w-4 h-4 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#22D3EE]" />
        </div>
      </div>

      {/* Nav */}
      <div className="flex flex-col gap-6 w-full">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = item.id === activeTab;
          return (
            <div key={index} className="relative group w-full flex justify-center">
              {isActive && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_#22D3EE]"
                />
              )}
              <button 
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all duration-300",
                  isActive ? "text-primary" : "text-white/40 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <Icon size={22} className={isActive ? "drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]" : ""} />
                <span className="text-[9px] font-display font-semibold tracking-widest">{item.label}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Settings */}
      <button className="text-white/30 hover:text-white transition-colors p-3 rounded-2xl hover:bg-white/5">
        <Settings size={22} />
      </button>
    </div>
  );
};
