import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import marketReducer from './slices/marketSlice';
import gridStrategyReducer from './slices/gridStrategySlice';
import tradeRecordReducer from './slices/tradeRecordSlice';
import fundStarReducer from './slices/fundStarSlice';

// Persist 配置
const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['gridStrategy', 'tradeRecord', 'fundStar'], // 添加fundStar到持久化列表
};

// 创建根reducer
const rootReducer = combineReducers({
  market: marketReducer,
  gridStrategy: gridStrategyReducer,
  tradeRecord: tradeRecordReducer,
  fundStar: fundStarReducer,
});

// 持久化根reducer
const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 