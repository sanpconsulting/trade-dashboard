import React, { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { Timeframe } from '../types';
import { cn } from '../lib/utils';
import { getMarketStatus } from '../lib/marketHours';
import { oandaToYahoo } from '../lib/symbolMapper';
import { authFetch } from '../lib/auth';
import { useLanguage } from '../hooks/useLanguage';

interface TopBarProps {
  selectedAsset: string;
  onAssetChange: (asset: string) => void;
  selectedTimeframe: Timeframe;
  onTimeframeChange: (tf: Timeframe) => void;
  onRefresh?: () => void;
}

interface OandaInstrument {
  name: string;
  type: string;
  displayName: string;
}

const DEFAULT_GROUPS = {
  Forex: ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD'],
  Metals: ['XAU_USD', 'XAG_USD'],
  Indices: ['NAS100_USD', 'US30_USD', 'SPX500_USD'],
  Crypto: ['BTC_USD', 'ETH_USD']
};

const TIMEFRAMES: Timeframe[] = ['5m', '15m', '1h', '4h', '1d', '1w'];

export function TopBar({ selectedAsset, onAssetChange, selectedTimeframe, onTimeframeChange, onRefresh }: TopBarProps) {
  const { language, setLanguage } = useLanguage();
  const [status, setStatus] = useState(() => getMarketStatus(oandaToYahoo(selectedAsset)));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [instruments, setInstruments] = useState<OandaInstrument[]>([]);

  useEffect(() => {
    const fetchInstruments = async () => {
      try {
        const apiKey = localStorage.getItem('trade_api_key');
        const accountId = localStorage.getItem('trade_api_secret');

        const response = await authFetch('/api/broker/instruments', {
          headers: apiKey ? {
            'x-broker-api-key': apiKey,
            'x-broker-account-id': accountId || ''
          } : {}
        });
        const data = await response.json();
        if (data.instruments) {
          setInstruments(data.instruments);
        }
      } catch (error) {
        console.error('Failed to fetch instruments:', error);
      }
    };
    fetchInstruments();
  }, []);

  useEffect(() => {
    setStatus(getMarketStatus(oandaToYahoo(selectedAsset)));
    const timer = setInterval(() => {
      setStatus(getMarketStatus(oandaToYahoo(selectedAsset)));
    }, 60000);
    return () => clearInterval(timer);
  }, [selectedAsset]);

  // Group fetched instruments
  const groupedInstruments = instruments.reduce((acc, inst) => {
    const type = inst.type || 'Other';
    if (!acc[type]) acc[type] = [];
    acc[type].push(inst);
    return acc;
  }, {} as Record<string, OandaInstrument[]>);

  // If no instruments yet, use hardcoded OANDA defaults
  const displayGroups: Record<string, OandaInstrument[]> = groupedInstruments;
  
  const toggleLang = () => {
    setLanguage(language === 'en' ? 'fr' : 'en');
  };

  const handleRefresh = () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const isAutoActive = localStorage.getItem('trade_auto_active') === 'true';

  return (
    <header className="h-[52px] border-b border-zinc-800 bg-[#09090b] flex items-center px-4 justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <select 
            value={selectedAsset}
            onChange={(e) => onAssetChange(e.target.value)}
            className="appearance-none bg-zinc-900 border border-zinc-700 text-zinc-100 font-mono text-xs rounded-sm px-3 py-1.5 pr-8 focus:outline-none focus:border-blue-500 cursor-pointer max-w-[180px]"
          >
            {instruments.length === 0 ? (
              Object.entries(DEFAULT_GROUPS).map(([group, assets]) => (
                <optgroup key={group} label={group} className="bg-zinc-900 text-zinc-500 font-sans text-xs">
                  {assets.map(id => (
                    <option key={id} value={id} className="text-zinc-200 font-mono">{id.replace('_', '/')}</option>
                  ))}
                </optgroup>
              ))
            ) : (
              Object.entries(displayGroups).map(([group, assets]) => (
                <optgroup key={group} label={group} className="bg-zinc-900 text-zinc-500 font-sans text-xs">
                  {assets.map(asset => (
                    <option key={asset.name} value={asset.name} className="text-zinc-200 font-mono">{asset.displayName}</option>
                  ))}
                </optgroup>
              ))
            )}
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
        {isAutoActive && (
          <div className="flex items-center bg-orange-500/10 border border-orange-500/30 px-2.5 py-1 rounded-sm text-orange-500 animate-pulse">
            <RefreshCw className="w-3 h-3 mr-2 animate-spin-slow" />
            <span className="text-[9px] font-bold tracking-tighter uppercase">{language === 'fr' ? 'ROBOT ACTIF' : 'AUTO-TRADE ACTIVE'}</span>
          </div>
        )}

        {onRefresh && (
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center w-8 h-8 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-sm text-zinc-400 group"
            title={language === 'fr' ? 'Rafraîchir' : 'Refresh Data'}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 group-hover:text-blue-500 transition-all", isRefreshing && "animate-spin text-blue-500")} />
          </button>
        )}

        <button 
          onClick={toggleLang}
          className="flex items-center bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors rounded-sm px-2 py-1 text-[10px] font-mono uppercase font-bold text-zinc-400 group"
        >
          <span className={cn("px-1", language === 'fr' ? "text-blue-500" : "group-hover:text-zinc-200")}>FR</span>
          <span className="text-zinc-700 mx-0.5">/</span>
          <span className={cn("px-1", language === 'en' ? "text-blue-500" : "group-hover:text-zinc-200")}>EN</span>
        </button>

        <div className="text-[10px] font-mono uppercase tracking-wider flex items-center bg-zinc-950 px-3 py-1.5 rounded-sm border border-zinc-800/80">
          <div className="flex items-center mr-4 pr-4 border-r border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <span className="text-zinc-100 font-bold">LIVE</span>
          </div>
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
