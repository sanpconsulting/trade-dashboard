import React from 'react';
import { MarketData } from '../types';
import { formatNumber } from '../lib/utils';
import { motion } from 'motion/react';
import { Target, ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

import { useLanguage } from '../hooks/useLanguage';

interface TradePlanCardProps {
  data: MarketData;
  capital: number;
}

export function TradePlanCard({ data, capital }: TradePlanCardProps) {
  const { t, language } = useLanguage();
  const { recommendedAction, tradePlan, } = data;
  const isWait = recommendedAction === 'WAIT';
  
  const getActionColors = () => {
    if (recommendedAction === 'BUY') return { text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' };
    if (recommendedAction === 'SELL') return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30', glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]' };
    return { text: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30', glow: 'shadow-[0_0_20px_rgba(59,130,246,0.15)]' };
  };

  const colors = getActionColors();
  const positionSizeUSD = (tradePlan.suggestedPositionSizePct / 100) * capital;
  
  const cryptoAmount = tradePlan.entry ? positionSizeUSD / tradePlan.entry : 0;
  const isCrypto = data.asset.includes('-USD');
  const sizeText = isCrypto 
    ? `${formatNumber(cryptoAmount, data.asset.includes('BTC') ? 4 : 2)} ${data.asset.replace('-USD', '')}` 
    : `${formatNumber(cryptoAmount, 2)} Units`;

  return (
    <div className="tech-card flex flex-col h-full relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.015] to-transparent pointer-events-none" />
      
      <div className="px-5 py-2.5 bg-white/[0.02] border-b border-white/[0.04] flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-3 animate-pulse opacity-60" />
          <span className="tech-label opacity-60 tracking-[0.4em]">{t('trade_plan')}</span>
        </div>
        <div className="flex gap-1 opacity-10">
          {[...Array(4)].map((_, i) => <div key={i} className="w-0.5 h-3 bg-zinc-400 rounded-full" />)}
        </div>
      </div>

      {isWait ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-transparent text-center">
          <motion.div 
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="mb-8 relative"
          >
            <AlertTriangle className="h-14 w-14 text-amber-500/20 blur-md absolute inset-0" />
            <AlertTriangle className="h-14 w-14 text-amber-500/60 relative" />
          </motion.div>
          <p className="text-zinc-400 font-mono font-black tracking-[0.5em] text-[15px] mb-6 uppercase opacity-80">{t('wait')}</p>
          <div className="max-w-[320px] font-mono text-[9px] leading-loose border border-amber-500/10 bg-amber-500/5 p-5 rounded-xl text-amber-500/50 uppercase tracking-widest text-left relative overflow-hidden">
             <div className="absolute top-0 left-0 w-[2px] h-full bg-amber-500/30" />
             <div className="mb-2 opacity-30 flex justify-between">SYS_DIAG: <span>CONFLICT_0x77</span></div>
             <div className="space-y-0.5">
               <div>{'>'} DATA_STREAMS_DIVERGE</div>
               <div>{'>'} VOLATILITY_THRESHOLD_EXCEEDED</div>
               <div>{'>'} STRUCTURAL_ALPHA_LOW</div>
             </div>
          </div>
        </div>
      ) : (
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-start mb-10">
            <motion.div 
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              className={cn(
                "px-5 py-2.5 rounded-lg text-base font-mono font-black border tracking-[0.4em] uppercase transition-all duration-700 relative overflow-hidden", 
                colors.text, colors.bg, colors.border, colors.glow
              )}
            >
              <div className="absolute top-0 left-0 w-full h-[0.5px] bg-white opacity-10" />
              {recommendedAction === 'BUY' ? t('buy') : t('sell')}
            </motion.div>
            
            <div className="text-right px-4 py-2 bg-zinc-950/40 rounded-lg border border-white/[0.02] shadow-inner">
              <div className="text-[7px] uppercase text-zinc-600 font-mono font-black tracking-[0.4em] mb-1 opacity-40">PROB_INDEX</div>
              <div className="text-2xl font-mono font-black text-zinc-100 leading-none tracking-tighter">
                {data.confidenceScore}<span className="text-zinc-800 text-xs font-normal ml-0.5">%</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1 bg-zinc-950/20 p-6 rounded-xl border border-white/[0.03] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/[0.015] filter blur-[100px] pointer-events-none" />
            
            <div className="space-y-7">
              <div className="group/item">
                <label className="tech-label opacity-30 flex items-center gap-2 mb-2 group-hover/item:opacity-60 transition-opacity">
                  <div className="w-1.5 h-0.5 bg-blue-500/50" /> {t('entry')}
                </label>
                <div className="font-mono text-xl font-black text-zinc-100 tracking-tighter hover:text-blue-400 transition-colors cursor-default">
                   {formatNumber(tradePlan.entry || 0, data.asset.includes('BTC') ? 2 : 4)}
                </div>
              </div>
              
              <div className="group/item">
                <label className="tech-label opacity-30 flex items-center gap-2 mb-2 group-hover/item:opacity-60 transition-opacity">
                  <div className="w-1.5 h-0.5 bg-rose-500/50" /> {t('stop_loss')}
                </label>
                <div className="font-mono text-xl font-black text-rose-500/70 tracking-tighter">
                   {formatNumber(tradePlan.stopLoss || 0, data.asset.includes('BTC') ? 2 : 4)}
                </div>
              </div>

              <div className="group/item">
                <label className="tech-label opacity-30 flex items-center gap-2 mb-2 group-hover/item:opacity-60 transition-opacity">
                  <div className="w-1.5 h-0.5 bg-emerald-500/50" /> {t('take_profit')}
                </label>
                <div className="font-mono text-xl font-black text-emerald-500/70 tracking-tighter">
                   {formatNumber(tradePlan.takeProfit || 0, data.asset.includes('BTC') ? 2 : 4)}
                </div>
              </div>
            </div>

            <div className="bg-zinc-950/60 border border-white/[0.02] rounded-xl p-5 flex flex-col justify-between shadow-inner">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="tech-label opacity-30 uppercase">RATIO_R/R</span>
                  <span className="font-mono font-black text-zinc-500 bg-zinc-900 border border-white/[0.03] px-2 py-0.5 rounded tracking-widest">
                    {formatNumber(tradePlan.riskRewardRatio || 0, 2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[9px]">
                  <span className="tech-label opacity-30 uppercase">ALLOCATION</span>
                  <span className="font-mono font-black text-zinc-500 bg-zinc-900 border border-white/[0.03] px-2 py-0.5 rounded tracking-widest">
                    {tradePlan.suggestedPositionSizePct.toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="pt-6 border-t border-white/[0.015] mt-6 mt-auto">
                <div className="tech-label opacity-20 mb-3 tracking-[0.5em] text-[7px]">COMPUTED_VOLUME</div>
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between pb-1 border-b border-white/[0.01]">
                    <span className="text-[9px] text-zinc-700 font-mono font-black tracking-widest opacity-60">USD_EXPOSURE:</span>
                    <span className="text-sm font-mono font-black text-zinc-300 tracking-tighter">${formatNumber(positionSizeUSD, 0)}</span>
                  </div>
                  <div className="py-2.5 bg-zinc-950 rounded-lg border border-white/[0.02] text-center font-mono text-[10px] font-black tracking-[0.3em] text-zinc-600 transition-colors group-hover:text-blue-500 group-hover:border-blue-500/10">
                    {sizeText.toUpperCase()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
