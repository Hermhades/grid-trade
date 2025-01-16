import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FundStarState {
  starredFunds: string[];
}

const initialState: FundStarState = {
  starredFunds: [],
};

const fundStarSlice = createSlice({
  name: 'fundStar',
  initialState,
  reducers: {
    toggleStar: (state, action: PayloadAction<string>) => {
      const fundCode = action.payload;
      const index = state.starredFunds.indexOf(fundCode);
      if (index === -1) {
        state.starredFunds.push(fundCode);
      } else {
        state.starredFunds.splice(index, 1);
      }
    },
    setStarredFunds: (state, action: PayloadAction<string[]>) => {
      state.starredFunds = action.payload;
    },
  },
});

export const { toggleStar, setStarredFunds } = fundStarSlice.actions;

export default fundStarSlice.reducer; 