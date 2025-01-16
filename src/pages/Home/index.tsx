import React from 'react';
import { Row, Col } from 'antd';
import { useMarketData } from '../../hooks/useMarketData';
import { MARKET_INDICES } from '../../services/market';
import FundSearch from '../../components/FundSearch';
import FundPortfolioOverview from '../../components/FundPortfolioOverview';
import MarketCard from '../../components/MarketCard';

const MARKET_NAMES = {
  SH: '上证指数',
  HS300: '沪深300',
  CYB: '创业板指',
  KC50: '科创50',
  BANK: '中证银行',
  SEC: '证券公司',
} as const;

const Home: React.FC = () => {
  const { indices, loading, error, lastUpdated } = useMarketData();

  const renderMarketCard = (code: keyof typeof MARKET_INDICES) => {
    const index = indices[code];
    
    return (
      <Col xs={24} sm={12} md={8} lg={6} key={code}>
        <MarketCard
          title={MARKET_NAMES[code]}
          value={index?.current ?? 0}
          change={index?.change ?? 0}
          volume={index?.volume}
          amount={index?.amount}
          loading={!index || loading}
        />
      </Col>
    );
  };

  if (error) {
    return (
      <div className="p-8 backdrop-blur-lg bg-gradient-to-br from-rose-50/30 via-white/20 to-white/10 rounded-3xl shadow-lg">
        <h2 className="text-2xl font-medium text-gray-900 mb-4">市场概览</h2>
        <div className="text-rose-500">加载失败：{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/50 via-white to-slate-50/30">
      <header className="backdrop-blur-lg bg-white/30 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white text-lg font-bold">G</span>
            </div>
            <h1 className="text-xl font-medium bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              网格交易助手
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 space-y-12">
        <div>
          <div className="flex flex-col space-y-1 mb-6">
            <h2 className="text-3xl font-medium text-gray-900">
              市场概览
            </h2>
            {lastUpdated && (
              <span className="text-xs font-medium text-gray-400 tracking-wide">
                最后更新：{new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
          </div>
          <Row gutter={[16, 16]}>
            {Object.entries(MARKET_INDICES).map(([key, _]) => 
              <Col xs={24} sm={12} md={8} lg={4} key={key}>
                <MarketCard
                  title={MARKET_NAMES[key as keyof typeof MARKET_NAMES]}
                  value={indices[key]?.current ?? 0}
                  change={indices[key]?.change ?? 0}
                  volume={indices[key]?.volume}
                  amount={indices[key]?.amount}
                  loading={!indices[key] || loading}
                />
              </Col>
            )}
          </Row>
        </div>

        <FundPortfolioOverview />
      </main>
    </div>
  );
};

export default Home;