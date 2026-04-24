import React, { useState, useEffect } from 'react';
import { MarketData } from '../types';
import { generateQuantSynthesis } from '../services/quantEngine';
import { ShieldCheck, Loader2, ListTree, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../lib/utils';

import { useLanguage } from '../hooks/useLanguage';

interface AiSynthesisCardProps {
  data: MarketData;
}

export function AiSynthesisCard({ data }: AiSynthesisCardProps) {
  const { t, language } = useLanguage();
  const [synthesis, setSynthesis] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setLoading(true);
    // Local calculation is near-instant, but we simulate a small delay for UX feel
    const timer = setTimeout(() => {
      const result = generateQuantSynthesis(data);
      setSynthesis(result);
      setLoading(false);
    }, 400);
    
    return () => clearTimeout(timer);
  }, [data.asset, data.currentPrice]);

  const translateSignal = (signal: string) => {
    if (signal === 'BULLISH') return language === 'fr' ? 'HAUSSIER' : 'BULLISH';
    if (signal === 'BEARISH') return language === 'fr' ? 'BAISSIER' : 'BEARISH';
    return language === 'fr' ? 'NEUTRE' : 'NEUTRAL';
  };

  return (
    <div className="tech-card flex flex-col h-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.01] to-transparent pointer-events-none" />
      
      <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center">
          <ShieldCheck className="h-4 w-4 mr-3 text-emerald-500/60" />
          <span className="tech-label opacity-60 tracking-[0.4em] uppercase">Quant_SYNTHESIS_V2</span>
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="bg-zinc-950 border border-white/[0.03] hover:border-zinc-800 transition-all rounded-md px-3 py-1.5 text-zinc-600 hover:text-zinc-400 flex items-center gap-2 group/btn"
          title={language === 'fr' ? 'Basculer les détails techniques' : 'Toggle Technical Details'}
        >
          <ListTree className="h-3 w-3 group-hover/btn:text-blue-500 transition-colors" />
          <span className="text-[7px] font-mono font-black tracking-[0.2em]">{showDetails ? 'VIEW_SUMMARY' : 'VIEW_MATRIX'}</span>
        </button>
      </div>
      
      <div className="flex-1 p-6 relative flex flex-col overflow-hidden bg-transparent">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#050505]/80 z-30 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin mb-4 opacity-40" />
            <span className="font-mono text-[8px] uppercase text-emerald-500/50 tracking-[0.5em] animate-pulse font-black">{language === 'fr' ? 'SYNCHRONISATION...' : 'SYNCHRONIZING...'}</span>
          </div>
        ) : null}
        
        {showDetails ? (
          <div className="animate-in fade-in slide-in-from-top-2 duration-500 h-full flex flex-col">
            <div className="sticky top-0 z-20 py-1.5 border-b border-white/[0.03] mb-4 flex justify-between items-center">
              <h4 className="text-[8px] uppercase font-black text-zinc-700 tracking-[0.3em] font-mono">
                {language === 'fr' ? 'MATRIX_SCAN_REPORT' : 'MATRIX_SCAN_REPORT'}
              </h4>
              <span className="text-[8px] font-mono text-zinc-800 font-black">10_CHANNELS_ACTIVE</span>
            </div>
            <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1.5">
              {data.detailedIndicators.map((ind, idx) => (
                <div key={idx} className="flex justify-between items-center px-4 py-3 bg-zinc-950/40 border border-white/[0.015] hover:border-white/[0.05] transition-all rounded-lg group/item relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-[1px] h-full bg-current opacity-20" style={{ backgroundColor: ind.signal === 'BULLISH' ? '#10B981' : ind.signal === 'BEARISH' ? '#F43F5E' : '#27272a' }} />
                  <div className="flex flex-col gap-1">
                    <span className="text-zinc-300 font-mono text-[10px] font-black tracking-tight">{ind.name}</span>
                    <span className="text-[8px] text-zinc-700 font-mono uppercase tracking-widest opacity-60 leading-none">{ind.description.split('.')[0]}</span>
                  </div>
                  <div className="text-right flex space-x-5 items-center">
                    <div className="text-[9px] text-zinc-600 font-mono font-black italic">
                      {ind.value}
                    </div>
                    <div className={`font-mono text-[8px] font-black px-2 py-1 rounded-sm uppercase tracking-[0.2em] w-16 text-center border ${
                      ind.signal === 'BULLISH' ? 'text-emerald-500/80 border-emerald-500/10 bg-emerald-500/5' : 
                      ind.signal === 'BEARISH' ? 'text-rose-500/80 border-rose-500/10 bg-rose-500/5' : 'text-zinc-600 border-white/5'
                    }`}>
                      {translateSignal(ind.signal)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full justify-between">
            <div className="relative font-mono text-xs leading-relaxed text-zinc-400 border border-white/[0.015] p-6 bg-zinc-950/40 rounded-xl shadow-inner group-hover:border-white/[0.04] transition-all">
              <div className="absolute top-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-emerald-500/40 via-blue-500/40 to-transparent opacity-30" />
              <strong className="text-zinc-600 mb-5 block uppercase text-[8px] tracking-[0.4em] font-black flex justify-between items-center opacity-60">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-emerald-500/50 rounded-full" /> 
                   {language === 'fr' ? 'SYNTHESE_ENGINE_O1' : 'ENGINE_O1_SYNTHESIS'}
                </div>
                <span>AUTO_UPDATE</span>
              </strong>
              <div className="leading-loose tracking-wide">{synthesis}</div>
            </div>

            <div className="pt-6 mt-auto">
              <div className="flex justify-between font-mono text-[7px] font-black tracking-[0.4em] uppercase text-zinc-800 border-t border-white/[0.015] pt-4">
                <span>MODEL: <span className="text-zinc-700">QUANT_ALPHA_7</span></span>
                <span>CONFIDENCE: <span className={cn(data.confidenceScore > 70 ? "text-emerald-500/40" : "text-blue-500/40")}>{data.confidenceScore}%</span></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
