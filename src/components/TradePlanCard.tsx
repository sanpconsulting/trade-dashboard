import React from 'react';
import { MarketData } from '../types';
import { formatNumber } from '../lib/utils';
import { Target, ShieldAlert, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

import { useLanguage } from '../hooks/useLanguage';

interface TradePlanCardProps {
  data: MarketData;
  capital: number;
}

export function TradePlanCard({ data, capital }: TradePlanCardProps) {
  const { t } = useLanguage();
  const { recommendedAction, tradePlan, } = data;
  const isWait = recommendedAction === 'WAIT';
  
  const actionColor = recommendedAction === 'BUY' 
    ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
    : recommendedAction === 'SELL'
    ? 'text-red-500 bg-red-500/10 border-red-500/20'
    : 'text-blue-500 bg-blue-500/10 border-blue-500/20';

  const positionSizeUSD = (tradePlan.suggestedPositionSizePct / 100) * capital;
  // Approximated crypto amount
  const cryptoAmount = tradePlan.entry ? positionSizeUSD / tradePlan.entry : 0;
  // Format asset display gracefully (e.g., AAPL vs BTCUSDT)
  const isCrypto = data.asset.includes('-USD');
  const sizeText = isCrypto 
    ? `${formatNumber(cryptoAmount, data.asset.includes('BTC') ? 4 : 2)} ${data.asset.replace('-USD', '')}` 
    : `${formatNumber(cryptoAmount, 2)} Units`;

  const getTranslatedAction = (action: string) => {
    if (action === 'BUY') return t('buy');
    if (action === 'SELL') return t('sell');
    if (action === 'WAIT') return t('wait');
    if (action === 'REDUCE') return t('reduce');
    return action;
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col h-full overflow-hidden">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 text-[10px] uppercase font-semibold text-zinc-500">
        {t('trade_plan')}
      </div>

      {isWait ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900/50 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-500 mb-3" />
          <p className="text-zinc-200 font-medium text-sm mb-1">{t('wait')}</p>
          <p className="text-xs text-zinc-500 max-w-[250px]">{t('wait') === 'WAIT' ? 'Conflicting signals detected. Await structural breaks.' : 'Signaux contradictoires détectés. Attendre une cassure structurelle.'}</p>
        </div>
      ) : (
        <div className="p-4 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className={cn("px-4 py-1.5 rounded-sm text-sm font-mono font-bold border", actionColor)}>
              SIGNAL: {getTranslatedAction(recommendedAction)}
            </div>
            <div className="text-right">
              <div className="text-xl font-mono font-bold text-zinc-100">{data.confidenceScore}%</div>
              <div className="text-[10px] uppercase text-zinc-500">{t('confidence')}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            <div className="flex justify-between flex-wrap items-end border-b border-zinc-800 pb-2">
              <label className="text-[10px] text-zinc-500 uppercase flex items-center">{t('entry')}</label>
              <span className="font-mono text-sm font-semibold text-zinc-100">
                {formatNumber(tradePlan.entry || 0, data.asset.includes('BTC') ? 2 : 4)}
              </span>
            </div>
            
            <div className="flex justify-between flex-wrap items-end border-b border-zinc-800 pb-2">
              <label className="text-[10px] text-zinc-500 uppercase flex items-center">{t('stop_loss')}</label>
              <span className="font-mono text-sm font-semibold text-red-500">
                {formatNumber(tradePlan.stopLoss || 0, data.asset.includes('BTC') ? 2 : 4)}
              </span>
            </div>

            <div className="flex justify-between flex-wrap items-end border-b border-zinc-800 pb-2">
              <label className="text-[10px] text-zinc-500 uppercase flex items-center">{t('take_profit')}</label>
              <span className="font-mono text-sm font-semibold text-emerald-500">
                {formatNumber(tradePlan.takeProfit || 0, data.asset.includes('BTC') ? 2 : 4)}
              </span>
            </div>
            
            <div className="flex justify-between flex-wrap items-end border-b border-zinc-800 pb-2 pt-2">
              <label className="text-[10px] text-zinc-500 uppercase">Size</label>
              <span className="font-mono text-xs font-semibold text-zinc-300 flex items-center gap-2">
                <span>{tradePlan.suggestedPositionSizePct.toFixed(1)}%</span>
                <span className="text-zinc-500 text-[10px]">({sizeText})</span>
                <span className="bg-zinc-800 px-1 py-0.5 rounded-sm text-[10px]">${formatNumber(positionSizeUSD, 2)}</span>
              </span>
            </div>

            <div className="flex justify-between items-end border-b border-zinc-800 pb-2">
              <label className="text-[10px] text-zinc-500 uppercase">{t('risk_reward')}</label>
              <span className="font-mono text-xs font-semibold text-zinc-300">
                1:{formatNumber(tradePlan.riskRewardRatio || 0, 2)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
