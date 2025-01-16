import React, { useEffect, useState } from 'react';
import { Card, Row, Col, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import type { MarketIndex } from '../../types/fund';
import { api } from '../../services/api';

const MarketIndexComponent: React.FC = () => {
  const [indexes, setIndexes] = useState<MarketIndex[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await api.getMarketIndexes();
      setIndexes(data);
    } catch (error) {
      console.error('Failed to fetch market indexes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // 每60秒更新一次数据
    const timer = setInterval(fetchData, 60000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Card title="市场指数" loading={loading}>
      <Row gutter={16}>
        {indexes.map((index) => (
          <Col span={8} key={index.code}>
            <Statistic
              title={index.name}
              value={index.current}
              precision={2}
              valueStyle={{ color: index.change >= 0 ? '#3f8600' : '#cf1322' }}
              prefix={index.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              suffix={`${index.changePercent}%`}
            />
          </Col>
        ))}
      </Row>
    </Card>
  );
};

export default MarketIndexComponent;