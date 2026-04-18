export interface MarketStatus {
  isOpen: boolean;
  message: string;
}

export function getMarketStatus(symbol: string): MarketStatus {
  // Determine asset class based on symbol
  const isCrypto = symbol.includes('-USD');
  const isForex = symbol.includes('=X');
  const isFutures = symbol.includes('=F');
  const isStock = !isCrypto && !isForex && !isFutures;

  const now = new Date();
  
  if (isCrypto) {
    return { isOpen: true, message: '24/7 OPEN // NEXT CLOSE: N/A' };
  }

  // Get current time in New York (EST/EDT)
  const nyTime = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  const day = nyTime.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const hours = nyTime.getHours();
  const minutes = nyTime.getMinutes();
  const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

  const formatNextTime = (targetDay: number, targetHours: number, targetMins: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return `${days[targetDay]} ${targetHours.toString().padStart(2, '0')}:${targetMins.toString().padStart(2, '0')} EST`;
  };

  if (isStock) {
    // US Stocks: Mon-Fri 09:30 to 16:00
    const isWeekend = day === 0 || day === 6;
    const isBeforeOpen = hours < 9 || (hours === 9 && minutes < 30);
    const isAfterClose = hours >= 16;
    
    if (isWeekend || isBeforeOpen || isAfterClose) {
      let nextDay = day;
      if (isAfterClose) nextDay = (day + 1) % 7;
      if (nextDay === 6) nextDay = 1; // Skip Saturday to Monday
      if (nextDay === 0) nextDay = 1; // Skip Sunday to Monday
      
      const nextOpen = formatNextTime(nextDay, 9, 30);
      return { isOpen: false, message: `CLOSED // NEXT OPEN: ${nextOpen}` };
    } else {
      const nextClose = formatNextTime(day, 16, 0);
      return { isOpen: true, message: `OPEN // NEXT CLOSE: ${nextClose}` };
    }
  }

  if (isForex || isFutures) {
    // Forex/Futures approx: Sun 17:00 to Fri 17:00
    // Simplified logic: Weekly close from Friday 17:00 to Sunday 17:00
    const isWeekendClose = (day === 5 && hours >= 17) || day === 6 || (day === 0 && hours < 17);
    
    if (isWeekendClose) {
      const nextOpen = formatNextTime(0, 17, 0);
      return { isOpen: false, message: `CLOSED // NEXT OPEN: ${nextOpen}` };
    } else {
      let nextCloseStr = '';
      if (day === 5) {
        nextCloseStr = formatNextTime(5, 17, 0);
      } else {
        // Technically next daily close logic can go here, but for simplicity we mention Friday week close
        nextCloseStr = formatNextTime(5, 17, 0);
      }
      return { isOpen: true, message: `OPEN // WEEKLY CLOSE: ${nextCloseStr}` };
    }
  }

  return { isOpen: true, message: 'OPEN' };
}
