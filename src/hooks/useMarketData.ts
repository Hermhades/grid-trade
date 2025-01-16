import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { fetchMarketData } from '../store/slices/marketSlice';
import { AppDispatch } from '../store';

const REFRESH_INTERVAL = 10000; // 10秒刷新一次

export const useMarketData = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { indices, loading, error, lastUpdated } = useSelector(
    (state: RootState) => state.market
  );

  useEffect(() => {
    // 首次加载数据
    dispatch(fetchMarketData());

    // 设置定时刷新
    const timer = setInterval(() => {
      dispatch(fetchMarketData());
    }, REFRESH_INTERVAL);

    return () => clearInterval(timer);
  }, [dispatch]);

  return {
    indices,
    loading,
    error,
    lastUpdated,
  };
}; 