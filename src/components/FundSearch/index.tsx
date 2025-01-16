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
    setSearchResults([]);
  };

  return (
    <div className="relative w-full">
      <Search
        placeholder="输入基金代码或名称搜索"
        allowClear
        enterButton={<SearchOutlined className="text-sm" />}
        size="middle"
        onChange={(e) => handleSearch(e.target.value)}
        className="mb-1"
        style={{ padding: '4px 0' }}
      />
      
      {loading ? (
        <div className="absolute left-0 right-0 bg-white/80 backdrop-blur-md rounded-lg shadow-lg py-4 z-10">
          <div className="flex justify-center">
            <Spin size="small" />
          </div>
        </div>
      ) : (
        searchResults.length > 0 && (
          <List
            className="absolute left-0 right-0 bg-white/80 backdrop-blur-md rounded-lg shadow-lg max-h-[300px] overflow-y-auto z-10 py-2"
            itemLayout="horizontal"
            dataSource={searchResults}
            renderItem={(item) => (
              <List.Item
                key={item.code}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelect(item)}
              >
                <div className="flex flex-col py-3 px-6 w-full">
                  <div className="flex justify-between items-center gap-4">
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="text-xs text-gray-500 shrink-0">{item.code}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {item.type}
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