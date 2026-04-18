import React from 'react';
import { cn } from '../lib/utils';
import { formatNumber } from '../lib/utils';

interface ScoreGaugeProps {
  score: number;
  label: string;
  className?: string;
  type?: 'technical' | 'fundamental' | 'sentiment' | 'confidence';
}

import { useLanguage } from '../hooks/useLanguage';

interface ScoreGaugeProps {
  score: number;
  label: string;
  className?: string;
  type?: 'technical' | 'fundamental' | 'sentiment' | 'confidence';
}

export function ScoreGauge({ score, label, className, type = 'technical' }: ScoreGaugeProps) {
  const { language } = useLanguage();
  let colorClass = "text-[#888899]";
  let bgClass = "bg-[#666677]";
  let shadowClass = "shadow-[0_0_10px_var(--color-neutral)]";

  if (score >= 70) {
    colorClass = "text-bullish";
    bgClass = "bg-bullish";
    shadowClass = "shadow-[0_0_10px_var(--color-bullish)]";
  } else if (score <= 35) {
    colorClass = "text-bearish";
    bgClass = "bg-bearish";
    shadowClass = "shadow-[0_0_10px_var(--color-bearish)]";
  } else {
    colorClass = "text-neutral";
    bgClass = "bg-neutral";
  }

  return (
    <div className={cn("flex flex-col bg-[#0F0F19]/85 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden", className)}>
      <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10 text-[11px] uppercase tracking-[1px] font-bold text-[#888899]">
        {label}
      </div>
      <div className="p-4 flex-1 flex flex-col justify-center">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-[#888899] font-mono uppercase tracking-[1px]">SCORE</span>
          <span className={cn("text-lg font-mono font-bold", colorClass)}>{score}</span>
        </div>
        
        <div className="relative w-full h-1 bg-[#222222] rounded-sm my-2">
          <div 
            className={cn("absolute top-0 left-0 h-full rounded-sm transition-all duration-1000 ease-out", bgClass, shadowClass)}
            style={{ width: `${score}%` }}
          />
        </div>
        
        <div className="flex justify-between mt-1 text-[9px] uppercase tracking-[1px] text-[#888899] font-mono">
          <span>{language === 'fr' ? 'Baissier' : 'Bearish'}</span>
          <span>{language === 'fr' ? 'Neutre' : 'Neutral'}</span>
          <span>{language === 'fr' ? 'Haussier' : 'Bullish'}</span>
        </div>
      </div>
    </div>
  );
}
