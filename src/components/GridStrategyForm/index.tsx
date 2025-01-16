import React, { useState, useEffect } from 'react';
import { Form, InputNumber, Button, Card, Space, message, Divider } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { addStrategy } from '../../store/slices/gridStrategySlice';
import type { RootState } from '../../store';
import { DownOutlined, UpOutlined } from '@ant-design/icons';

interface GridStrategyFormProps {
  fundCode: string;
}

const GridStrategyForm: React.FC<GridStrategyFormProps> = ({ fundCode }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isStrategyChanged, setIsStrategyChanged] = useState(false);
  
  // 获取当前基金的所有策略
  const strategies = useSelector((state: RootState) => 
    state.gridStrategy.strategies.filter(s => s.fundCode === fundCode)
  );
  
  // 获取当前激活的策略
  const activeStrategy = strategies.find(s => s.isActive);

  // 监听表单值变化
  const handleValuesChange = () => {
    // 如果没有激活的策略，说明是首次添加，不需要检测变化
    if (!activeStrategy) {
      setIsStrategyChanged(true);
      return;
    }

    const currentValues = form.getFieldsValue();
    const hasChanged = 
      currentValues.buyWidth !== activeStrategy.buyWidth ||
      currentValues.sellWidth !== activeStrategy.sellWidth ||
      currentValues.gridCount !== activeStrategy.gridCount;
    
    setIsStrategyChanged(hasChanged);
  };

  useEffect(() => {
    // 监听表单值变化
    form.setFieldsValue({
      buyWidth: activeStrategy?.buyWidth ?? 5,
      sellWidth: activeStrategy?.sellWidth ?? 5,
      gridCount: activeStrategy?.gridCount ?? 5,
    });
    // 如果没有激活的策略，说明是首次添加，默认可以提交
    setIsStrategyChanged(!activeStrategy);
  }, [activeStrategy, form]);

  const handleSubmit = async (values: any) => {
    // 如果有激活策略且策略未变化，不允许提交
    if (activeStrategy && !isStrategyChanged) {
      message.warning('策略未发生变化');
      return;
    }

    try {
      dispatch(addStrategy({
        fundCode,
        buyWidth: values.buyWidth,
        sellWidth: values.sellWidth,
        gridCount: values.gridCount,
      }));
      
      form.resetFields();
      setIsFormVisible(false);
      setIsStrategyChanged(false);
      message.success('策略添加成功');
    } catch (error) {
      message.error('策略添加失败');
    }
  };

  const toggleForm = () => {
    setIsFormVisible(!isFormVisible);
    if (!isFormVisible && activeStrategy) {
      // 如果是展开表单且存在激活策略，将其值设置为默认值
      form.setFieldsValue({
        buyWidth: activeStrategy.buyWidth,
        sellWidth: activeStrategy.sellWidth,
        gridCount: activeStrategy.gridCount,
      });
      setIsStrategyChanged(false);
    }
  };

  return (
    <Card 
      title={
        <div className="flex justify-between items-center">
          <span>网格交易策略</span>
          <Button 
            type="link" 
            onClick={toggleForm}
            icon={isFormVisible ? <UpOutlined /> : <DownOutlined />}
          >
            {activeStrategy ? '调整策略' : '添加策略'}
          </Button>
        </div>
      }
      className="backdrop-blur-lg bg-white/80 shadow-lg rounded-2xl border-0"
    >
      {/* 当前生效的策略 */}
      {activeStrategy && (
        <div className="mb-4 p-6 bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl border border-blue-100">
          <h3 className="text-blue-600 font-medium mb-4">当前生效策略</h3>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-blue-400 mb-1">买入网格宽度</div>
              <div className="text-2xl font-medium text-blue-600 flex items-baseline">
                {activeStrategy.buyWidth}
                <span className="text-sm ml-1">%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-400 mb-1">卖出网格宽度</div>
              <div className="text-2xl font-medium text-blue-600 flex items-baseline">
                {activeStrategy.sellWidth}
                <span className="text-sm ml-1">%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-blue-400 mb-1">网格数量</div>
              <div className="text-2xl font-medium text-blue-600 flex items-baseline">
                {activeStrategy.gridCount}
                <span className="text-sm ml-1">个</span>
              </div>
            </div>
          </div>
          <div className="text-xs text-blue-400 mt-4">
            创建时间: {new Date(activeStrategy.createdAt).toLocaleString()}
          </div>
        </div>
      )}

      {/* 策略表单 */}
      {isFormVisible && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleValuesChange}
          initialValues={{
            buyWidth: activeStrategy?.buyWidth ?? 5,
            sellWidth: activeStrategy?.sellWidth ?? 5,
            gridCount: activeStrategy?.gridCount ?? 5,
          }}
          className="mt-4"
        >
          <Form.Item
            label="买入网格宽度(%)"
            name="buyWidth"
            rules={[
              { required: true, message: '请输入买入网格宽度' },
              { type: 'number', min: 0.1, max: 100, message: '网格宽度需在0.1-100之间' }
            ]}
          >
            <InputNumber
              min={0.1}
              max={100}
              step={0.1}
              precision={1}
              style={{ width: '100%' }}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            label="卖出网格宽度(%)"
            name="sellWidth"
            rules={[
              { required: true, message: '请输入卖出网格宽度' },
              { type: 'number', min: 0.1, max: 100, message: '网格宽度需在0.1-100之间' }
            ]}
          >
            <InputNumber
              min={0.1}
              max={100}
              step={0.1}
              precision={1}
              style={{ width: '100%' }}
              addonAfter="%"
            />
          </Form.Item>

          <Form.Item
            label="网格数量"
            name="gridCount"
            rules={[
              { required: true, message: '请输入网格数量' },
              { type: 'number', min: 1, max: 100, message: '网格数量需在1-100之间' }
            ]}
          >
            <InputNumber
              min={1}
              max={100}
              precision={0}
              style={{ width: '100%' }}
              addonAfter="个"
            />
          </Form.Item>

          <Form.Item>
            <Space className="w-full justify-end">
              <Button onClick={() => setIsFormVisible(false)}>
                取消
              </Button>
              <Button 
                type="primary" 
                htmlType="submit"
                disabled={!isStrategyChanged}
                title={!isStrategyChanged ? '策略未发生变化' : ''}
              >
                {activeStrategy ? '更新策略' : '添加策略'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}

      {/* 历史策略列表 */}
      {strategies.length > 1 && (
        <div className="mt-4">
          <Divider />
          <h3 className="text-lg font-medium mb-4">历史策略</h3>
          <div className="space-y-4">
            {strategies.filter(s => !s.isActive).map(strategy => (
              <Card
                key={strategy.id}
                size="small"
                className="border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">
                      买入宽度: {strategy.buyWidth}% | 卖出宽度: {strategy.sellWidth}% | 网格数: {strategy.gridCount}
                    </div>
                    <div className="text-xs text-gray-400">
                      创建时间: {new Date(strategy.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded">
                      已停用
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

export default GridStrategyForm; 