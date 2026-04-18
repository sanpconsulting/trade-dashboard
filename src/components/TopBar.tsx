import React, { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { Timeframe } from '../types';
import { cn } from '../lib/utils';
import { getMarketStatus } from '../lib/marketHours';

import { useLanguage } from '../hooks/useLanguage';

interface TopBarProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
  selectedTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
}

const ASSET_GROUPS = {
  Crypto: [
    { id: 'BTC-USD', name: 'Bitcoin (BTC)' },
    { id: 'ETH-USD', name: 'Ethereum (ETH)' },
    { id: 'SOL-USD', name: 'Solana (SOL)' },
    { id: 'XRP-USD', name: 'Ripple (XRP)' },
    { id: 'BNB-USD', name: 'Binance Coin (BNB)' }
  ],
  Forex: [
    { id: 'EURUSD=X', name: 'EUR/USD' },
    { id: 'GBPUSD=X', name: 'GBP/USD' },
    { id: 'JPY=X', name: 'USD/JPY' },
    { id: 'AUDUSD=X', name: 'AUD/USD' }
  ],
  Commodities: [
    { id: 'GC=F', name: 'Gold (GC)' },
    { id: 'SI=F', name: 'Silver (SI)' },
    { id: 'CL=F', name: 'Crude Oil (CL)' },
    { id: 'NG=F', name: 'Natural Gas (NG)' },
    { id: 'HG=F', name: 'Copper (HG)' }
  ],
  Stocks: [
    { id: 'AAPL', name: 'Apple Inc.' },
    { id: 'MSFT', name: 'Microsoft' },
    { id: 'TSLA', name: 'Tesla' },
    { id: 'NVDA', name: 'Nvidia' },
    { id: 'AMZN', name: 'Amazon' }
  ],
  Indices_Futures: [
    { id: 'ES=F', name: 'S&P 500 (ES)' },
    { id: 'NQ=F', name: 'Nasdaq 100 (NQ)' },
    { id: 'YM=F', name: 'Dow Jones (YM)' }
  ]
};

const TIMEFRAMES: Timeframe[] = ['5m', '15m', '1h', '4h', '1d', '1w'];

export function TopBar({ selectedAsset, onAssetChange, selectedTimeframe, onTimeframeChange }: TopBarProps) {
  const { language, setLanguage } = useLanguage();
  const [status, setStatus] = useState(() => getMarketStatus(selectedAsset));

  useEffect(() => {
    setStatus(getMarketStatus(selectedAsset));
    const timer = setInterval(() => {
      setStatus(getMarketStatus(selectedAsset));
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedAsset]);

  const toggleLang = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  return (
    <header className="h-[52px] border-b border-zinc-800 bg-[#09090b] flex items-center px-4 justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <select 
            value={selectedAsset}
            onChange={(e) => onAssetChange(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs rounded-sm px-3 py-1.5 pr-8 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {Object.entries(ASSET_GROUPS).map(([group, assets]) => (
              <optgroup key={group} label={group.replace('_', ' ')} className="bg-zinc-900 text-zinc-500 font-sans text-xs">
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id} className="text-zinc-200 font-mono">{asset.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
        </div>

        <div className="h-4 w-px bg-zinc-800" />

        <div className="flex bg-zinc-900 rounded-sm p-0.5 border border-zinc-800">
          {TIMEFRAMES.map(tf => {
            const isActive = selectedTimeframe === tf;
            return (
              <button 
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={cn(
                  "px-2.5 py-1 text-[10px] font-mono uppercase rounded-sm transition-colors cursor-pointer outline-none",
                  isActive 
                    ? "bg-zinc-700 text-zinc-100 font-bold" 
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                )}
              >
                {tf}
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <button 
          onClick={toggleLang}
          className="flex items-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-sm px-2 py-1 text-[10px] font-mono uppercase font-bold text-zinc-400 group"
        >
          <span className={cn("px-1", language === 'fr' ? "text-blue-500" : "group-hover:text-zinc-200")}>FR</span>
          <span className="text-zinc-700 mx-0.5">/</span>
          <span className={cn("px-1", language === 'en' ? "text-blue-500" : "group-hover:text-zinc-200")}>EN</span>
        </button>

        <div className="text-[10px] font-mono uppercase tracking-wider flex items-center bg-zinc-950 px-3 py-1.5 rounded-sm border border-zinc-800/80">
          <span className="text-zinc-500 mr-2">{language === 'fr' ? 'État :' : 'Status:'}</span>
          <span className={cn("inline-flex items-center font-medium tracking-widest", status.isOpen ? "text-emerald-500" : "text-amber-500")}>
            <span className={cn("w-1.5 h-1.5 rounded-full mr-2", status.isOpen ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]")} />
            {status.message}
          </span>
        </div>
      </div>
    </header>
  );
}
