import React, { useState } from 'react';
import { Modal, Upload, Radio, Space, message, Alert } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../../store';
import { readJsonFile, BackupData } from '../../utils/backup';
import { setStrategies } from '../../store/slices/gridStrategySlice';
import { setRecords } from '../../store/slices/tradeRecordSlice';
import { setStarredFunds } from '../../store/slices/fundStarSlice';

const { Dragger } = Upload;

interface BackupModalProps {
  visible: boolean;
  onClose: () => void;
}

const BackupModal: React.FC<BackupModalProps> = ({ visible, onClose }) => {
  const dispatch = useDispatch();
  const currentState = useSelector((state: RootState) => state);
  const [importMode, setImportMode] = useState<'override' | 'merge'>('override');
  const [fileData, setFileData] = useState<BackupData | null>(null);

  // 处理文件上传
  const handleUpload = async (file: File) => {
    try {
      const data = await readJsonFile(file);
      console.log('解析的文件数据:', data);
      setFileData(data);
      return false; // 阻止自动上传
    } catch (error) {
      message.error('文件解析失败：' + (error as Error).message);
      return false;
    }
  };

  // 保存数据到 localStorage
  const saveToLocalStorage = (data: any) => {
    try {
      localStorage.setItem('gridStrategy', JSON.stringify(data.gridStrategy));
      localStorage.setItem('tradeRecord', JSON.stringify(data.tradeRecord));
      localStorage.setItem('fundStar', JSON.stringify(data.fundStar));
      return true;
    } catch (error) {
      console.error('保存到 localStorage 失败:', error);
      return false;
    }
  };

  // 处理导入确认
  const handleImport = () => {
    if (!fileData) return;

    try {
      console.log('当前状态:', currentState);
      console.log('导入模式:', importMode);
      console.log('导入数据:', fileData.data);

      let finalData;
      if (importMode === 'override') {
        // 完全覆盖现有数据
        console.log('执行完全覆盖');
        finalData = {
          gridStrategy: fileData.data.gridStrategy,
          tradeRecord: fileData.data.tradeRecord,
          fundStar: fileData.data.fundStar
        };
      } else {
        // 合并数据
        console.log('执行合并导入');
        
        // 合并网格策略（基于 fundCode 去重）
        const mergedStrategies = [
          ...currentState.gridStrategy.strategies,
          ...fileData.data.gridStrategy.filter(strategy => 
            !currentState.gridStrategy.strategies.some(s => s.fundCode === strategy.fundCode)
          )
        ];

        // 合并交易记录（基于 id 去重）
        const mergedRecords = [
          ...currentState.tradeRecord.records,
          ...fileData.data.tradeRecord.filter(record =>
            !currentState.tradeRecord.records.some(r => r.id === record.id)
          )
        ];

        // 合并收藏基金（去重）
        const mergedStarredFunds = [
          ...new Set([...currentState.fundStar.starredFunds, ...fileData.data.fundStar])
        ];

        finalData = {
          gridStrategy: mergedStrategies,
          tradeRecord: mergedRecords,
          fundStar: mergedStarredFunds
        };

        console.log('合并后的数据:', finalData);
      }

      // 先保存到 localStorage
      if (saveToLocalStorage(finalData)) {
        // 更新 Redux store
        dispatch(setStrategies(finalData.gridStrategy));
        dispatch(setRecords(finalData.tradeRecord));
        dispatch(setStarredFunds(finalData.fundStar));

        message.success('数据导入成功');
        onClose();
        
        // 使用较短的延迟刷新页面
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        throw new Error('保存到本地存储失败');
      }
    } catch (error) {
      console.error('导入错误:', error);
      message.error('导入失败：' + (error as Error).message);
    }
  };

  return (
    <Modal
      title="导入数据"
      open={visible}
      onCancel={onClose}
      onOk={handleImport}
      okButtonProps={{ disabled: !fileData }}
      okText="确认导入"
      cancelText="取消"
      width={600}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Radio.Group value={importMode} onChange={e => setImportMode(e.target.value)}>
          <Space direction="vertical">
            <Radio value="override">完全覆盖 - 清除现有数据，使用导入数据</Radio>
            <Radio value="merge">合并导入 - 保留现有数据，合并导入数据</Radio>
          </Space>
        </Radio.Group>

        <Alert
          message="请选择备份文件"
          description="支持导入 .json 格式的备份文件"
          type="info"
          showIcon
        />

        <Dragger
          accept=".json"
          beforeUpload={handleUpload}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">点击或拖拽文件到此区域</p>
          <p className="ant-upload-hint">仅支持 .json 格式的备份文件</p>
        </Dragger>

        {fileData && (
          <Alert
            message="文件解析成功"
            description={
              <div>
                <p>备份版本：{fileData.version}</p>
                <p>备份时间：{new Date(fileData.timestamp).toLocaleString()}</p>
                <p>数据概览：</p>
                <ul>
                  <li>网格策略：{fileData.data.gridStrategy.length} 条</li>
                  <li>交易记录：{fileData.data.tradeRecord.length} 条</li>
                  <li>收藏基金：{fileData.data.fundStar.length} 个</li>
                </ul>
              </div>
            }
            type="success"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};

export default BackupModal; 