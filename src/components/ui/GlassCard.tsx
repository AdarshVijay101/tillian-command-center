import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { HTMLMotionProps } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  glowColor?: 'cyan' | 'purple' | 'blue' | 'emerald' | 'amber' | 'red' | 'none';
}

export const GlassCard = ({ 
  children, 
  className, 
  hoverEffect = true,
  glowColor = 'none',
  ...props 
}: GlassCardProps) => {
  const glowClasses = {
    cyan: 'hover:border-primary/50 hover:shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]',
    purple: 'hover:border-secondary/50 hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)]',
    blue: 'hover:border-blue-500/50 hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)]',
    emerald: 'hover:border-success/50 hover:shadow-[0_0_30px_-5px_rgba(16,185,129,0.3)]',
    amber: 'hover:border-warning/50 hover:shadow-[0_0_30px_-5px_rgba(245,158,11,0.3)]',
    red: 'hover:border-danger/50 hover:shadow-[0_0_30px_-5px_rgba(239,68,68,0.3)]',
    none: ''
  };

  return (
    <motion.div
      className={cn(
        "bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden transition-colors duration-300",
        hoverEffect && glowColor !== 'none' && glowClasses[glowColor],
        className
      )}
      whileHover={hoverEffect ? { scale: 1.01 } : {}}
      transition={{ duration: 0.3, ease: "easeOut" }}
      {...props}
    >
      {children}
    </motion.div>
  );
};
