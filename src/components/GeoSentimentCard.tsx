import React from 'react';
import { MarketData } from '../types';
import { Globe, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface GeoSentimentCardProps {
  data: MarketData;
}

export function GeoSentimentCard({ data }: GeoSentimentCardProps) {
  const { language } = useLanguage();
  
  // Find the geopolitical indicator
  const geoInd = data.detailedIndicators.find(i => i.name === 'Sentiment Géo-Politique');
  if (!geoInd) return null;

  const score = parseInt(geoInd.value as string);
  
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden flex flex-col h-full">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500 flex items-center justify-between">
        <div className="flex items-center">
          <Globe className="h-3 w-3 mr-2 text-blue-500" />
          {language === 'fr' ? 'Analyse Géo-Socio-Économique' : 'Geo-Socio-Economic Analysis'}
        </div>
        <div className={`px-1.5 py-0.5 rounded-sm text-[9px] font-bold ${
          geoInd.signal === 'BULLISH' ? 'bg-emerald-500/10 text-emerald-500' :
          geoInd.signal === 'BEARISH' ? 'bg-rose-500/10 text-rose-500' :
          'bg-zinc-800 text-zinc-400'
        }`}>
          {geoInd.signal}
        </div>
      </div>
      
      <div className="p-4 flex flex-col items-center justify-center flex-1">
        <div className="relative w-32 h-32 flex items-center justify-center mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              className="text-zinc-800"
            />
            <circle
              cx="64"
              cy="64"
              r="58"
              fill="transparent"
              stroke="currentColor"
              strokeWidth="12"
              strokeDasharray={364}
              strokeDashoffset={364 - (364 * score) / 100}
              strokeLinecap="round"
              className={`${
                score > 60 ? 'text-emerald-500' : 
                score < 40 ? 'text-rose-500' : 
                'text-blue-500'
              } transition-all duration-1000 ease-out`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
            <span className="text-3xl font-mono font-bold text-zinc-100 leading-none">{score}%</span>
            <span className="text-[9px] uppercase text-zinc-500 font-bold tracking-widest mt-1">SENTIMENT</span>
          </div>
        </div>

        <div className="w-full space-y-3">
          <div className="flex items-center p-2 rounded-sm bg-zinc-950/40 border border-zinc-800/80">
            {score > 60 ? (
              <TrendingUp className="w-4 h-4 text-emerald-500 mr-3 shrink-0" />
            ) : score < 40 ? (
              <TrendingDown className="w-4 h-4 text-rose-500 mr-3 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-zinc-500 mr-3 shrink-0" />
            )}
            <div className="text-[11px] leading-relaxed text-zinc-400">
              <span className="text-zinc-200 font-semibold block uppercase text-[9px] mb-0.5">
                {language === 'fr' ? 'Impact Courant :' : 'Current Impact:'}
              </span>
              {geoInd.description}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 border border-zinc-800 bg-zinc-950/20 rounded-sm">
               <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1 opacity-60">Macro Health</span>
               <div className="text-xs font-mono text-zinc-300">{score > 50 ? 'EXPANDING' : 'STAGNANT'}</div>
            </div>
            <div className="p-2 border border-zinc-800 bg-zinc-950/20 rounded-sm">
               <span className="text-[9px] text-zinc-500 uppercase block font-bold mb-1 opacity-60">Fear/Greed</span>
               <div className="text-xs font-mono text-zinc-300">{score > 70 ? 'GREED' : score < 30 ? 'EXTREME FEAR' : 'NEUTRAL'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
