import React from 'react';
import { Card, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import classNames from 'classnames';

interface MarketCardProps {
  title: string;
  value: number;
  change: number;
  volume?: number;
  amount?: number;
  loading?: boolean;
}

// 格式化数值，自动选择合适的单位
const formatNumber = (value: number) => {
  const absValue = Math.abs(value);
  if (absValue >= 1000000000000) { // 大于1万亿
    return `${(value / 1000000000000).toFixed(1)}万亿`;
  } else if (absValue >= 100000000) { // 大于1亿
    return `${(value / 100000000).toFixed(1)}亿`;
  } else if (absValue >= 10000) { // 大于1万
    return `${(value / 10000).toFixed(1)}万`;
  }
  return value.toString();
};

const MarketCard: React.FC<MarketCardProps> = ({
  title,
  value,
  change,
  volume,
  amount,
  loading = false,
}) => {
  const isPositive = change >= 0;
  const absChange = Math.abs(change);
  
  // 计算进度条的百分比，±3%为满格
  const progressPercent = Math.min(Math.abs(change) * (100 / 3), 100);

  return (
    <Card
      loading={loading}
      className="h-full backdrop-blur-lg bg-gradient-to-br from-white/30 via-white/20 to-white/10 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] border-0 transition-shadow"
      bodyStyle={{ padding: '12px', height: '100%' }}
    >
      <div className="flex flex-col h-full">
        <div className="text-sm font-medium text-gray-500 mb-2">{title}</div>
        
        <div className="text-2xl font-semibold mb-3">{value.toFixed(2)}</div>
        
        <div className="flex items-center gap-2 mb-3">
          <div className={classNames(
            "flex items-center gap-1 text-sm font-medium whitespace-nowrap",
            isPositive ? "text-rose-500" : "text-emerald-500"
          )}>
            {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            <span>{absChange.toFixed(2)}%</span>
          </div>
          <div className="flex-1">
            <Progress 
              percent={progressPercent}
              showInfo={false}
              strokeColor={isPositive ? "#F43F5E" : "#10B981"}
              trailColor="#E5E7EB"
              size={['100%', 4]}
              className="!m-0"
            />
          </div>
        </div>

        {(volume !== undefined || amount !== undefined) && (
          <div className="grid grid-cols-2 gap-3 mt-auto">
            {volume !== undefined && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">
                  成交量
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formatNumber(volume)}
                </div>
              </div>
            )}
            {amount !== undefined && (
              <div className="min-w-0">
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">
                  成交额
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {formatNumber(amount)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default MarketCard; 