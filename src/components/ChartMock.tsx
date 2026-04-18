import React, { useState } from 'react';
import { AreaChart, LineChart, Line, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { MarketData, ChartType } from '../types';
import { LineChart as LineChartIcon, Activity } from 'lucide-react';

interface ChartMockProps {
  data: MarketData;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const format = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-sm p-3 shadow-lg font-mono text-xs">
        <div className="text-zinc-500 mb-1.5 uppercase text-[10px] tracking-widest">{d.fullDate || d.time}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-zinc-400">Open:</div><div className="text-zinc-100 text-right">{d.open ? format(d.open) : '-'}</div>
          <div className="text-zinc-400">High:</div><div className="text-zinc-100 text-right">{d.high ? format(d.high) : '-'}</div>
          <div className="text-zinc-400">Low:</div><div className="text-zinc-100 text-right">{d.low ? format(d.low) : '-'}</div>
          <div className="text-zinc-400">Close:</div><div className="text-zinc-100 text-right font-bold">{format(d.price)}</div>
        </div>
      </div>
    );
  }
  return null;
};

export function ChartMock({ data }: ChartMockProps) {
  const [chartType, setChartType] = useState<ChartType>('AREA');
  const chartData = data.history;
  
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.low || d.price)) * 0.998 : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.high || d.price)) * 1.002 : 100;

  const color = data.trend === 'BULLISH' ? '#10B981' : data.trend === 'BEARISH' ? '#EF4444' : '#3B82F6';

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
        <div className="text-[10px] uppercase font-semibold text-zinc-500">
          Chart // {data.asset}
          <span className="ml-3 px-2 py-0.5 bg-zinc-800 rounded-sm text-zinc-300 font-mono">TF: {data.activeTimeframe || '15m'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setChartType('AREA')}
            className={`p-1 rounded-sm transition-colors ${chartType === 'AREA' ? 'bg-zinc-800 text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Area Chart"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button 
            onClick={() => setChartType('LINE')}
            className={`p-1 rounded-sm transition-colors ${chartType === 'LINE' ? 'bg-zinc-800 text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            title="Line Chart"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      <div className="px-4 py-3 flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-mono font-bold text-zinc-100">{data.asset.replace('-USD', '').replace('=X', '').replace('=F', '')}</h2>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-zinc-100">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.currentPrice)}
          </div>
          <div className={data.priceChangePercent >= 0 ? 'text-emerald-500 text-[11px] font-mono font-bold' : 'text-red-500 text-[11px] font-mono font-bold'}>
            {data.priceChangePercent >= 0 ? '+' : ''}{data.priceChangePercent.toFixed(2)}% (24H)
          </div>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[250px] p-2 bg-zinc-900 border-t border-zinc-800/50">
        <ResponsiveContainer width="100%" height="100%" minHeight={250} minWidth={1}>
          {chartType === 'AREA' ? (
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.2}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <YAxis domain={[minPrice, maxPrice]} hide />
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} fillOpacity={1} fill="url(#colorPrice)" />
            </AreaChart>
          ) : (
            <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
              <YAxis domain={[minPrice, maxPrice]} hide />
              <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
