import React, { useState } from 'react';
import { Card, Input, Table, Button, Space, message } from 'antd';
import { SearchOutlined, PlusOutlined } from '@ant-design/icons';
import type { FundSearchItem } from '../../types/fund';
import { api } from '../../services/api';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;

const FundList: React.FC = () => {
  const [searchResults, setSearchResults] = useState<FundSearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async (value: string) => {
    if (!value.trim()) {
      return;
    }
    
    setLoading(true);
    try {
      const data = await api.searchFunds(value);
      setSearchResults(data);
    } catch (error) {
      console.error('Failed to search funds:', error);
      message.error('搜索失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: '基金代码',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: '基金名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '基金类型',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: FundSearchItem) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate(`/fund/${record.code}`)}
          >
            添加
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="基金搜索" style={{ marginTop: 24 }}>
      <Search
        placeholder="请输入基金代码或名称"
        enterButton={<SearchOutlined />}
        size="large"
        onSearch={handleSearch}
        style={{ marginBottom: 24 }}
        loading={loading}
      />
      <Table
        columns={columns}
        dataSource={searchResults}
        rowKey="code"
        loading={loading}
      />
    </Card>
  );
};

export default FundList;