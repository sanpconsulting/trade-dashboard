import React from 'react';
import { Play, Search } from 'lucide-react';

export function BacktestsView() {
  const results = [
    { id: 'BT-992', strategy: 'Momentum Breakout', asset: 'BTC-USD', period: '2023-01 to 2023-12', trades: 142, winRate: '68.5%', maxDd: '-12.4%', netProfit: '+45.2%' },
    { id: 'BT-991', strategy: 'Mean Reversion v2', asset: 'EURUSD=X', period: '2023-06 to 2023-12', trades: 89, winRate: '54.2%', maxDd: '-4.1%', netProfit: '+8.1%' },
    { id: 'BT-990', strategy: 'S&P 500 Scalper', asset: 'ES=F', period: '2023-11 to 2023-12', trades: 312, winRate: '71.0%', maxDd: '-2.8%', netProfit: '+11.4%' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">Simulation Engine</h2>
        <button className="flex items-center bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors">
          <Play className="w-3 h-3 fill-current mr-1.5" /> Run New Backtest
        </button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden flex-1 flex flex-col">
        <div className="px-4 py-3 bg-zinc-950/50 border-b border-zinc-800 flex items-center justify-between">
          <div className="text-[11px] uppercase font-semibold text-zinc-500">History Log</div>
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Search ID..." className="bg-zinc-950 border border-zinc-800 rounded-sm text-[10px] pl-7 pr-2 py-1 text-zinc-300 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-zinc-950/30 text-zinc-500 uppercase font-mono border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-normal">Job ID</th>
                <th className="px-4 py-3 font-normal">Strategy</th>
                <th className="px-4 py-3 font-normal">Asset</th>
                <th className="px-4 py-3 font-normal">Period</th>
                <th className="px-4 py-3 font-normal text-right">Trades</th>
                <th className="px-4 py-3 font-normal text-right">Win Rate</th>
                <th className="px-4 py-3 font-normal text-right">Max DD</th>
                <th className="px-4 py-3 font-normal text-right">Net Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-mono">
              {results.map(r => (
                <tr key={r.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-blue-400">{r.id}</td>
                  <td className="px-4 py-3">{r.strategy}</td>
                  <td className="px-4 py-3">{r.asset}</td>
                  <td className="px-4 py-3 text-zinc-500">{r.period}</td>
                  <td className="px-4 py-3 text-right">{r.trades}</td>
                  <td className="px-4 py-3 text-right">{r.winRate}</td>
                  <td className="px-4 py-3 text-right text-red-400">{r.maxDd}</td>
                  <td className={`px-4 py-3 text-right font-bold ${r.netProfit.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>{r.netProfit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
