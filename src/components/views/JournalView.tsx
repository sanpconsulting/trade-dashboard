import React from 'react';
import { ArrowUpRight, ArrowDownRight, Printer } from 'lucide-react';

export function JournalView() {
  const trades = [
    { id: 'T-1042', date: '2023-10-24 14:30', pair: 'BTC-USD', type: 'LONG', entry: 34120.50, exit: 34850.00, pnl: '+412.50', status: 'WIN' },
    { id: 'T-1041', date: '2023-10-24 10:15', pair: 'ES=F', type: 'SHORT', entry: 4250.25, exit: 4260.50, pnl: '-512.50', status: 'LOSS' },
    { id: 'T-1040', date: '2023-10-23 09:05', pair: 'AAPL', type: 'LONG', entry: 173.20, exit: 175.80, pnl: '+260.00', status: 'WIN' },
    { id: 'T-1039', date: '2023-10-22 18:45', pair: 'EURUSD=X', type: 'SHORT', entry: 1.0580, exit: 1.0540, pnl: '+400.00', status: 'WIN' },
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">Trade Journal</h2>
        <button className="flex items-center bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors">
          <Printer className="w-3 h-3 mr-1.5" /> Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
          <div className="text-[10px] uppercase text-zinc-500 mb-1">Gross PnL (MTD)</div>
          <div className="text-2xl font-mono font-bold text-emerald-400">+$1,450.00</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
          <div className="text-[10px] uppercase text-zinc-500 mb-1">Win Rate (MTD)</div>
          <div className="text-2xl font-mono font-bold text-zinc-100">68.4%</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4">
          <div className="text-[10px] uppercase text-zinc-500 mb-1">Profit Factor</div>
          <div className="text-2xl font-mono font-bold text-zinc-100">1.84</div>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-[11px]">
            <thead className="bg-zinc-950/50 text-zinc-500 uppercase font-mono border-b border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-normal">Ticket</th>
                <th className="px-4 py-3 font-normal">Date (UTC)</th>
                <th className="px-4 py-3 font-normal">Asset</th>
                <th className="px-4 py-3 font-normal">Direction</th>
                <th className="px-4 py-3 font-normal text-right">Entry</th>
                <th className="px-4 py-3 font-normal text-right">Exit</th>
                <th className="px-4 py-3 font-normal text-right">Gross PnL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-zinc-300 font-mono">
              {trades.map(t => (
                <tr key={t.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-4 py-3 text-zinc-500">{t.id}</td>
                  <td className="px-4 py-3 text-zinc-400">{t.date}</td>
                  <td className="px-4 py-3">{t.pair}</td>
                  <td className="px-4 py-3">
                    <span className={`flex items-center ${t.type === 'LONG' ? 'text-emerald-400' : 'text-red-400'}`}>
                      {t.type === 'LONG' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{t.entry}</td>
                  <td className="px-4 py-3 text-right">{t.exit}</td>
                  <td className={`px-4 py-3 text-right font-bold ${t.pnl.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.pnl}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
