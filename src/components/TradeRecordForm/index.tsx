import React, { useState } from 'react';
import { Form, DatePicker, InputNumber, Button, Space, Card, message, Select, Row, Col } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { addRecord } from '../../store/slices/tradeRecordSlice';
import type { RootState } from '../../store';
import dayjs from 'dayjs';
import { getFundHistory } from '../../services/market';

interface TradeRecordFormProps {
  fundCode: string;
}

const { Option } = Select;

const AMOUNT_UNITS = [
  { label: '元', value: 1 },
  { label: '百元', value: 100 },
  { label: '千元', value: 1000 },
  { label: '万元', value: 10000 },
];

const TradeRecordForm: React.FC<TradeRecordFormProps> = ({ fundCode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [amountUnit, setAmountUnit] = useState(1);
  const [loading, setLoading] = useState(false);

  // 获取当前激活的策略
  const activeStrategy = useSelector((state: RootState) =>
    state.gridStrategy.strategies.find(s => s.fundCode === fundCode && s.isActive)
  );

  // 获取日期对应的净值数据
  const fetchNetWorthData = async (date: string) => {
    try {
      const data = await getFundHistory(fundCode, date, date);
      if (data.items.length > 0) {
        const { netWorth, totalWorth } = data.items[0];
        form.setFieldsValue({
          netWorth,
          accNetWorth: totalWorth,
        });
        return { netWorth, accNetWorth: totalWorth };
      }
      throw new Error('未找到净值数据');
    } catch (error) {
      message.error('获取净值数据失败');
      return null;
    }
  };

  const handleDateChange = async (date: dayjs.Dayjs | null) => {
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
      // 计算实际买入金额
      const actualAmount = values.buyAmount * amountUnit;
      
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
          amountUnit: 1,
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
                disabledDate={(current) => current > dayjs().endOf('day')}
                onChange={handleDateChange}
                disabled={loading}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              label="买入金额"
              required
              style={{ marginBottom: 0 }}
            >
              <Space.Compact style={{ width: '100%' }}>
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
                <Select
                  value={amountUnit}
                  onChange={setAmountUnit}
                  style={{ width: '80px' }}
                >
                  {AMOUNT_UNITS.map(unit => (
                    <Option key={unit.value} value={unit.value}>
                      {unit.label}
                    </Option>
                  ))}
                </Select>
              </Space.Compact>
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
          </Col>
          <Col span={12}>
            <Form.Item
              label="累计净值"
              name="accNetWorth"
              rules={[{ required: true, message: '请等待净值数据加载' }]}
            >
              <InputNumber
                style={{ width: '100%' }}
                disabled
                precision={4}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Space className="w-full justify-end">
            <Button onClick={() => form.resetFields()}>
              重置
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              添加记录
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default TradeRecordForm; 