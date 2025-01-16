import React, { useState, useEffect } from 'react';
import { Modal, Form, DatePicker, message } from 'antd';
import { useDispatch } from 'react-redux';
import { sellRecord } from '../../store/slices/tradeRecordSlice';
import type { TradeRecord } from '../../store/slices/tradeRecordSlice';
import { getFundHistory } from '../../services/market';
import dayjs from 'dayjs';

interface SellModalProps {
  record: TradeRecord;
  visible: boolean;
  onClose: () => void;
}

const SellModal: React.FC<SellModalProps> = ({ record, visible, onClose }) => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);

  // 当弹窗关闭时重置表单
  useEffect(() => {
    if (!visible) {
      form.resetFields();
    } else {
      // 当弹窗打开时，设置默认日期
      form.setFieldsValue({
        date: dayjs(),
      });
    }
  }, [visible, form]);

  // 获取日期对应的净值数据
  const fetchNetWorthData = async (date: string) => {
    try {
      const data = await getFundHistory(record.fundCode, date, date);
      if (data.items.length > 0) {
        const { netWorth, totalWorth } = data.items[0];
        return { netWorth, totalWorth };
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
      const data = await fetchNetWorthData(date.format('YYYY-MM-DD'));
      setLoading(false);
      
      if (data) {
        form.setFieldsValue({
          sellNetWorth: data.netWorth,
          sellAccNetWorth: data.totalWorth,
        });
      }
    }
  };

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      dispatch(sellRecord({
        recordId: record.id,
        sellDate: values.date.format('YYYY-MM-DD'),
        sellNetWorth: values.sellNetWorth,
        sellAccNetWorth: values.sellAccNetWorth,
      }));
      message.success('卖出成功');
      onClose();
    } catch (error) {
      message.error('卖出失败');
    }
  };

  return (
    <Modal
      title="卖出确认"
      open={visible}
      onOk={handleOk}
      onCancel={onClose}
      confirmLoading={loading}
      style={{ top: 'calc(50% + 50px)' }}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        preserve={false}
      >
        <Form.Item
          label="卖出日期"
          name="date"
          rules={[{ required: true, message: '请选择卖出日期' }]}
        >
          <DatePicker
            style={{ width: '100%' }}
            disabledDate={(current) => {
              const buyDate = dayjs(record.date);
              const yesterday = dayjs().subtract(1, 'day').endOf('day');
              return current <= buyDate || current > yesterday;
            }}
            onChange={handleDateChange}
          />
        </Form.Item>

        <Form.Item
          label="卖出净值"
          name="sellNetWorth"
          rules={[{ required: true, message: '请等待净值数据加载' }]}
        >
          <div className="text-lg">{form.getFieldValue('sellNetWorth')?.toFixed(4) || '-'}</div>
        </Form.Item>

        <Form.Item
          label="卖出累计净值"
          name="sellAccNetWorth"
          rules={[{ required: true, message: '请等待净值数据加载' }]}
        >
          <div className="text-lg">{form.getFieldValue('sellAccNetWorth')?.toFixed(4) || '-'}</div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SellModal; 