export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
export type ActionDecision = 'BUY' | 'SELL' | 'WAIT' | 'REDUCE';

export interface ChartPoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number; // Added close for clarity in candlesticks
  volume?: number;
  fullDate?: string;
}

export type ChartType = 'AREA' | 'LINE' | 'CANDLE' | 'BAR' | 'SCATTER';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

export interface IndicatorStatus {
  name: string;
  value: string | number;
  signal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  description: string;
}

export interface Order {
  id: string;
  symbol: string;
  type: 'BUY_LIMIT' | 'SELL_LIMIT' | 'BUY_MARKET' | 'SELL_MARKET';
  volume: number;
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  expiration: string;
  expirationDate: string;
  status: 'PENDING' | 'FILLED' | 'CANCELLED' | 'EXPIRED';
  timestamp: number;
}

export interface MarketData {
  asset: string;
  currentPrice: number;
  priceChangePercent: number;
  activeTimeframe?: string;
  timeframes: Timeframe[];
  
  technicalScore: number; // 0-100
  fundamentalScore: number; // 0-100
  sentimentScore: number; // 0-100
  
  confidenceScore: number; // 0-100
  recommendedAction: ActionDecision;
  recommendedStrategy: string;
  
  detailedIndicators: IndicatorStatus[];
  
  tradePlan: {
    entry: number | null;
    stopLoss: number | null;
    takeProfit: number | null;
    riskRewardRatio: number | null;
    suggestedPositionSizePct: number; // Percentage of capital
  };
  
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  trend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  
  history: ChartPoint[];
  news: NewsItem[];
}

export const STRATEGIES = [
  'Trend Following',
  'Breakout',
  'Pullback',
  'Mean Reversion',
  'Momentum',
  'Scalping',
  'Swing Trading',
  'News Trading',
  'Range Trading'
] as const;
