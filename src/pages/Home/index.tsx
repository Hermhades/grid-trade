import React from 'react';
import { Card, Row, Col, Progress } from 'antd';
import { useMarketData } from '../../hooks/useMarketData';
import { MARKET_INDICES } from '../../services/market';
import FundSearch from '../../components/FundSearch';

const Home: React.FC = () => {
  const { indices, loading, error, lastUpdated } = useMarketData();

  const renderMarketCard = (code: keyof typeof MARKET_INDICES) => {
    const index = indices[code];
    if (!index) {
      return <Card loading={true} bordered={false} />;
    }

    let changeColor = 'text-gray-500';
    let barColor = '#9ca3af';
    let bgGradient = 'from-gray-50/30 via-white/20 to-white/10';
    let changeSign = '';
    
    if (index.change > 0) {
      changeColor = 'text-rose-500';
      barColor = '#f43f5e';
      bgGradient = 'from-rose-50/30 via-white/20 to-white/10';
      changeSign = '+';
    } else if (index.change < 0) {
      changeColor = 'text-emerald-500';
      barColor = '#10b981';
      bgGradient = 'from-emerald-50/30 via-white/20 to-white/10';
    }

    const progressPercent = Math.min(Math.max(Math.abs(index.change) * 10, 0), 100);

    return (
      <Col xs={24} sm={12} md={8} lg={6} key={code}>
        <div className={`backdrop-blur-lg bg-gradient-to-br ${bgGradient} rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] transition-all duration-500 hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] hover:-translate-y-0.5`}>
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-medium text-gray-900 mb-1">
                  {index.name}
                </h3>
                <div className="text-xs font-medium text-gray-400 tracking-wide">
                  {code}
                </div>
              </div>
              <span className={`${changeColor} text-lg font-medium`}>
                {changeSign}{index.change.toFixed(2)}%
              </span>
            </div>
            
            <div className="space-y-4">
              <div className="text-3xl font-light tracking-tight text-gray-900">
                {index.current.toFixed(2)}
              </div>
              
              <Progress 
                percent={progressPercent}
                showInfo={false}
                strokeColor={{
                  '0%': barColor,
                  '100%': barColor + '90'
                }}
                strokeWidth={3}
                trailColor="rgba(0,0,0,0.02)"
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">
                  成交量
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {(index.volume / 10000).toFixed(2)}万
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-gray-400 tracking-wide mb-1">
                  成交额
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {(index.amount / 100000000).toFixed(2)}亿
                </div>
              </div>
            </div>
          </div>
        </div>
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
          {lastUpdated && (
            <div className="backdrop-blur-xl bg-white/60 px-4 py-2 rounded-2xl text-sm font-medium text-gray-700 shadow-sm border border-gray-200/50">
              更新时间：{new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-medium text-gray-900">
            市场概览
          </h2>
        </div>
        <Row gutter={[24, 24]}>
          {Object.keys(MARKET_INDICES).map((code) => 
            renderMarketCard(code as keyof typeof MARKET_INDICES)
          )}
        </Row>
      </main>
    </div>
  );
};

export default Home;