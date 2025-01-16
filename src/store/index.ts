import { configureStore } from '@reduxjs/toolkit';
import marketReducer from './slices/marketSlice';

// 创建根reducer
const rootReducer = {
  market: marketReducer,
};

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 