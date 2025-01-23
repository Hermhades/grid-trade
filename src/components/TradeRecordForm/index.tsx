import React, { useState, useEffect } from 'react';
import { Form, DatePicker, InputNumber, Button, Space, Card, message, Row, Col, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { addRecord } from '../../store/slices/tradeRecordSlice';
import type { RootState } from '../../store';
import dayjs from 'dayjs';
import { getFundHistory } from '../../services/market';
import useGridCalculation from '../../hooks/useGridCalculation';

const { Text } = Typography;

interface TradeRecordFormProps {
  fundCode: string;
}

const TradeRecordForm: React.FC<TradeRecordFormProps> = ({ fundCode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [realTimeData, setRealTimeData] = useState<{
    netWorth: number;
    lastUpdate: string;
    gridWidth?: number;
    estimatedGridSize?: { buy: number; sell: number };
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  const { calculateGridMetrics } = useGridCalculation();

  // 获取当前激活的策略
  const activeStrategy = useSelector((state: RootState) =>
    state.gridStrategy.strategies.find(s => s.fundCode === fundCode && s.isActive)
  );

  // 获取所有交易记录
  const records = useSelector((state: RootState) =>
    state.tradeRecord.records.filter(record => record.fundCode === fundCode)
  );

  // 获取日期对应的净值数据
  const fetchNetWorthData = async (date: string) => {
    try {
      const data = await getFundHistory(fundCode, date, date);
      if (data.items.length > 0) {
        const { netWorth, totalWorth, isRealTime } = data.items[0];
        
        if (isRealTime) {
          // 如果是实时数据，计算网格宽度并更新状态
          let gridWidth: number | undefined;
          let estimatedGridSize: { buy: number; sell: number } | undefined;
          
          if (activeStrategy) {
            // 计算买入距离
            const buyMetrics = calculateGridMetrics(
              netWorth,
              records,
              fundCode,
              activeStrategy,
              'buy'
            );

            // 计算卖出距离
            const sellMetrics = calculateGridMetrics(
              netWorth,
              records,
              fundCode,
              activeStrategy,
              'sell'
            );

            gridWidth = buyMetrics.gridWidth;
            estimatedGridSize = {
              buy: buyMetrics.estimatedGridSize.buy,
              sell: sellMetrics.estimatedGridSize.sell
            };
          }
          
          setRealTimeData({
            netWorth,
            lastUpdate: data.items[0].date,
            gridWidth,
            estimatedGridSize
          });
          
          // 清空表单数据，因为当日不允许添加记录
          form.setFieldsValue({
            netWorth: undefined,
            accNetWorth: undefined,
          });
        } else {
          // 如果是历史数据，更新表单
          setRealTimeData(null);
          form.setFieldsValue({
            netWorth,
            accNetWorth: totalWorth,
          });
        }
        return { netWorth, accNetWorth: totalWorth, isRealTime };
      }
      throw new Error('未找到净值数据');
    } catch (error) {
      message.error('获取净值数据失败');
      return null;
    }
  };

  // 组件初始化时自动加载当日数据
  useEffect(() => {
    if (selectedDate?.isSame(dayjs(), 'day')) {
      fetchNetWorthData(selectedDate.format('YYYY-MM-DD'));
    }
  }, []);

  // 监听记录变化，重新计算网格距离
  useEffect(() => {
    if (selectedDate?.isSame(dayjs(), 'day')) {
      fetchNetWorthData(selectedDate.format('YYYY-MM-DD'));
    }
  }, [records]);

  // 自动刷新实时数据
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    const refreshData = async () => {
      if (selectedDate?.isSame(dayjs(), 'day')) {
        await fetchNetWorthData(selectedDate.format('YYYY-MM-DD'));
      }
    };

    if (selectedDate?.isSame(dayjs(), 'day')) {
      refreshData();
      timer = setInterval(refreshData, 60000); // 每分钟刷新一次
    }

    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [selectedDate, fundCode, records]);

  const handleDateChange = async (date: dayjs.Dayjs | null) => {
    setSelectedDate(date);
    if (date) {
      setLoading(true);
      await fetchNetWorthData(date.format('YYYY-MM-DD'));
      setLoading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!activeStrategy) {
      message.error('请先设置网格交易策略');
      return;
    }

    try {
      // 计算实际买入金额（单位：元）
      const actualAmount = values.buyAmount * 10000;
      
      // 计算预期卖出净值
      const expectedSellNetWorth = values.netWorth * (1 + activeStrategy.sellWidth / 100);
      const expectedSellAccNetWorth = values.accNetWorth * (1 + activeStrategy.sellWidth / 100);

      dispatch(addRecord({
        fundCode,
        strategyId: activeStrategy.id,
        date: values.date.format('YYYY-MM-DD'),
        netWorth: values.netWorth,
        accNetWorth: values.accNetWorth,
        buyAmount: actualAmount,
        expectedSellNetWorth,
        expectedSellAccNetWorth,
      }));

      form.resetFields();
      message.success('交易记录添加成功');
    } catch (error) {
      message.error('交易记录添加失败');
    }
  };

  return (
    <Card 
      title="添加交易记录" 
      className="backdrop-blur-lg bg-white/80 shadow-lg rounded-2xl border-0"
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          date: dayjs(),
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="交易日期"
              name="date"
              rules={[{ required: true, message: '请选择交易日期' }]}
            >
              <DatePicker 
                style={{ width: '100%' }}
                disabledDate={(current) => {
                  const today = dayjs().endOf('day');
                  return current > today;
                }}
                onChange={handleDateChange}
                disabled={loading}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="买入金额（万元）"
              required
            >
              <Form.Item
                name="buyAmount"
                noStyle
                rules={[
                  { required: true, message: '请输入买入金额' },
                  { type: 'number', min: 0.01, message: '买入金额必须大于0' }
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0.01}
                  step={1}
                  precision={2}
                />
              </Form.Item>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="当日净值"
              name="netWorth"
              rules={[{ required: true, message: '请等待净值数据加载' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                disabled
                precision={4}
              />
            </Form.Item>
            {realTimeData && (
              <div className="mt-2">
                <Text type="secondary">
                  当前净值: {realTimeData.netWorth.toFixed(4)}
                  {realTimeData.gridWidth !== undefined && (
                    <span style={{ color: realTimeData.gridWidth >= 0 ? '#f43f5e' : '#10b981' }}>
                      {' '}(宽度: {realTimeData.gridWidth.toFixed(2)}%)
                    </span>
                  )}
                  <br />
                  更新时间: {realTimeData.lastUpdate}
                  <div className="flex items-center space-x-2">
                    <span>预估网格大小:</span>
                    {realTimeData.estimatedGridSize ? (
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          {realTimeData.estimatedGridSize.buy >= 0 ? (
                            <span className="inline-flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                                可买入
                              </span>
                              <span className="ml-2">溢{Math.abs(realTimeData.estimatedGridSize.buy).toFixed(2)}%</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700">
                                距买入
                              </span>
                              <span className="ml-2">差{Math.abs(realTimeData.estimatedGridSize.buy).toFixed(2)}%</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center">
                          {realTimeData.estimatedGridSize.sell <= 0 ? (
                            <span className="inline-flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-blue-100 text-blue-800">
                                可卖出
                              </span>
                              <span className="ml-2">溢{Math.abs(realTimeData.estimatedGridSize.sell).toFixed(2)}%</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center">
                              <span className="inline-flex items-center px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700">
                                距卖出
                              </span>
                              <span className="ml-2">差{Math.abs(realTimeData.estimatedGridSize.sell).toFixed(2)}%</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ) : '-'}
                  </div>
                </Text>
              </div>
            )}
          </Col>
          <Col span={12}>
            <Form.Item
              label="累计净值"
              name="accNetWorth"
              rules={[{ required: !selectedDate?.isSame(dayjs(), 'day'), message: '请等待净值数据加载' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                disabled
                precision={4}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16} className="mt-4">
          <Col span={12}>
          </Col>
          <Col span={12}>
            <Space className="w-full justify-end">
              <Button onClick={() => form.resetFields()}>
                重置
              </Button>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                disabled={selectedDate?.isSame(dayjs(), 'day')}
              >
                添加记录
              </Button>
            </Space>
          </Col>
        </Row>
      </Form>
    </Card>
  );
};

export default TradeRecordForm; 