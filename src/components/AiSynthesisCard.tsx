import React, { useState, useEffect } from 'react';
import { MarketData } from '../types';
import { generateTradeSynthesis } from '../services/aiService';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';

interface AiSynthesisCardProps {
  data: MarketData;
}

export function AiSynthesisCard({ data }: AiSynthesisCardProps) {
  const [synthesis, setSynthesis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const fetchSynthesis = async () => {
    setLoading(true);
    const result = await generateTradeSynthesis({
      asset: data.asset,
      currentPrice: data.currentPrice,
      change: data.priceChangePercent,
      technicalScore: data.technicalScore,
      fundamentalScore: data.fundamentalScore,
      sentimentScore: data.sentimentScore,
      strategy: data.recommendedStrategy,
      action: data.recommendedAction
    });
    
    setSynthesis(result);
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;
    
    async function loadInitial() {
      setLoading(true);
      const result = await generateTradeSynthesis({
        asset: data.asset,
        currentPrice: data.currentPrice,
        change: data.priceChangePercent,
        technicalScore: data.technicalScore,
        fundamentalScore: data.fundamentalScore,
        sentimentScore: data.sentimentScore,
        strategy: data.recommendedStrategy,
        action: data.recommendedAction
      });
      
      if (isMounted) {
        setSynthesis(result);
        setLoading(false);
      }
    }

    loadInitial();
    
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.asset]);

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500 flex items-center justify-between">
        <div className="flex items-center">
          <Sparkles className="h-3 w-3 mr-2 text-blue-500" />
          AI Analysis Engine
        </div>
        <button 
          onClick={fetchSynthesis}
          disabled={loading}
          className="text-zinc-500 hover:text-zinc-300 disabled:opacity-50 transition-colors"
          title="Regenerate Analysis"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      
      <div className="flex-1 p-4 relative flex flex-col">
        {loading && !synthesis ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mb-2" />
            <span className="text-[10px] uppercase text-zinc-500 tracking-widest">Compiling...</span>
          </div>
        ) : null}
        
        <div className="text-[12px] leading-relaxed text-zinc-300 border-l-2 border-blue-500/50 pl-3 py-2 bg-zinc-950/30 flex-1 overflow-y-auto">
          <strong className="text-zinc-100 mb-1 block uppercase text-[10px]">Logic:</strong>
          {synthesis || "Aucune synthèse disponible."}
        </div>

        <div className="mt-4 pt-3 border-t border-zinc-800 text-[10px] text-zinc-500 font-mono uppercase">
          STRATEGY: <span className="text-zinc-200 font-bold ml-1">{data.recommendedStrategy}</span>
        </div>
      </div>
    </div>
  );
}
