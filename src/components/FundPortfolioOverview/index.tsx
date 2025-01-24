import React, { useState, useMemo } from 'react';
import {Row, Col, Tag, Button, Space, Spin } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, StarFilled, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { useFundData } from '../../hooks/useFundData';
import { toggleStar } from '../../store/slices/fundStarSlice';
import type { TradeRecord } from '../../store/slices/tradeRecordSlice';
import FundSearch from '../FundSearch';
import useGridCalculation from '../../hooks/useGridCalculation';

interface FundCard {
  code: string;
  name: string;
  currentGrids: number;
  maxGrids: number;
  totalProfit: number;
  profitPercentage: number;
  dayGrowth: number;
  lastOperation: {
    type: 'buy' | 'sell';
    date: string;
    price: number;
  };
  nextGridWidth: {
    buy: number;
    sell: number;
  };
  isStarred: boolean;
  strategy: {
    buyWidth: number;
    sellWidth: number;
  };
}

const FundPortfolioOverview: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [sortBy, setSortBy] = useState<'grids' | 'profit' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // 从Redux获取数据
  const gridStrategies = useSelector((state: RootState) => state.gridStrategy.strategies);
  const tradeRecords = useSelector((state: RootState) => state.tradeRecord.records);
  const starredFunds = useSelector((state: RootState) => state.fundStar.starredFunds);

  // 获取所有配置过网格策略的基金代码
  const fundCodes = useMemo(() => 
    [...new Set(gridStrategies.map(s => s.fundCode))],
    [gridStrategies]
  );

  // 获取基金数据
  const { fundData, loading: fundDataLoading, error: fundDataError } = useFundData(fundCodes);

  const { calculateGridMetrics } = useGridCalculation();

  // 处理基金数据
  const fundCards = useMemo(() => {
    const cards: FundCard[] = [];
    
    fundCodes.forEach(code => {
      // 获取当前激活的策略
      const activeStrategy = gridStrategies.find(s => s.fundCode === code && s.isActive);
      if (!activeStrategy) return;

      // 获取基金详情
      const fund = fundData[code];
      if (!fund) return;

      // 获取该基金的所有交易记录
      const fundRecords = tradeRecords.filter(r => r.fundCode === code);

      // 计算当前持仓数量
      const holdingRecords = fundRecords.filter(r => r.status === 'holding');
      const currentGrids = holdingRecords.length;

      // 计算当前市值
      const currentNetWorth = fund.estimatedNetWorth || fund.netWorth;
      const currentMarketValue = holdingRecords.reduce((sum, record) =>
        sum + (record.buyShares * currentNetWorth), 0);

      // 计算持仓成本
      const holdingCost = holdingRecords.reduce((sum, record) =>
        sum + record.buyAmount, 0);

      // 计算持仓收益率
      const profitPercentage = holdingCost > 0
        ? ((currentMarketValue - holdingCost) / holdingCost) * 100
        : 0;

      // 获取最近一次操作日期和类型
      const lastOperation = (() => {
        let lastDate = '';
        let operationType: 'buy' | 'sell' = 'buy';
        let operationPrice = 0;
        let lastRecord: TradeRecord | null = null;

        fundRecords.forEach(record => {
          // 检查买入日期
          if (record.date > lastDate) {
            lastDate = record.date;
            operationType = 'buy';
            operationPrice = record.netWorth;
            lastRecord = record;
          }
          // 检查卖出日期
          if (record.sellDate && record.sellDate > lastDate) {
            lastDate = record.sellDate;
            operationType = 'sell';
            operationPrice = record.sellNetWorth!;
            lastRecord = record;
          }
        });

        return {
          operation: lastDate ? {
            type: operationType,
            date: lastDate,
            price: operationPrice,
          } : {
            type: 'buy' as const,
            date: '-',
            price: 0,
          },
          record: lastRecord
        };
      })();
      
      // 计算距离下次操作的网格宽度
      let nextGridWidth = {
        buy: 0,
        sell: 0
      };

      if (activeStrategy) {
        const currentNetWorth = fund.estimatedNetWorth || fund.netWorth;
        
        // 计算买入距离
        const buyMetrics = calculateGridMetrics(
          currentNetWorth,
          fundRecords,
          code,
          activeStrategy,
          'buy'
        );

        // 计算卖出距离
        const sellMetrics = calculateGridMetrics(
          currentNetWorth,
          fundRecords,
          code,
          activeStrategy,
          'sell'
        );

        nextGridWidth = {
          buy: buyMetrics.estimatedGridSize.buy,
          sell: sellMetrics.estimatedGridSize.sell
        };
      }

      cards.push({
        code,
        name: fund.name,
        currentGrids,
        maxGrids: activeStrategy.gridCount,
        totalProfit: profitPercentage,
        profitPercentage,
        dayGrowth: fund.dayGrowth || 0,
        lastOperation: lastOperation.operation,
        nextGridWidth,
        isStarred: starredFunds.includes(code),
        strategy: {
          buyWidth: activeStrategy.buyWidth,
          sellWidth: activeStrategy.sellWidth,
        },
      });
    });

    return cards;
  }, [fundCodes, fundData, gridStrategies, tradeRecords, starredFunds, calculateGridMetrics]);

  // 排序和过滤逻辑
  const sortedFundCards = useMemo(() => {
    let sorted = [...fundCards];
    
    // 首先按照是否置顶排序
    sorted.sort((a, b) => {
      if (a.isStarred === b.isStarred) {
        switch (sortBy) {
          case 'grids':
            return sortOrder === 'asc' 
              ? a.currentGrids - b.currentGrids 
              : b.currentGrids - a.currentGrids;
          case 'profit':
            return sortOrder === 'asc'
              ? a.totalProfit - b.totalProfit
              : b.totalProfit - a.totalProfit;
          case 'date':
            return sortOrder === 'asc'
              ? new Date(a.lastOperation.date).getTime() - new Date(b.lastOperation.date).getTime()
              : new Date(b.lastOperation.date).getTime() - new Date(a.lastOperation.date).getTime();
          default:
            return 0;
        }
      }
      return a.isStarred ? -1 : 1;
    });

    return sorted;
  }, [fundCards, sortBy, sortOrder]);

  const handleToggleStar = (code: string) => {
    dispatch(toggleStar(code));
  };

  const renderFundCard = (fund: FundCard) => {
    const profitColor = fund.totalProfit >= 0 ? 'text-rose-500' : 'text-emerald-500';
    const dayGrowthColor = fund.dayGrowth >= 0 ? 'text-rose-500' : 'text-emerald-500';

    return (
      <Col xs={24} sm={12} lg={8} xl={6} key={fund.code}>
        <div 
          className="backdrop-blur-lg bg-gradient-to-br from-slate-50/30 via-white/20 to-white/10 rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5 cursor-pointer h-[280px]"
          onClick={() => navigate(`/fund/${fund.code}`)}
        >
          <div className="p-6 space-y-6 h-full">
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-medium text-gray-900 mb-1 truncate">
                  {fund.name}
                </h3>
                <div className="text-xs font-medium text-gray-400 tracking-wide">
                  {fund.code}
                </div>
                <div className="text-xs text-gray-400 mt-1 tracking-wide">
                  网格策略：买入{fund.strategy.buyWidth}% / 卖出{fund.strategy.sellWidth}%
                </div>
              </div>
              <Button 
                type="text" 
                icon={fund.isStarred ? <StarFilled className="text-yellow-400" /> : <StarOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleStar(fund.code);
                }}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">持仓网格</div>
                <div className="text-lg font-medium">
                  {fund.currentGrids}/{fund.maxGrids}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">持仓收益</div>
                <div className={`text-lg font-medium ${profitColor}`}>
                  {fund.totalProfit >= 0 ? '+' : ''}{fund.totalProfit.toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">日涨幅</div>
                <div className={`text-lg font-medium ${dayGrowthColor}`}>
                  {fund.dayGrowth >= 0 ? '+' : ''}{fund.dayGrowth.toFixed(2)}%
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">最近操作</div>
              {fund.lastOperation.date !== '-' ? (
                <div className="flex items-center space-x-2">
                  <Tag color={fund.lastOperation.type === 'buy' ? 'green' : 'red'}>
                    {fund.lastOperation.type === 'buy' ? '买入' : '卖出'}
                  </Tag>
                  <span className="text-sm text-gray-500">
                    {fund.lastOperation.date}
                  </span>
                  <span className="text-sm text-gray-500">
                    @{fund.lastOperation.price.toFixed(4)}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-gray-400">暂无操作记录</span>
              )}
            </div>

            <div>
              <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">距离操作</div>
              <div>
                {fund.lastOperation.date !== '-' ? (
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="flex-1">
                        {fund.nextGridWidth.buy >= 0 ? (
                          <span className="inline-flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                              可买入
                            </span>
                            <span className="ml-2">溢 {Math.abs(fund.nextGridWidth.buy).toFixed(2)}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700">
                              距买入
                            </span>
                            <span className="ml-2">差 {Math.abs(fund.nextGridWidth.buy).toFixed(2)}%</span>
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="flex-1">
                        {fund.nextGridWidth.sell <= 0 ? (
                          <span className="inline-flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                              可卖出
                            </span>
                            <span className="ml-2">溢 {Math.abs(fund.nextGridWidth.sell).toFixed(2)}%</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700">
                              距卖出
                            </span>
                            <span className="ml-2">差 {Math.abs(fund.nextGridWidth.sell).toFixed(2)}%</span>
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400">暂无操作记录</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Col>
    );
  };

  if (fundDataError) {
    return (
      <div className="p-8 backdrop-blur-lg bg-gradient-to-br from-rose-50/30 via-white/20 to-white/10 rounded-3xl shadow-lg">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">基金持仓概览</h2>
        <div className="text-rose-500">加载失败：{fundDataError}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:justify-between sm:items-center">
        <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-8">
          <div>
            <h2 className="text-2xl font-medium text-gray-900">
              基金持仓概览
            </h2>
            {!fundDataLoading && fundCards.length > 0 && (
              <span className="text-sm text-gray-400">
                最后更新：{new Date().toLocaleTimeString()}
              </span>
            )}
          </div>
          <div className="w-full sm:w-96">
            <FundSearch />
          </div>
        </div>
        <Space wrap className="self-end sm:self-auto">
          <Button 
            type={sortBy === 'grids' ? 'primary' : 'default'}
            onClick={() => {
              if (sortBy === 'grids') {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('grids');
                setSortOrder('desc');
              }
            }}
          >
            按网格数量排序
            {sortBy === 'grids' && (
              sortOrder === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />
            )}
          </Button>
          <Button
            type={sortBy === 'profit' ? 'primary' : 'default'}
            onClick={() => {
              if (sortBy === 'profit') {
                setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
              } else {
                setSortBy('profit');
                setSortOrder('desc');
              }
            }}
          >
            按盈亏排序
            {sortBy === 'profit' && (
              sortOrder === 'asc' ? <ArrowUpOutlined /> : <ArrowDownOutlined />
            )}
          </Button>
        </Space>
      </div>

      {fundDataLoading ? (
        <div className="flex justify-center items-center p-12">
          <Spin size="large" />
        </div>
      ) : fundCards.length === 0 ? (
        <div className="p-8 backdrop-blur-lg bg-gradient-to-br from-slate-50/30 via-white/20 to-white/10 rounded-3xl shadow-lg">
          <div className="text-center text-gray-500">
            <p className="text-lg mb-4">暂无基金持仓</p>
            <p className="text-sm">请先使用搜索功能添加基金，并设置网格交易策略</p>
          </div>
        </div>
      ) : (
        <Row gutter={[24, 24]}>
          {sortedFundCards.map(renderFundCard)}
        </Row>
      )}
    </div>
  );
};

export default FundPortfolioOverview; 