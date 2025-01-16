import React, { useState, useEffect } from 'react';
import { Form, DatePicker, InputNumber, Button, Space, Card, message, Row, Col, Typography } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { addRecord } from '../../store/slices/tradeRecordSlice';
import type { RootState } from '../../store';
import dayjs from 'dayjs';
import { getFundHistory } from '../../services/market';

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
    estimatedGridSize?: number;
  } | null>(null);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(dayjs());

  // 获取当前激活的策略
  const activeStrategy = useSelector((state: RootState) =>
    state.gridStrategy.strategies.find(s => s.fundCode === fundCode && s.isActive)
  );

  // 获取最新的持仓记录
  const latestHoldingRecord = useSelector((state: RootState) => {
    const records = state.tradeRecord.records
      .filter(record => record.fundCode === fundCode && record.status === 'holding')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return records[0] || null;
  });

  // 获取日期对应的净值数据
  const fetchNetWorthData = async (date: string) => {
    try {
      const data = await getFundHistory(fundCode, date, date);
      if (data.items.length > 0) {
        const { netWorth, totalWorth, isRealTime } = data.items[0];
        
        if (isRealTime) {
          // 如果是实时数据，计算网格宽度并更新状态
          const gridWidth = latestHoldingRecord
            ? ((netWorth - latestHoldingRecord.netWorth) / latestHoldingRecord.netWorth) * 100
            : undefined;
          
          // 计算预估网格大小
          let estimatedGridSize: number | undefined;
          if (gridWidth !== undefined && activeStrategy) {
            if (gridWidth >= 0) {
              // 如果当前净值高于买入点，计算距离卖出点的剩余比例
              estimatedGridSize = gridWidth > activeStrategy.sellWidth 
                ? activeStrategy.sellWidth - gridWidth  // 已超出卖出阈值，显示负数
                : activeStrategy.sellWidth - gridWidth; // 未达到卖出阈值，显示正数
            } else {
              // 如果当前净值低于买入点，计算距离下一个买入点的剩余比例
              const absGridWidth = Math.abs(gridWidth);
              estimatedGridSize = absGridWidth > activeStrategy.buyWidth
                ? activeStrategy.buyWidth - absGridWidth  // 已超出买入阈值，显示负数
                : activeStrategy.buyWidth - absGridWidth; // 未达到买入阈值，显示正数
            }
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
  }, [selectedDate, fundCode, latestHoldingRecord]);

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
                  const latestDate = latestHoldingRecord?.date ? dayjs(latestHoldingRecord.date) : null;
                  return current > today || (latestDate ? current < latestDate : false);
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
                  <br />
                  预估网格大小: {
                    realTimeData.estimatedGridSize !== undefined
                      ? `距${realTimeData.gridWidth && realTimeData.gridWidth >= 0 ? '下次卖出' : '下次买入'}的网格宽度为 ${realTimeData.estimatedGridSize >= 0 ? '+' : ''}${realTimeData.estimatedGridSize.toFixed(2)}%`
                      : '-'
                  }
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