import React, { useMemo } from 'react';
import { Table, Button, Tag, Space, Card, Popconfirm } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store';
import type { TradeRecord } from '../../store/slices/tradeRecordSlice';
import { deleteRecord } from '../../store/slices/tradeRecordSlice';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface TradeRecordTableProps {
  fundCode: string;
  onSell: (record: TradeRecord) => void;
}

// 格式化金额（统一使用万元）
const formatAmount = (value: number) => {
  return `${(value / 10000).toFixed(2)}万`;
};

const TradeRecordTable: React.FC<TradeRecordTableProps> = ({
  fundCode,
  onSell,
}) => {
  const dispatch = useDispatch();

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
      title: '买入',
      children: [
        {
          title: '日期',
          dataIndex: 'date',
          key: 'date',
          width: 100,
        },
        {
          title: '净值',
          dataIndex: 'netWorth',
          key: 'netWorth',
          width: 80,
          render: (value: number) => value.toFixed(4),
        },
        {
          title: '累计净值',
          dataIndex: 'accNetWorth',
          key: 'accNetWorth',
          width: 80,
          render: (value: number) => value.toFixed(4),
        },
        {
          title: '金额',
          dataIndex: 'buyAmount',
          key: 'buyAmount',
          width: 90,
          render: (value: number) => formatAmount(value),
        },
      ],
    },
    {
      title: '预期卖出',
      children: [
        {
          title: '净值',
          dataIndex: 'expectedSellNetWorth',
          key: 'expectedSellNetWorth',
          width: 80,
          render: (value: number) => value.toFixed(4),
        },
        {
          title: '累计净值',
          dataIndex: 'expectedSellAccNetWorth',
          key: 'expectedSellAccNetWorth',
          width: 80,
          render: (value: number) => value.toFixed(4),
        },
      ],
    },
    {
      title: '实际卖出',
      children: [
        {
          title: '日期',
          dataIndex: 'sellDate',
          key: 'sellDate',
          width: 100,
          render: (value?: string) => value || '-',
        },
        {
          title: '净值',
          dataIndex: 'sellNetWorth',
          key: 'sellNetWorth',
          width: 80,
          render: (value?: number) => value?.toFixed(4) || '-',
        },
        {
          title: '累计净值',
          dataIndex: 'sellAccNetWorth',
          key: 'sellAccNetWorth',
          width: 80,
          render: (value?: number) => value?.toFixed(4) || '-',
        },
        {
          title: '金额',
          dataIndex: 'sellAmount',
          key: 'sellAmount',
          width: 90,
          render: (value?: number) => value ? formatAmount(value) : '-',
        },
      ],
    },
    {
      title: '网格分析',
      children: [
        {
          title: '网格宽度',
          dataIndex: 'actualGridWidth',
          key: 'actualGridWidth',
          width: 90,
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
          title: '盈亏',
          key: 'profit',
          width: 100,
          render: (_, record: TradeRecord) => {
            if (!record.profit) return '-';
            const color = record.profit >= 0 ? '#f43f5e' : '#10b981';
            return (
              <div style={{ color }}>
                <div>{formatAmount(record.profit)}</div>
                <div style={{ fontSize: '12px' }}>
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
      width: 70,
      render: (_: any, record: TradeRecord) => (
        <Space>
          {record.status === 'holding' && record === records[records.findIndex(r => r.status === 'holding')] && (
            <Button 
              type="link" 
              size="small"
              onClick={() => onSell(record)}
            >
              卖出
            </Button>
          )}
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => dispatch(deleteRecord(record.id))}
            okText="确定"
            cancelText="取消"
          >
            <Button 
              type="link" 
              size="small"
              danger
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={records}
      rowKey="id"
      size="small"
      scroll={{ x: 'max-content' }}
      rowClassName={(record) => record.status === 'sold' ? 'text-gray-400' : ''}
      pagination={false}
    />
  );
};

export default TradeRecordTable; 