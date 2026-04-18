/**
 * Maps OANDA instrument names to Yahoo Finance symbols for charting
 * OANDA: EUR_USD, XAU_USD, NAS100_USD
 * YAHOO: EURUSD=X, GC=F, NQ=F
 */
export function oandaToYahoo(oandaSymbol: string): string {
  const mapping: Record<string, string> = {
    'EUR_USD': 'EURUSD=X',
    'GBP_USD': 'GBPUSD=X',
    'USD_JPY': 'JPY=X',
    'USD_CAD': 'CAD=X',
    'AUD_USD': 'AUDUSD=X',
    'NZD_USD': 'NZDUSD=X',
    'USD_CHF': 'CHF=X',
    
    'XAU_USD': 'GC=F',
    'XAG_USD': 'SI=F',
    
    'NAS100_USD': 'NQ=F',
    'US30_USD': 'YM=F',
    'SPX500_USD': 'ES=F',
    'US2000_USD': 'RTY=F',
    'UK100_GBP': 'FTSE',
    'DE30_EUR': 'DAX',
    
    'BCO_USD': 'CL=F',
    'NATGAS_USD': 'NG=F',
    'CORN_USD': 'ZC=F',
    
    'BTC_USD': 'BTC-USD',
    'ETH_USD': 'ETH-USD',
    'SOL_USD': 'SOL-USD',
  };

  return mapping[oandaSymbol] || oandaSymbol.replace('_', '');
}

export function yahooToOanda(yahooSymbol: string): string {
  const mapping: Record<string, string> = {
    'EURUSD=X': 'EUR_USD',
    'GBPUSD=X': 'GBP_USD',
    'JPY=X': 'USD_JPY',
    'CAD=X': 'USD_CAD',
    'GC=F': 'XAU_USD',
    'SI=F': 'XAG_USD',
    'NQ=F': 'NAS100_USD',
    'YM=F': 'US30_USD',
    'ES=F': 'SPX500_USD',
    'CL=F': 'BCO_USD',
    'BTC-USD': 'BTC_USD',
    'ETH-USD': 'ETH_USD'
  };

  return mapping[yahooSymbol] || yahooSymbol;
}
