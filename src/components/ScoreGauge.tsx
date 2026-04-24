import React from 'react';
import { cn } from '../lib/utils';
import { formatNumber } from '../lib/utils';
import { motion } from 'motion/react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  className?: string;
  type?: 'technical' | 'fundamental' | 'sentiment' | 'confidence';
}

import { useLanguage } from '../hooks/useLanguage';

export function ScoreGauge({ score, label, className, type = 'technical' }: ScoreGaugeProps) {
  const { language } = useLanguage();
  
  const getColors = () => {
    if (score >= 70) return { 
      text: 'text-emerald-400', 
      bg: 'bg-emerald-500/10', 
      border: 'border-emerald-500/20', 
      glow: 'shadow-[0_0_20px_rgba(16,185,129,0.1)]' 
    };
    if (score <= 35) return { 
      text: 'text-rose-400', 
      bg: 'bg-rose-500/10', 
      border: 'border-rose-500/20', 
      glow: 'shadow-[0_0_20px_rgba(244,63,94,0.1)]' 
    };
    return { 
      text: 'text-blue-400', 
      bg: 'bg-blue-500/10', 
      border: 'border-blue-500/20', 
      glow: 'shadow-[0_0_20px_rgba(59,130,246,0.1)]' 
    };
  };

  const colors = getColors();

  return (
    <div className={cn("tech-card flex flex-col h-full group relative overflow-hidden transition-all duration-700 hover:border-white/10", className, colors.glow)}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none" />
      <div className={cn("absolute bottom-0 left-0 w-full h-[0.5px]", colors.bg)} />

      <div className="px-4 py-2 bg-white/[0.01] border-b border-white/[0.03] flex items-center justify-between relative overflow-hidden">
        <div className="absolute left-0 top-0 w-[1px] h-full bg-current transition-all duration-700 group-hover:h-full h-0 opacity-40" style={{ backgroundColor: 'currentColor' }} />
        <span className="tech-label opacity-40 tracking-[0.4em] uppercase text-[7px]">{label}</span>
        <div className="flex gap-1 opacity-10 group-hover:opacity-30 transition-opacity">
          {[...Array(2)].map((_, i) => <div key={i} className="w-[1px] h-2 bg-zinc-400 rounded-full" />)}
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col justify-center bg-transparent">
        <div className="flex justify-between items-end mb-4">
          <div className="flex flex-col">
            <span className="text-[7px] text-zinc-700 font-mono font-black tracking-[0.4em] uppercase mb-1">METER_{type.toUpperCase()}</span>
            <div className={cn("text-3xl font-mono font-black tracking-tighter transition-all duration-500", colors.text)}>
              {score}<span className="text-zinc-800 text-xs font-normal ml-0.5">%</span>
            </div>
          </div>
          <div className={cn("w-2 h-2 rounded-full animate-pulse mb-1.5 opacity-60 shadow-[0_0_8px_currentColor]", score >= 70 ? 'bg-emerald-500' : score <= 35 ? 'bg-rose-500' : 'bg-blue-500')} />
        </div>
        
        <div className="flex gap-0.5 w-full h-2.5 mb-3 px-0.5 bg-black/20 rounded-sm p-0.5 border border-white/[0.01]">
           {[...Array(20)].map((_, i) => {
             const pointValue = i * 5;
             const isActive = score >= pointValue;
             
             return (
               <motion.div 
                 key={i} 
                 initial={false}
                 animate={{
                   opacity: isActive ? 0.8 : 0.03,
                   backgroundColor: isActive 
                    ? (pointValue < 35 ? '#F43F5E' : pointValue < 70 ? '#3B82F6' : '#10B981')
                    : '#27272a'
                 }}
                 className={cn(
                   "flex-1 rounded-[0.5px] transform-gpu",
                   isActive && (pointValue < 35 ? 'shadow-[0_0_5px_rgba(244,63,94,0.3)]' : pointValue < 70 ? 'shadow-[0_0_5px_rgba(59,130,246,0.3)]' : 'shadow-[0_0_5px_rgba(16,185,129,0.3)]')
                 )}
               />
             )
           })}
        </div>
        
        <div className="flex justify-between mt-3 text-[6px] font-mono font-black tracking-[0.4em] text-zinc-800 uppercase">
          <span className={cn("transition-colors", score <= 35 ? 'text-rose-500/60' : '')}>MIN</span>
          <span className="opacity-20 italic">VAL_REF_0x0</span>
          <span className={cn("transition-colors", score >= 70 ? 'text-emerald-500/60' : '')}>MAX</span>
        </div>
      </div>
    </div>
  );
}
