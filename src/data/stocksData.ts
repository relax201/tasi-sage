export interface Stock {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  marketCap: number;
  pe: number;
  eps: number;
  recommendation: 'شراء قوي' | 'شراء' | 'احتفاظ' | 'بيع' | 'بيع قوي';
  riskLevel: 'منخفض' | 'متوسط' | 'مرتفع';
  aiScore: number;
}

export interface MarketIndex {
  name: string;
  value: number;
  change: number;
  changePercent: number;
}

export const marketIndices: MarketIndex[] = [
  { name: 'تاسي', value: 12456.78, change: 45.32, changePercent: 0.36 },
  { name: 'نمو', value: 23456.12, change: -123.45, changePercent: -0.52 },
  { name: 'MT30', value: 1567.89, change: 12.34, changePercent: 0.79 },
];

export const stocks: Stock[] = [
  {
    symbol: '2222',
    name: 'أرامكو السعودية',
    sector: 'الطاقة',
    price: 29.85,
    change: 0.35,
    changePercent: 1.19,
    volume: 15234567,
    high: 30.10,
    low: 29.50,
    open: 29.55,
    previousClose: 29.50,
    marketCap: 7125000000000,
    pe: 15.2,
    eps: 1.96,
    recommendation: 'شراء',
    riskLevel: 'منخفض',
    aiScore: 78
  },
  {
    symbol: '1180',
    name: 'الأهلي السعودي',
    sector: 'البنوك',
    price: 41.50,
    change: -0.45,
    changePercent: -1.07,
    volume: 8456123,
    high: 42.00,
    low: 41.20,
    open: 41.80,
    previousClose: 41.95,
    marketCap: 245000000000,
    pe: 12.8,
    eps: 3.24,
    recommendation: 'احتفاظ',
    riskLevel: 'منخفض',
    aiScore: 65
  },
  {
    symbol: '2010',
    name: 'سابك',
    sector: 'المواد الأساسية',
    price: 89.70,
    change: 2.30,
    changePercent: 2.63,
    volume: 5678901,
    high: 90.50,
    low: 87.80,
    open: 88.00,
    previousClose: 87.40,
    marketCap: 269100000000,
    pe: 18.5,
    eps: 4.85,
    recommendation: 'شراء قوي',
    riskLevel: 'متوسط',
    aiScore: 92
  },
  {
    symbol: '7010',
    name: 'اس تي سي',
    sector: 'الاتصالات',
    price: 42.85,
    change: 0.15,
    changePercent: 0.35,
    volume: 3456789,
    high: 43.20,
    low: 42.50,
    open: 42.70,
    previousClose: 42.70,
    marketCap: 214250000000,
    pe: 14.2,
    eps: 3.02,
    recommendation: 'شراء',
    riskLevel: 'منخفض',
    aiScore: 81
  },
  {
    symbol: '1010',
    name: 'الرياض',
    sector: 'البنوك',
    price: 28.95,
    change: -0.25,
    changePercent: -0.86,
    volume: 4567890,
    high: 29.30,
    low: 28.80,
    open: 29.20,
    previousClose: 29.20,
    marketCap: 86850000000,
    pe: 11.5,
    eps: 2.52,
    recommendation: 'احتفاظ',
    riskLevel: 'منخفض',
    aiScore: 58
  },
  {
    symbol: '2350',
    name: 'كيان السعودية',
    sector: 'المواد الأساسية',
    price: 12.48,
    change: 0.58,
    changePercent: 4.87,
    volume: 12345678,
    high: 12.60,
    low: 11.90,
    open: 11.95,
    previousClose: 11.90,
    marketCap: 18720000000,
    pe: 25.3,
    eps: 0.49,
    recommendation: 'شراء قوي',
    riskLevel: 'مرتفع',
    aiScore: 88
  },
  {
    symbol: '4030',
    name: 'البحري',
    sector: 'النقل',
    price: 35.60,
    change: -1.20,
    changePercent: -3.26,
    volume: 2345678,
    high: 36.80,
    low: 35.40,
    open: 36.70,
    previousClose: 36.80,
    marketCap: 44500000000,
    pe: 8.9,
    eps: 4.00,
    recommendation: 'بيع',
    riskLevel: 'متوسط',
    aiScore: 35
  },
  {
    symbol: '4200',
    name: 'الدريس',
    sector: 'التجزئة',
    price: 78.50,
    change: 1.80,
    changePercent: 2.35,
    volume: 1234567,
    high: 79.00,
    low: 76.50,
    open: 76.80,
    previousClose: 76.70,
    marketCap: 7850000000,
    pe: 16.4,
    eps: 4.79,
    recommendation: 'شراء',
    riskLevel: 'متوسط',
    aiScore: 75
  },
];

export const sectors = [
  'الكل',
  'الطاقة',
  'البنوك',
  'المواد الأساسية',
  'الاتصالات',
  'النقل',
  'التجزئة',
  'العقارات',
  'الرعاية الصحية',
];

export const generatePriceHistory = (basePrice: number, days: number = 30) => {
  const data = [];
  let price = basePrice * 0.9;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const change = (Math.random() - 0.48) * basePrice * 0.03;
    price = Math.max(price + change, basePrice * 0.7);
    price = Math.min(price, basePrice * 1.3);
    
    const high = price + Math.random() * basePrice * 0.02;
    const low = price - Math.random() * basePrice * 0.02;
    const open = low + Math.random() * (high - low);
    const close = low + Math.random() * (high - low);
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }
  
  return data;
};

export const generateIndicatorData = (basePrice: number, days: number = 30) => {
  const priceHistory = generatePriceHistory(basePrice, days);
  
  return priceHistory.map((item, index) => {
    const sma20 = index >= 19 
      ? priceHistory.slice(index - 19, index + 1).reduce((sum, p) => sum + p.close, 0) / 20 
      : item.close;
    
    const rsi = 30 + Math.random() * 40;
    const macd = (Math.random() - 0.5) * 2;
    const signal = (Math.random() - 0.5) * 1.5;
    
    return {
      ...item,
      sma20: parseFloat(sma20.toFixed(2)),
      rsi: parseFloat(rsi.toFixed(2)),
      macd: parseFloat(macd.toFixed(3)),
      signal: parseFloat(signal.toFixed(3)),
    };
  });
};
