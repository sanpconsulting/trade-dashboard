import React, { useState } from 'react';
import { Plus, Settings2, Play, Square, X, Info } from 'lucide-react';

export function StrategiesView() {
  const [strategies, setStrategies] = useState([
    { id: 1, name: 'Momentum Breakout', type: 'Trend', asset: 'BTC-USD', timeframe: '15m', status: 'Active', winRate: '68%', pnl: '+14.2%', desc: 'Monitors tight consolidations on 15m intervals and triggers a LONG or SHORT when price violently breaks the 20-period Donchian Channels with 2x average volume.' },
    { id: 2, name: 'Mean Reversion v2', type: 'Range', asset: 'EURUSD=X', timeframe: '1h', status: 'Paused', winRate: '54%', pnl: '-1.2%', desc: 'Fades extreme moves on the 1-hour chart by shorting overbought levels (RSI > 75) and buying oversold levels (RSI < 25), targeting the 50 SMA.' },
    { id: 3, name: 'S&P 500 Scalper', type: 'Scalp', asset: 'ES=F', timeframe: '5m', status: 'Active', winRate: '72%', pnl: '+4.5%', desc: 'Executes rapid 5-minute scalps using VWAP and Order Flow imbalances during the first 2 hours of the NY opening session.' },
    { id: 4, name: 'Golden Cross Bot', type: 'Trend', asset: 'AAPL', timeframe: '1d', status: 'Paused', winRate: '61%', pnl: '+8.9%', desc: 'A long-term macro strategy that enters LONG when the 50-day moving average crosses above the 200-day moving average.' },
    { id: 5, name: 'Grid Trading', type: 'Range', asset: 'ETH-USD', timeframe: '5m', status: 'Active', winRate: '85%', pnl: '+3.1%', desc: 'Places a ladder of limit buy and sell orders at fixed intervals around the current price, capturing small profits in choppy, sideways markets.' },
    { id: 6, name: 'News Sentiment Algo', type: 'Arb', asset: 'TSLA', timeframe: '1m', status: 'Paused', winRate: '48%', pnl: '+1.4%', desc: 'Connects to NLP APIs to instantly trade sentiment spikes on Elon Musk tweets or major PR releases, exiting within 3 minutes.' },
    { id: 7, name: 'Commodity Supercycle', type: 'Macro', asset: 'GC=F', timeframe: '1w', status: 'Active', winRate: '59%', pnl: '+22.4%', desc: 'Holds Gold contracts over multi-week periods based on inflation metrics and US Dollar Index (DXY) inverse correlation.' },
  ]);
  const [showConfig, setShowConfig] = useState<number | null>(null);
  const [showInfo, setShowInfo] = useState<number | null>(null);

  const toggleStatus = (id: number) => {
    setStrategies(strategies.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'Active' ? 'Paused' : 'Active' };
      }
      return s;
    }));
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">Algorithmic Strategies</h2>
        <button 
          onClick={() => alert("Model Builder launching in new window...")}
          className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors shadow-[0_0_10px_rgba(37,99,235,0.4)]"
        >
          <Plus className="w-4 h-4 mr-1" /> New Model
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {strategies.map(s => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 flex flex-col relative group transition-colors hover:border-zinc-700">
            <button 
              className="absolute top-4 right-4 text-zinc-500 hover:text-blue-400 transition-colors"
              title="Show Strategy Rules"
              onClick={() => setShowInfo(showInfo === s.id ? null : s.id)}
            >
              <Info className="w-4 h-4" />
            </button>
            <div className="flex justify-between items-start mb-4 pr-6">
              <div>
                <h3 className="text-zinc-100 font-bold font-mono text-sm uppercase flex items-center">
                  {s.name}
                </h3>
                <div className="text-[10px] text-zinc-500 uppercase mt-1">{s.type} // {s.asset} // {s.timeframe}</div>
              </div>
            </div>
            
            <div className="mb-4">
               <div className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${s.status === 'Active' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-zinc-800/50 border border-zinc-700 text-zinc-400'}`}>
                Status: {s.status}
              </div>
            </div>

            {showInfo === s.id ? (
              <div className="mb-4 p-3 bg-zinc-950/80 rounded-sm border border-zinc-800 text-xs text-zinc-300 leading-relaxed min-h-[70px]">
                <strong className="text-zinc-500 uppercase text-[9px] block mb-1">Execution Logic</strong>
                {s.desc}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-4 p-2 bg-zinc-950/50 rounded-sm border border-zinc-800/50 min-h-[70px] items-center">
                <div>
                  <div className="text-[9px] text-zinc-500 uppercase">Win Rate</div>
                  <div className="text-zinc-100 font-mono text-lg font-bold">{s.winRate}</div>
                </div>
                <div>
                  <div className="text-[9px] text-zinc-500 uppercase">30D PnL</div>
                  <div className={`font-mono text-lg font-bold ${s.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{s.pnl}</div>
                </div>
              </div>
            )}

            <div className="mt-auto flex gap-2 pt-3 border-t border-zinc-800">
              <button 
                onClick={() => { setShowConfig(s.id); setShowInfo(null); }}
                className="flex-1 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 py-1.5 rounded-sm text-[10px] uppercase font-semibold transition-colors"
              >
                <Settings2 className="w-3 h-3 mr-1.5" /> Configure
              </button>
              <button 
                onClick={() => toggleStatus(s.id)}
                className={`flex-1 flex items-center justify-center py-1.5 rounded-sm text-[10px] uppercase font-semibold transition-colors ${s.status === 'Active' ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20'}`}
              >
                {s.status === 'Active' ? <><Square className="w-3 h-3 mr-1.5 fill-current" /> Pause</> : <><Play className="w-3 h-3 mr-1.5 fill-current" /> Start</>}
              </button>
            </div>
            
            {/* Quick config modal inline mockup */}
            {showConfig === s.id && (
              <div className="absolute inset-0 z-10 m-2 p-4 bg-zinc-900 border border-zinc-700/80 rounded-sm shadow-2xl flex flex-col">
                <button onClick={() => setShowConfig(null)} className="absolute top-3 right-3 text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
                <div className="text-[11px] uppercase text-zinc-400 mb-4 font-semibold border-b border-zinc-800 pb-2">Modify Strategy [{s.name}]</div>
                <div className="space-y-4 text-xs flex-1">
                  <div>
                    <label className="text-zinc-500 block mb-1">Position Size (% of Capital)</label>
                    <input type="number" defaultValue="2" className="bg-zinc-950 border border-zinc-700 rounded-sm w-full px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-zinc-500 block mb-1">Take Profit Ratio (R:R)</label>
                    <input type="number" defaultValue="2.0" step="0.1" className="bg-zinc-950 border border-zinc-700 rounded-sm w-full px-2 py-1.5 text-zinc-300 focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <button onClick={() => setShowConfig(null)} className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white py-2 font-semibold uppercase text-[10px] tracking-wider rounded-sm transition-colors">Apply & Save</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
