import React, { useState, useEffect } from 'react';
import { MarketData } from '../types';
import { generateQuantSynthesis } from '../services/quantEngine';
import { ShieldCheck, Loader2, ListTree, ChevronDown, ChevronUp } from 'lucide-react';

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
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500 flex items-center justify-between">
        <div className="flex items-center">
          <ShieldCheck className="h-3 w-3 mr-2 text-emerald-500" />
          QuantEngine {language === 'fr' ? 'Analyse (Local)' : 'Analysis (Local)'}
        </div>
        <button 
          onClick={() => setShowDetails(!showDetails)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1"
          title={language === 'fr' ? 'Basculer les détails techniques' : 'Toggle Technical Details'}
        >
          <ListTree className="h-3 w-3" />
          {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>
      
      <div className="flex-1 p-4 relative flex flex-col overflow-y-auto">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/80 z-20 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 text-emerald-500 animate-spin mb-2" />
            <span className="text-[10px] uppercase text-zinc-500 tracking-widest">{language === 'fr' ? 'Scan des Indicateurs...' : 'Scanning Indicators...'}</span>
          </div>
        ) : null}
        
        {showDetails ? (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <h4 className="text-[10px] uppercase font-bold text-zinc-500 mb-2">{language === 'fr' ? 'Scan Technique Approfondi (10/10)' : 'Technical Deep Scan (10/10)'}</h4>
            {data.detailedIndicators.map((ind, idx) => (
              <div key={idx} className="flex items-center justify-between border-b border-zinc-800/50 pb-1 text-[11px]">
                <div className="flex flex-col">
                  <span className="text-zinc-400 font-medium">{ind.name}</span>
                  <span className="text-[9px] text-zinc-600 italic leading-none">{ind.description}</span>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-bold ${
                    ind.signal === 'BULLISH' ? 'text-emerald-500' : 
                    ind.signal === 'BEARISH' ? 'text-rose-500' : 'text-zinc-500'
                  }`}>
                    {translateSignal(ind.signal)}
                  </div>
                  <div className="text-[9px] text-zinc-500">{ind.value}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="text-[12px] leading-relaxed text-zinc-300 border-l-2 border-emerald-500/50 pl-3 py-2 bg-zinc-950/30 flex-1">
              <strong className="text-zinc-100 mb-1 block uppercase text-[10px] tracking-wider text-emerald-500">{language === 'fr' ? 'Synthèse Algorithmique :' : 'Algorithmic Synthesis:'}</strong>
              {synthesis}
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono uppercase flex justify-between">
              <span>MODEL: <span className="text-zinc-200">QUANT_V2_LOCAL</span></span>
              <span>CONFLUENCE: <span className="text-emerald-500 font-bold">{data.confidenceScore}%</span></span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
