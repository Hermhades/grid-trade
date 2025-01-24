import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Spin, Button, Statistic, Row, Col, Divider, message, Popover } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { getFundFullDetail, FundDetail, getFundHistory } from '../../services/market';
import GridStrategyForm from '../../components/GridStrategyForm';
import TradeRecordForm from '../../components/TradeRecordForm';
import TradeRecordTable from '../../components/TradeRecordTable';
import SellModal from '../../components/SellModal';
import type { TradeRecord } from '../../store/slices/tradeRecordSlice';
import FundChart from '../../components/FundChart';
import dayjs from 'dayjs';

const FundPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [fundDetail, setFundDetail] = useState<FundDetail | null>(null);
  const [sellModalVisible, setSellModalVisible] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TradeRecord | null>(null);
  const [historyData, setHistoryData] = useState<{
    date: string;
    netWorth: number;
    accNetWorth: number;
  }[]>([]);

  useEffect(() => {
    const fetchFundDetail = async () => {
      if (!code) return;
      try {
        const detail = await getFundFullDetail(code);
        setFundDetail(detail);
      } catch (error) {
        message.error('获取基金详情失败');
      } finally {
        setLoading(false);
      }
    };

    fetchFundDetail();
  }, [code]);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!code) return;
      
      const endDate = dayjs().format('YYYY-MM-DD');
      const startDate = dayjs().subtract(90, 'day').format('YYYY-MM-DD');
      
      try {
        const data = await getFundHistory(code, startDate, endDate);
        setHistoryData(data.items.map(item => ({
          date: item.date,
          netWorth: item.netWorth,
          accNetWorth: item.totalWorth
        })));
      } catch (error) {
        message.error('获取历史数据失败');
      }
    };

    fetchHistoryData();
  }, [code]);

  const handleSell = (record: TradeRecord) => {
    setSelectedRecord(record);
    setSellModalVisible(true);
  };

  if (!code) {
    return <div>基金代码不存在</div>;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100/50 via-white to-slate-50/30">
      <header className="backdrop-blur-lg bg-white/30 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-8 py-4">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/')}
            className="text-gray-600 hover:text-gray-900"
          >
            返回首页
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <Spin size="large" />
          </div>
        ) : fundDetail ? (
          <div className="space-y-8">
            {/* 基金基本信息 */}
            <Card className="backdrop-blur-lg bg-white/80 shadow-lg rounded-2xl border-0">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-medium text-gray-900">
                    {fundDetail.name}
                  </h1>
                  <p className="text-gray-500">{fundDetail.code}</p>
                </div>

                <Row gutter={48}>
                  <Col span={8}>
                    <Statistic
                      title="单位净值"
                      value={fundDetail.netWorth}
                      precision={4}
                    />
                  </Col>
                  <Col span={8}>
                    <Statistic
                      title="累计净值"
                      value={fundDetail.totalWorth}
                      precision={4}
                    />
                  </Col>
                  <Col span={8}>
                    <Popover
                      content={
                        <div className="w-[600px] h-[300px] flex items-center justify-center">
                          <div className="relative w-full h-full flex items-center justify-center">
                            <Spin spinning={true} className="absolute" />
                            <img 
                              src={`http://j4.dfcfw.com/charts/pic6/${fundDetail.code}.png`}
                              alt="日内净值估算走势"
                              className="max-w-full max-h-full opacity-0 transition-opacity duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '暂无日内数据';
                                }
                              }}
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.classList.remove('opacity-0');
                                const spin = target.parentElement?.querySelector('.ant-spin');
                                if (spin) {
                                  spin.remove();
                                }
                              }}
                            />
                          </div>
                        </div>
                      }
                      title="日内净值估算走势"
                      trigger="hover"
                      placement="bottom"
                    >
                      <Statistic
                        title="日涨幅"
                        value={fundDetail.dayGrowth}
                        precision={2}
                        suffix="%"
                        valueStyle={{
                          color: fundDetail.dayGrowth > 0 ? '#f43f5e' : 
                                fundDetail.dayGrowth < 0 ? '#10b981' : '#6b7280'
                        }}
                      />
                    </Popover>
                  </Col>
                </Row>

                <Divider />

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">基金经理：</span>
                    <span className="text-gray-900">{fundDetail.manager}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">资产规模：</span>
                    <span className="text-gray-900">{fundDetail.fundScale}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">成立来分红：</span>
                    <span className="text-gray-900">{fundDetail.dividend}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">管理费率：</span>
                    <span className="text-gray-900">{fundDetail.managementFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">托管费率：</span>
                    <span className="text-gray-900">{fundDetail.custodianFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">销售服务费率：</span>
                    <span className="text-gray-900">{fundDetail.serviceFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">最高认购费率：</span>
                    <span className="text-gray-900">{fundDetail.subscriptionFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">最高申购费率：</span>
                    <span className="text-gray-900">{fundDetail.purchaseFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">最高赎回费率：</span>
                    <span className="text-gray-900">{fundDetail.redemptionFee}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">最后更新：</span>
                    <span className="text-gray-900">{fundDetail.lastUpdate}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 网格交易策略表单 */}
            <GridStrategyForm fundCode={code} />

            {/* 交易记录表单和表格 */}
            <div className="space-y-8">
              <TradeRecordForm fundCode={code} />
              <TradeRecordTable 
                fundCode={code}
                onSell={handleSell}
              />
            </div>

            {/* 卖出弹窗 */}
            {selectedRecord && (
              <SellModal
                record={selectedRecord}
                visible={sellModalVisible}
                onClose={() => {
                  setSellModalVisible(false);
                  setSelectedRecord(null);
                }}
              />
            )}

            {/* 添加图表组件 */}
            {code && <FundChart fundCode={code} historyData={historyData} />}
          </div>
        ) : (
          <div className="text-center text-gray-500">未找到基金信息</div>
        )}
      </main>
    </div>
  );
};

export default FundPage; 