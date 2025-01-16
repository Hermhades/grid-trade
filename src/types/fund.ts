// 市场指数类型
export interface MarketIndex {
    code: string;
    name: string;
    current: number;
    change: number;
    changePercent: number;
    updateTime: string;
  }
  
  // 基金搜索结果类型
  export interface FundSearchItem {
    code: string;
    name: string;
    type: string;
  }
  
  // 基金详情类型
  export interface FundDetail {
    code: string;
    name: string;
    netWorth: number;
    accumulatedNetWorth: number;
    estimatedNetWorth: number;
    estimatedTime: string;
    updateTime: string;
  }
  
  // 基金持仓类型
  export interface FundPosition {
    code: string;
    name: string;
    gridWidth: {
      buy: number;
      sell: number;
    };
    gridCount: number;
    positions: {
      amount: number;
      shares: number;
      buyNetWorth: number;
      buyAccumulatedNetWorth: number;
      expectedSellNetWorth: number;
      expectedSellAccumulatedNetWorth: number;
      status: 'holding' | 'sold';
      buyDate: string;
      sellDate?: string;
    }[];
  }