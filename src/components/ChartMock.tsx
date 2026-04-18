import React, { useState } from 'react';
import { 
  AreaChart, Area, 
  LineChart, Line, 
  BarChart, Bar, 
  ScatterChart, Scatter,
  ComposedChart,
  XAxis, YAxis, Tooltip, ResponsiveContainer 
} from 'recharts';
import { MarketData, ChartType } from '../types';
import { LineChart as LineChartIcon, Activity, BarChart3, ScatterChart as ScatterIcon, Layers } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

interface ChartMockProps {
  data: MarketData;
}

const Candle = (props: any) => {
  const { x, y, width, height, low, high, open, close } = props;
  const isUp = close > open;
  const candleColor = isUp ? '#10B981' : '#EF4444';
  const ratio = height / Math.abs(open - close || 0.001);
  
  // Wick
  const wickX = x + width / 2;
  const wickYLow = y + (close > open ? height : 0) + (Math.abs(close - low) * ratio);
  const wickYHigh = y - (Math.abs(high - (isUp ? close : open)) * ratio);

  return (
    <g>
      <line x1={wickX} y1={wickYHigh} x2={wickX} y2={wickYLow} stroke={candleColor} strokeWidth={1} />
      <rect x={x} y={y} width={width} height={height} fill={candleColor} />
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  const { t } = useLanguage();
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const format = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
    return (
      <div className="bg-[#18181b] border border-[#27272a] rounded-sm p-3 shadow-lg font-mono text-xs">
        <div className="text-zinc-500 mb-1.5 uppercase text-[10px] tracking-widest">{d.fullDate || d.time}</div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="text-zinc-400">{t('open')}:</div><div className="text-zinc-100 text-right">{d.open ? format(d.open) : '-'}</div>
          <div className="text-zinc-400">{t('high')}:</div><div className="text-zinc-100 text-right">{d.high ? format(d.high) : '-'}</div>
          <div className="text-zinc-400">{t('low')}:</div><div className="text-zinc-100 text-right">{d.low ? format(d.low) : '-'}</div>
          <div className="text-zinc-400">{t('close')}:</div><div className="text-zinc-100 text-right font-bold">{format(d.price)}</div>
        </div>
      </div>
    );
  }
  return null;
};

export function ChartMock({ data }: ChartMockProps) {
  const { t } = useLanguage();
  const [chartType, setChartType] = useState<ChartType>('AREA');
  const chartData = data.history.map(d => ({
    ...d,
    // Fix for candle rendering: height of rect is abs(open-close)
    candleY: Math.min(d.open || d.price, d.price),
    candleH: Math.abs((d.open || d.price) - d.price)
  }));
  
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.low || d.price)) * 0.998 : 0;
  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.high || d.price)) * 1.002 : 100;

  const color = data.trend === 'BULLISH' ? '#10B981' : data.trend === 'BEARISH' ? '#EF4444' : '#3B82F6';

  const renderChart = () => {
    switch (chartType) {
      case 'LINE':
        return (
          <LineChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <YAxis domain={[minPrice, maxPrice]} hide />
            <Line type="monotone" dataKey="price" stroke={color} strokeWidth={1.5} dot={false} />
          </LineChart>
        );
      case 'BAR':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#52525b', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <YAxis domain={[minPrice, maxPrice]} hide />
            <Bar dataKey="price" fill={color} opacity={0.7} />
          </BarChart>
        );
      case 'SCATTER':
        return (
          <ScatterChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <XAxis dataKey="time" hide />
            <YAxis dataKey="price" domain={[minPrice, maxPrice]} hide />
            <Tooltip content={<CustomTooltip />} cursor={{ strokeDasharray: '3 3' }} />
            <Scatter name="Price" dataKey="price" fill={color} />
          </ScatterChart>
        );
      case 'CANDLE':
        return (
          <BarChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <YAxis domain={[minPrice, maxPrice]} hide />
            <Bar 
              dataKey="candleH" 
              shape={(props: any) => {
                const d = chartData[props.index];
                return <Candle {...props} open={d.open} close={d.price} low={d.low} high={d.high} />;
              }}
            />
          </BarChart>
        );
      case 'AREA':
      default:
        return (
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
        );
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-sm flex flex-col overflow-hidden h-full">
      <div className="px-4 py-2.5 bg-zinc-950/50 border-b border-zinc-800 flex justify-between items-center">
        <div className="text-[10px] uppercase font-semibold text-zinc-500">
          {t('syncing')} // {data.asset}
          <span className="ml-3 px-2 py-0.5 bg-zinc-800 rounded-sm text-zinc-300 font-mono">TF: {data.activeTimeframe || '15m'}</span>
        </div>
        <div className="flex items-center space-x-1">
          {[
            { id: 'AREA', icon: Activity, label: t('area') },
            { id: 'LINE', icon: LineChartIcon, label: t('line') },
            { id: 'CANDLE', icon: Layers, label: t('candle') },
            { id: 'BAR', icon: BarChart3, label: t('bar') },
            { id: 'SCATTER', icon: ScatterIcon, label: t('scatter') }
          ].map(type => (
            <button 
              key={type.id}
              onClick={() => setChartType(type.id as ChartType)}
              className={`p-1 rounded-sm transition-colors ${chartType === type.id ? 'bg-zinc-800 text-blue-500' : 'text-zinc-500 hover:text-zinc-300'}`}
              title={type.label}
            >
              <type.icon className="w-3.5 h-3.5" />
            </button>
          ))}
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
          {renderChart()}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
