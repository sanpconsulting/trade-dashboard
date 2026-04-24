import React from 'react';
import { ShieldCheck, Loader2 } from 'lucide-react';
import { MarketData } from '../types';
import { cn } from '../lib/utils';

interface AiIntelligenceUnitProps {
  data: MarketData;
}

export function AiIntelligenceUnit({ data }: AiIntelligenceUnitProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
      {/* Time-Series Engine */}
      <div className="tech-card p-5 border-blue-500/10 bg-blue-500/[0.01] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 font-mono text-[7px] text-blue-500/20 font-black tracking-[0.4em]">TS_PROPHET_ENGINE_v4</div>
        <h3 className="tech-label text-blue-500/40 mb-5 flex items-center gap-2 text-[9px]">
          <ShieldCheck className="w-3.5 h-3.5" /> TIME_SERIES_FORECAST
        </h3>
        
        {data.prediction ? (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-mono font-black text-white tracking-tighter mb-1">
                {data.prediction.shortTermTrend === 'UP' ? '▲ BULLISH_FLUX' : data.prediction.shortTermTrend === 'DOWN' ? '▼ BEARISH_FLUX' : '⧗ STABLE'}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">ACCURACY:</span>
                <div className="flex gap-0.5">
                   {[...Array(10)].map((_, i) => (
                     <div key={i} className={cn("w-1.5 h-1 rounded-sm", i < (data.prediction?.probability || 0) / 10 ? "bg-blue-500/60" : "bg-zinc-900")} />
                   ))}
                </div>
                <span className="text-[10px] font-mono font-black text-blue-500/70">{data.prediction.probability}%</span>
              </div>
            </div>
            <div className="text-right border-l border-white/[0.03] pl-6">
              <div className="text-[7px] font-mono text-zinc-600 uppercase tracking-widest mb-1 opacity-50">TARGET_VAL</div>
              <div className="text-lg font-mono font-black text-zinc-100">${data.prediction.targetPrice}</div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-zinc-800 font-mono text-[9px] uppercase tracking-[0.2em] animate-pulse">Initializing Neural Buffer...</div>
        )}
      </div>

      {/* NLP Engine */}
      <div className="tech-card p-5 border-emerald-500/10 bg-emerald-500/[0.01] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 font-mono text-[7px] text-emerald-500/20 font-black tracking-[0.4em]">SENTI_MODEL_ALPHA_FIN</div>
        <h3 className="tech-label text-emerald-500/40 mb-5 flex items-center gap-2 text-[9px]">
          <Loader2 className="w-3.5 h-3.5" /> NLP_SENTIMENT (FINBERT)
        </h3>
        
        {data.nlpSentiment ? (
          <div className="flex items-center justify-between">
            <div>
              <div className={cn("text-2xl font-mono font-black tracking-tighter mb-1", data.nlpSentiment.averageScore > 0 ? "text-emerald-500/80" : "text-rose-500/80")}>
                {data.nlpSentiment.label === 'BULLISH' ? 'ALPHA_BULLISH' : data.nlpSentiment.label === 'BEARISH' ? 'ALPHA_BEARISH' : 'NEUTRAL_SIG'}
              </div>
              <div className="flex items-center gap-3 font-mono text-[9px] tracking-widest text-zinc-600">
                POLARITY: <span className="text-zinc-300 font-black">{(data.nlpSentiment.averageScore * 100).toFixed(1)}%</span>
                {Math.abs(data.nlpSentiment.averageScore) > 0.4 && <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-500/60 rounded border border-emerald-500/10 text-[7px] font-black">HIGH_CONFLUENCE</span>}
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <div className="text-[7px] font-mono font-black text-white/20 mb-1 tracking-[0.2em]">HYBRID_SCORE</div>
              <div className="relative w-12 h-12">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" className="text-zinc-900" />
                  <circle cx="24" cy="24" r="21" fill="none" stroke="currentColor" strokeWidth="3" className="text-emerald-500/40" strokeDasharray={132} strokeDashoffset={132 - (data.confidenceScore * 1.32)} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[9px] font-mono font-black text-white/60">
                  {data.confidenceScore}%
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-4 text-zinc-800 font-mono text-[9px] uppercase tracking-[0.2em] animate-pulse">Scanning Global News Flux...</div>
        )}
      </div>
    </div>
  );
}
