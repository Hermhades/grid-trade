import React, { useState, useCallback } from 'react';
import { Input, List, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { debounce } from 'lodash-es';
import { searchFunds, FundSearchResult } from '../../services/market';

const { Search } = Input;

interface FundSearchProps {
  onSelect?: (fund: FundSearchResult) => void;
}

const FundSearch: React.FC<FundSearchProps> = ({ onSelect }) => {
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = useCallback(
    debounce(async (value: string) => {
      if (!value.trim()) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const results = await searchFunds(value);
        setSearchResults(results);
      } finally {
        setLoading(false);
      }
    }, 300),
    []
  );

  const handleSelect = (fund: FundSearchResult) => {
    if (onSelect) {
      onSelect(fund);
    } else {
      navigate(`/fund/${fund.code}`);
    }
  };

  return (
    <div className="w-full max-w-xl">
      <Search
        placeholder="输入基金代码或名称搜索"
        allowClear
        enterButton={<SearchOutlined />}
        size="large"
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-4"
      />
      
      {loading ? (
        <div className="flex justify-center py-4">
          <Spin />
        </div>
      ) : (
        searchResults.length > 0 && (
          <List
            className="bg-white/80 backdrop-blur-md rounded-lg shadow-lg"
            itemLayout="horizontal"
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                className="cursor-pointer hover:bg-gray-50 px-4"
                onClick={() => handleSelect(item)}
              >
                <div className="flex flex-col">
                  <div className="text-lg font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">
                    {item.code} | {item.type}
                  </div>
                </div>
              </List.Item>
            )}
          />
        )
      )}
    </div>
  );
};

export default FundSearch; 