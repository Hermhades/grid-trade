export interface MarketIndex {
  code: string;      // 指数代码
  name: string;      // 指数名称
  current: number;   // 当前点位
  change: number;    // 涨跌幅
  volume: number;    // 成交量（手）
  amount: number;    // 成交额（万元）
}

export interface MarketState {
  indices: {
    [key: string]: MarketIndex;
  };
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
} 