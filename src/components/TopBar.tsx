import React, { useState, useEffect } from 'react';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { Timeframe } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';
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
        }).catch(err => {
          console.error("Instrument Fetch Network Error:", err);
          return null; // Handle network error specifically
        });

        if (!response) return;

        const data = await response.json().catch(() => ({ error: "Format JSON invalide" }));
        if (data.instruments) {
          setInstruments(data.instruments);
        } else if (data.error) {
          console.error("Broker Error:", data.error);
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
    <header className="min-h-[48px] py-0 border-b border-white/[0.03] bg-[#050505]/60 backdrop-blur-3xl flex flex-wrap items-center px-5 justify-between sticky top-0 z-20 shrink-0 shadow-[0_2px_15px_rgba(0,0,0,0.3)]">
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
      <div className="absolute bottom-0 left-0 w-full h-[0.5px] bg-gradient-to-r from-transparent via-blue-500/10 to-transparent" />
      
      <div className="flex items-center gap-5 py-1.5 relative z-10 flex-wrap">
        <div className="relative group">
          <select 
            value={selectedAsset}
            onChange={(e) => onAssetChange(e.target.value)}
            className="appearance-none bg-zinc-950 border border-white/[0.03] text-white font-mono text-[11px] font-black tracking-tighter rounded-md px-4 py-1.5 pr-8 focus:outline-none focus:border-blue-500/30 hover:bg-zinc-900 transition-all cursor-pointer neo-shadow min-w-[170px]"
          >
            {instruments.length === 0 ? (
              Object.entries(DEFAULT_GROUPS).map(([group, assets]) => (
                <optgroup key={group} label={group} className="bg-[#050505] text-zinc-700 font-sans text-[9px] uppercase tracking-widest py-1">
                  {assets.map(id => (
                    <option key={id} value={id} className="text-zinc-300 font-mono text-xs py-0.5">{id.replace('_', '/')}</option>
                  ))}
                </optgroup>
              ))
            ) : (
              Object.entries(displayGroups).map(([group, assets]) => (
                <optgroup key={group} label={group} className="bg-[#050505] text-zinc-700 font-sans text-[9px] uppercase tracking-widest py-1">
                  {assets.map(asset => (
                    <option key={asset.name} value={asset.name} className="text-zinc-300 font-mono text-xs py-0.5">{asset.displayName}</option>
                  ))}
                </optgroup>
              ))
            )}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-600 pointer-events-none group-hover:text-zinc-400 transition-colors" />
        </div>

        <div className="flex bg-zinc-950/60 rounded-lg p-0.5 border border-white/[0.03] neo-shadow">
          {TIMEFRAMES.map((tf, i) => {
            const isActive = selectedTimeframe === tf;
            return (
              <button 
                key={tf}
                onClick={() => onTimeframeChange(tf)}
                className={cn(
                  "px-3 py-1 text-[9px] font-mono font-black tracking-[0.1em] uppercase rounded-md transition-all cursor-pointer relative overflow-hidden",
                  isActive 
                    ? "text-blue-500" 
                    : "text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.01]"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="tf-pill-active"
                    className="absolute inset-0 bg-blue-500/[0.08] border border-blue-500/20 rounded-md" 
                    transition={{ type: "spring", bounce: 0.1, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{tf}</span>
              </button>
            )
          })}
        </div>
      </div>
      
      <div className="flex items-center gap-4 py-1.5 relative z-10 flex-wrap lg:flex-nowrap">
        {isAutoActive && (
          <div className="hidden sm:flex items-center bg-orange-500/[0.02] border border-orange-500/10 px-3 py-1.5 rounded-lg text-orange-500/70 group">
            <RefreshCw className="w-3 h-3 mr-2 animate-spin-slow text-orange-500/50" />
            <span className="text-[9px] font-black tracking-[0.3em] uppercase font-mono">ROBOT</span>
            <div className="ml-2 w-1 h-1 bg-orange-500 rounded-full animate-pulse shadow-[0_0_5px_rgba(249,115,22,1)]" />
          </div>
        )}

        {onRefresh && (
          <button 
            onClick={handleRefresh}
            className="flex items-center justify-center w-8 h-8 bg-zinc-950 border border-white/[0.03] hover:border-blue-500/20 hover:bg-zinc-900 transition-all rounded-lg text-zinc-600 group neo-shadow"
            title={language === 'fr' ? 'Rafraîchir' : 'Refresh Data'}
          >
            <RefreshCw className={cn("w-3.5 h-3.5 group-hover:text-blue-500 transition-all duration-300", isRefreshing && "animate-spin text-blue-500")} />
          </button>
        )}

        <button 
          onClick={toggleLang}
          className="flex items-center bg-zinc-950 border border-white/[0.03] hover:border-zinc-800 transition-all rounded-lg px-3 py-1.5 text-[8px] font-mono tracking-[0.3em] uppercase font-black text-zinc-600 group hover:text-zinc-400"
        >
          <span className={cn("transition-colors", language === 'fr' ? "text-blue-500" : "")}>FR</span>
          <span className="text-zinc-800 mx-1.5 opacity-30">•</span>
          <span className={cn("transition-colors", language === 'en' ? "text-blue-500" : "")}>EN</span>
        </button>

        <div className="h-8 bg-zinc-950/40 border border-white/[0.02] flex items-center px-4 rounded-lg shadow-inner group hover:border-white/5 transition-colors">
          <div className="flex items-center mr-5 pr-5 border-r border-white/[0.03]">
            <div className={cn("w-1.5 h-1.5 rounded-full mr-2.5 animate-pulse", status.isOpen ? "bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-amber-500/80 shadow-[0_0_8px_rgba(245,158,11,0.5)]")} />
            <span className="text-white font-black tracking-[-0.05em] text-[12px] font-mono group-hover:text-blue-500 transition-colors opacity-80">NODE_LIVE</span>
          </div>
          <div className="flex flex-col min-w-[70px]">
            <span className="text-[7px] text-zinc-700 font-mono font-black tracking-[0.3em] uppercase mb-0">{language === 'fr' ? 'SRV' : 'STAT'}</span>
            <span className={cn("text-[8px] font-black tracking-widest uppercase font-mono leading-none transition-colors", status.isOpen ? "text-emerald-500/60" : "text-amber-500/60")}>
              {status.message.replace('Market is ', '')}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
