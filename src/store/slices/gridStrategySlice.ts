import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface GridStrategy {
  id: string;
  fundCode: string;
  buyWidth: number;
  sellWidth: number;
  gridCount: number;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface GridStrategyState {
  strategies: GridStrategy[];
}

const initialState: GridStrategyState = {
  strategies: [],
};

const gridStrategySlice = createSlice({
  name: 'gridStrategy',
  initialState,
  reducers: {
    addStrategy: (state, action: PayloadAction<Omit<GridStrategy, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>>) => {
      const now = Date.now();
      // 将同一基金的其他策略设置为非激活
      state.strategies = state.strategies.map(strategy => 
        strategy.fundCode === action.payload.fundCode 
          ? { ...strategy, isActive: false }
          : strategy
      );
      
      // 添加新策略
      state.strategies.push({
        ...action.payload,
        id: `${action.payload.fundCode}-${now}`,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
    },
    updateStrategy: (state, action: PayloadAction<{ id: string } & Partial<GridStrategy>>) => {
      const { id, ...updates } = action.payload;
      const strategyIndex = state.strategies.findIndex(s => s.id === id);
      
      if (strategyIndex !== -1) {
        state.strategies[strategyIndex] = {
          ...state.strategies[strategyIndex],
          ...updates,
          updatedAt: Date.now(),
        };
      }
    },
    toggleStrategyStatus: (state, action: PayloadAction<{ id: string, fundCode: string }>) => {
      const { id, fundCode } = action.payload;
      
      // 将同一基金的所有策略设置为非激活
      state.strategies = state.strategies.map(strategy => 
        strategy.fundCode === fundCode 
          ? { ...strategy, isActive: strategy.id === id }
          : strategy
      );
    },
    deleteStrategy: (state, action: PayloadAction<string>) => {
      state.strategies = state.strategies.filter(strategy => strategy.id !== action.payload);
    },
  },
});

export const { addStrategy, updateStrategy, toggleStrategyStatus, deleteStrategy } = gridStrategySlice.actions;

export default gridStrategySlice.reducer; 