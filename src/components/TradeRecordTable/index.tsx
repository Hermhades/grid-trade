import React, { useMemo } from 'react';
import { Table, Button, Tag, Space, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store';
import type { TradeRecord } from '../../store/slices/tradeRecordSlice';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface TradeRecordTableProps {
  fundCode: string;
  onSell: (record: TradeRecord) => void;
}

// 格式化金额
const formatAmount = (value: number) => {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(2)}万`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(2)}千`;
  } else if (value >= 100) {
    return `${(value / 100).toFixed(2)}百`;
  }
  return value.toFixed(2);
};

const TradeRecordTable: React.FC<TradeRecordTableProps> = ({
  fundCode,
  onSell,
}) => {
  // 获取当前基金的交易记录
  const records = useSelector((state: RootState) =>
    state.tradeRecord.records
      .filter(record => record.fundCode === fundCode)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  );

  // 获取最新的持仓记录
  const latestHoldingRecord = useMemo(() => 
    records.find(record => record.status === 'holding'),
    [records]
  );

  const columns: ColumnsType<TradeRecord> = [
    {
      title: '交易日期',
      dataIndex: 'date',
      key: 'date',
      width: 110,
    },
    {
      title: '净值',
      children: [
        {
          title: '当日',
          dataIndex: 'netWorth',
          key: 'netWorth',
          width: 90,
          render: (value: number) => value.toFixed(4),
        },
        {
          title: '累计',
          dataIndex: 'accNetWorth',
          key: 'accNetWorth',
          width: 90,
          render: (value: number) => value.toFixed(4),
        },
      ],
    },
    {
      title: '买入',
      children: [
        {
          title: '金额',
          dataIndex: 'buyAmount',
          key: 'buyAmount',
          width: 100,
          render: (value: number) => formatAmount(value),
        },
        {
          title: '份额',
          dataIndex: 'buyShares',
          key: 'buyShares',
          width: 100,
          render: (value: number) => formatAmount(value),
        },
      ],
    },
    {
      title: '预期卖出净值',
      children: [
        {
          title: '当日',
          dataIndex: 'expectedSellNetWorth',
          key: 'expectedSellNetWorth',
          width: 90,
          render: (value: number) => value.toFixed(4),
        },
        {
          title: '累计',
          dataIndex: 'expectedSellAccNetWorth',
          key: 'expectedSellAccNetWorth',
          width: 90,
          render: (value: number) => value.toFixed(4),
        },
      ],
    },
    {
      title: '网格宽度',
      dataIndex: 'actualGridWidth',
      key: 'actualGridWidth',
      width: 100,
      render: (value?: number) => {
        if (typeof value !== 'number') return '-';
        const color = value >= 0 ? '#f43f5e' : '#10b981';
        const icon = value >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />;
        return (
          <span style={{ color }}>
            {icon} {Math.abs(value).toFixed(2)}%
          </span>
        );
      },
    },
    {
      title: '卖出记录',
      children: [
        {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          width: 90,
          render: (value: string) => (
            <Tag color={value === 'holding' ? 'processing' : 'default'}>
              {value === 'holding' ? '持有' : '已卖'}
            </Tag>
          ),
        },
        {
          title: '净值',
          dataIndex: 'sellNetWorth',
          key: 'sellNetWorth',
          width: 90,
          render: (value?: number) => value?.toFixed(4) || '-',
        },
        {
          title: '金额',
          dataIndex: 'sellAmount',
          key: 'sellAmount',
          width: 100,
          render: (value?: number) => value ? formatAmount(value) : '-',
        },
        {
          title: '盈亏',
          dataIndex: 'profit',
          key: 'profit',
          width: 100,
          render: (value: number | undefined, record: TradeRecord) => {
            if (typeof value !== 'number') return '-';
            const color = value >= 0 ? '#f43f5e' : '#10b981';
            return (
              <div>
                <div style={{ color }}>{formatAmount(value)}</div>
                <div style={{ color, fontSize: '12px' }}>
                  {record.profitRate?.toFixed(2)}%
                </div>
              </div>
            );
          },
        },
      ],
    },
    {
      title: '操作',
      key: 'action',
      fixed: 'right' as const,
      width: 80,
      render: (_: any, record: TradeRecord) => (
        <Space>
          {record.status === 'holding' && record.id === latestHoldingRecord?.id && (
            <Button 
              type="link" 
              size="small"
              onClick={() => onSell(record)}
            >
              卖出
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card 
      className="backdrop-blur-lg bg-white/80 shadow-lg rounded-2xl border-0"
      bodyStyle={{ padding: 0 }}
    >
      <Table
        columns={columns}
        dataSource={records}
        rowKey="id"
        scroll={{ x: 'max-content' }}
        pagination={false}
        size="middle"
        rowClassName={(record) => {
          if (record.status === 'sold') return 'opacity-60';
          if (record.id === latestHoldingRecord?.id) return 'bg-blue-50';
          return '';
        }}
      />
    </Card>
  );
};

export default TradeRecordTable; 