import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor } from './store';
import zhCN from 'antd/locale/zh_CN';
import AppLayout from './components/Layout';
import Home from './pages/Home';
import FundPage from './pages/Fund';

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Home />} />
              <Route path="/fund/:code" element={<FundPage />} />
            </Route>
          </Routes>
        </Router>
      </PersistGate>
    </ConfigProvider>
  );
};

export default App;