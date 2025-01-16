import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { MarketState } from '../../types/market';
import { fetchAllMarketIndices } from '../../services/market';

const initialState: MarketState = {
  indices: {},
  loading: false,
  error: null,
  lastUpdated: null,
};

// 异步 action: 获取市场数据
export const fetchMarketData = createAsyncThunk(
  'market/fetchMarketData',
  async () => {
    const data = await fetchAllMarketIndices();
    return data;
  }
);

const marketSlice = createSlice({
  name: 'market',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMarketData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMarketData.fulfilled, (state, action) => {
        state.loading = false;
        state.indices = action.payload;
        state.lastUpdated = Date.now();
      })
      .addCase(fetchMarketData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || '获取市场数据失败';
      });
  },
});

export default marketSlice.reducer; 