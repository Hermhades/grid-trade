import { RootState } from '../store';

export interface BackupData {
  version: string;
  timestamp: number;
  data: {
    gridStrategy: any[];
    tradeRecord: any[];
    fundStar: string[];
  };
}

// 导出数据
export const exportData = (state: RootState): BackupData => {
  return {
    version: '1.0.0',
    timestamp: Date.now(),
    data: {
      gridStrategy: state.gridStrategy.strategies,
      tradeRecord: state.tradeRecord.records,
      fundStar: state.fundStar.starredFunds,
    },
  };
};

// 下载 JSON 文件
export const downloadJson = (data: BackupData) => {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
  
  link.href = url;
  link.download = `grid-trade-backup-${date}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// 读取 JSON 文件
export const readJsonFile = (file: File): Promise<BackupData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        // 简单的数据结构验证
        if (!data.version || !data.timestamp || !data.data) {
          throw new Error('无效的备份文件格式');
        }
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}; 