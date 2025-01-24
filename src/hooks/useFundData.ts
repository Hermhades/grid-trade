import { useState, useEffect } from 'react';
import { api } from '../services/api';

export interface FundData {
  code: string;
  name: string;
  netWorth: number;
  accumulatedNetWorth: number;
  estimatedNetWorth: number;
  estimatedTime: string;
  updateTime: string;
  dayGrowth: number;
}

export const useFundData = (fundCodes: string[]) => {
  const [fundData, setFundData] = useState<Record<string, FundData>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundData = async () => {
      if (fundCodes.length === 0) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const results = await Promise.all(
          fundCodes.map(async (code) => {
            const detail = await api.getFundDetail(code);
            if (!detail) return null;
            return {
              code: detail.code,
              name: detail.name,
              netWorth: detail.netWorth,
              accumulatedNetWorth: detail.accumulatedNetWorth,
              estimatedNetWorth: detail.estimatedNetWorth,
              estimatedTime: detail.estimatedTime,
              updateTime: detail.updateTime,
              dayGrowth: detail.dayGrowth || 0,
            };
          })
        );

        const newFundData: Record<string, FundData> = {};
        results.forEach((result) => {
          if (result) {
            newFundData[result.code] = result;
          }
        });

        setFundData(newFundData);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取基金数据失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFundData();

    // 每分钟更新一次数据
    const timer = setInterval(fetchFundData, 60000);

    return () => {
      clearInterval(timer);
    };
  }, [fundCodes]);

  return { fundData, loading, error };
}; 