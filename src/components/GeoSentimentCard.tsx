import React from 'react';
import { MarketData } from '../types';
import { Globe, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface GeoSentimentCardProps {
  data: MarketData;
}

export function GeoSentimentCard({ data }: GeoSentimentCardProps) {
  const { language } = useLanguage();
  
  const geoInd = data.detailedIndicators.find(i => i.name === 'Sentiment Géo-Politique');
  if (!geoInd) return null;

  const score = parseInt(geoInd.value as string);
  
  return (
    <div className="tech-card flex flex-col h-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] to-transparent pointer-events-none" />
      
      <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center">
          <Globe className="h-4 w-4 mr-3 text-indigo-400 opacity-60" />
          <span className="tech-label opacity-70 tracking-[0.3em]">
            {language === 'fr' ? 'GEO_STRAT_INDEX' : 'GEO_STRAT_INDEX'}
          </span>
        </div>
        <div className={cn("px-3 py-1 rounded-full text-[9px] font-black tracking-widest border transition-colors", 
          geoInd.signal === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.1)]' :
          geoInd.signal === 'BEARISH' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.1)]' :
          'bg-zinc-800 text-zinc-500 border-zinc-700'
        )}>
          {geoInd.signal}
        </div>
      </div>
      
      <div className="p-6 flex flex-col items-center justify-center flex-1 bg-transparent">
        <div className="relative w-40 h-40 flex items-center justify-center mb-8">
          {/* Animated radar rings */}
          <div className="absolute inset-0 border border-zinc-900 rounded-full" />
          <div className="absolute inset-4 border border-zinc-900 rounded-full" />
          <div className="absolute inset-8 border border-zinc-900 rounded-full" />
          
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 border-t border-blue-500/20 rounded-full mix-blend-screen pointer-events-none"
          />

          <svg className="w-full h-full transform -rotate-90 relative z-10 p-1">
            <circle
              cx="76"
              cy="76"
              r="68"
              fill="transparent"
              stroke="rgba(255,255,255,0.02)"
              strokeWidth="4"
            />
            <motion.circle
              initial={{ strokeDashoffset: 427 }}
              animate={{ strokeDashoffset: 427 - (427 * score) / 100 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              cx="76"
              cy="76"
              r="68"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="6"
              strokeDasharray={427}
              strokeLinecap="round"
              className={cn(
                score > 60 ? 'text-emerald-500 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 
                score < 40 ? 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]' : 
                'text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]'
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-mono font-black text-white leading-none tracking-tighter transition-all duration-500">{score}<span className="text-zinc-600 text-lg ml-0.5">%</span></span>
            <span className="text-[9px] uppercase text-zinc-500 font-mono font-black tracking-[0.4em] mt-2 opacity-50">STG_PRC</span>
          </div>
        </div>

        <div className="w-full space-y-4">
          <div className="flex items-center p-4 rounded-2xl bg-zinc-900/40 border border-white/[0.05] relative overflow-hidden group/it">
            <div className={cn("absolute left-0 top-0 bottom-0 w-1 opacity-50", score > 60 ? 'bg-emerald-500' : score < 40 ? 'bg-rose-500' : 'bg-blue-500')} />
            <div className="text-[11px] leading-relaxed font-mono">
              <span className="tech-label opacity-40 block mb-1.5">{language === 'fr' ? 'INTELLIGENCE_REPORT' : 'INTELLIGENCE_REPORT'}</span>
              <span className="text-zinc-300 font-bold group-hover/it:text-white transition-colors uppercase tracking-tight">{geoInd.description}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-xl flex flex-col gap-1 shadow-inner">
               <span className="text-[8px] text-zinc-600 uppercase font-black font-mono tracking-[0.2em] opacity-60">MACRO_VECTOR</span>
               <div className="text-xs font-mono font-black text-zinc-100 uppercase tracking-tighter">{score > 50 ? 'EXPANSION_PHASE' : 'CONTRACTION_MOD'}</div>
            </div>
            <div className="p-4 bg-zinc-950/50 border border-white/5 rounded-xl flex flex-col gap-1 shadow-inner">
               <span className="text-[8px] text-zinc-600 uppercase font-black font-mono tracking-[0.2em] opacity-60">SENTIMENT_FLOW</span>
               <div className="text-xs font-mono font-black text-zinc-100 uppercase tracking-tighter">{score > 70 ? 'EXTREME_GREED' : score < 30 ? 'CRITICAL_FEAR' : 'STABLE_AXIS'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
