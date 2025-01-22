import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TradeRecord {
  id: string;
  fundCode: string;
  strategyId: string;
  date: string;
  netWorth: number;
  accNetWorth: number;
  buyAmount: number;
  buyShares: number;
  expectedSellNetWorth: number;
  expectedSellAccNetWorth: number;
  actualGridWidth?: number;
  status: 'holding' | 'sold';
  sellDate?: string;
  sellNetWorth?: number;
  sellAccNetWorth?: number;
  sellAmount?: number;
  profit?: number;
  profitRate?: number;
}

interface TradeRecordState {
  records: TradeRecord[];
}

const initialState: TradeRecordState = {
  records: [],
};

const tradeRecordSlice = createSlice({
  name: 'tradeRecord',
  initialState,
  reducers: {
    // 添加新交易记录
    addRecord: (state, action: PayloadAction<Omit<TradeRecord, 'id' | 'status' | 'buyShares' | 'sellDate' | 'sellNetWorth' | 'sellAccNetWorth' | 'sellAmount' | 'profit' | 'profitRate'>>) => {
      const { 
        fundCode, 
        strategyId, 
        date, 
        netWorth, 
        accNetWorth,
        buyAmount,
        expectedSellNetWorth,
        expectedSellAccNetWorth,
      } = action.payload;

      // 计算买入份额
      const buyShares = buyAmount / netWorth;

      // 获取当前基金的所有记录
      const fundRecords = state.records
        .filter(record => record.fundCode === fundCode)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      // 计算实际网格宽度（如果有上一条记录）
      let actualGridWidth: number | undefined;
      if (fundRecords.length > 0) {
        const lastRecord = fundRecords[fundRecords.length - 1];
        actualGridWidth = ((accNetWorth - lastRecord.accNetWorth) / lastRecord.accNetWorth) * 100;
      }

      // 生成新记录
      const newRecord: TradeRecord = {
        id: `${fundCode}-${Date.now()}`,
        fundCode,
        strategyId,
        date,
        netWorth,
        accNetWorth,
        buyAmount,
        buyShares,
        expectedSellNetWorth,
        expectedSellAccNetWorth,
        actualGridWidth,
        status: 'holding',
      };

      state.records.push(newRecord);
    },

    // 更新预期卖出价格
    updateExpectedSell: (state, action: PayloadAction<{ 
      recordId: string;
      expectedSellNetWorth: number;
      expectedSellAccNetWorth: number;
    }>) => {
      const record = state.records.find(r => r.id === action.payload.recordId);
      if (record) {
        record.expectedSellNetWorth = action.payload.expectedSellNetWorth;
        record.expectedSellAccNetWorth = action.payload.expectedSellAccNetWorth;
      }
    },

    // 卖出操作
    sellRecord: (state, action: PayloadAction<{
      recordId: string;
      sellDate: string;
      sellNetWorth: number;
      sellAccNetWorth: number;
    }>) => {
      const record = state.records.find(r => r.id === action.payload.recordId);
      if (record && record.status === 'holding') {
        record.status = 'sold';
        record.sellDate = action.payload.sellDate;
        record.sellNetWorth = action.payload.sellNetWorth;
        record.sellAccNetWorth = action.payload.sellAccNetWorth;
        
        // 使用累计净值计算盈亏
        const sellAmount = record.buyShares * action.payload.sellAccNetWorth;
        const buyAmount = record.buyShares * record.accNetWorth;
        
        record.sellAmount = sellAmount;
        record.profit = sellAmount - buyAmount;
        record.profitRate = (record.profit / buyAmount) * 100;
      }
    },

    // 删除记录
    deleteRecord: (state, action: PayloadAction<string>) => {
      state.records = state.records.filter(record => record.id !== action.payload);
    },

    setRecords: (state, action: PayloadAction<TradeRecord[]>) => {
      state.records = action.payload;
    },
  },
});

export const { 
  addRecord, 
  updateExpectedSell, 
  sellRecord, 
  deleteRecord,
  setRecords
} = tradeRecordSlice.actions;

export default tradeRecordSlice.reducer; 