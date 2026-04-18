export type Timeframe = '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
export type ActionDecision = 'BUY' | 'SELL' | 'WAIT' | 'REDUCE';

export interface ChartPoint {
  time: string;
  price: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  fullDate?: string;
}

export type ChartType = 'AREA' | 'LINE';

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
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
