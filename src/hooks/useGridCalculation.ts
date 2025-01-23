import { GridStrategy } from '../store/slices/gridStrategySlice';
import { TradeRecord } from '../store/slices/tradeRecordSlice';

interface GridMetrics {
  gridWidth: number;
  estimatedGridSize: {
    buy: number;
    sell: number;
  };
}

// 获取最近的一次卖出记录
const getLatestSellRecord = (records: TradeRecord[], fundCode: string) => {
  return records
    .filter(record => record.fundCode === fundCode && record.status === 'sold')
    .sort((a, b) => new Date(b.sellDate!).getTime() - new Date(a.sellDate!).getTime())[0];
};

// 获取最新的未卖出记录
const getLatestHoldingRecord = (records: TradeRecord[], fundCode: string) => {
  return records
    .filter(record => record.fundCode === fundCode && record.status === 'holding')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
};

/**
 * 计算网格宽度和预估网格大小
 * @param currentNetWorth 当前净值
 * @param records 交易记录
 * @param fundCode 基金代码
 * @param activeStrategy 当前网格策略
 * @param operationType 操作类型（'buy' 或 'sell'）
 * @returns 计算结果，包含网格宽度和预估网格大小
 */
export const calculateGridMetrics = (
  currentNetWorth: number,
  records: TradeRecord[],
  fundCode: string,
  activeStrategy: GridStrategy,
  operationType: 'buy' | 'sell' = 'buy'
): GridMetrics => {
  let baseNetWorth: number;

  if (operationType === 'sell') {
    // 如果是计划卖出，使用最新未卖出记录的买入净值
    const latestHoldingRecord = getLatestHoldingRecord(records, fundCode);
    baseNetWorth = latestHoldingRecord ? latestHoldingRecord.netWorth : currentNetWorth;
  } else {
    // 如果是计划买入，使用最近一次卖出记录的卖出净值
    const latestSellRecord = getLatestSellRecord(records, fundCode);
    baseNetWorth = latestSellRecord ? latestSellRecord.sellNetWorth! : currentNetWorth;
  }

  // 计算网格宽度
  const gridWidth = ((currentNetWorth - baseNetWorth) / baseNetWorth) * 100;

  // 计算预估网格大小
  const estimatedGridSize = {
    buy: -gridWidth - activeStrategy.buyWidth,  // 买入距离
    sell: activeStrategy.sellWidth - gridWidth,  // 卖出距离
  };

  return {
    gridWidth,
    estimatedGridSize,
  };
};

const useGridCalculation = () => {
  return {
    calculateGridMetrics,
  };
};

export default useGridCalculation; 