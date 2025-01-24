import axios from 'axios';
import type { FundSearchItem, FundDetail, MarketIndex } from '../types/fund';

const instance = axios.create({
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 处理 JSONP 响应
const jsonpToJson = (jsonp: string) => {
  try {
    const startPos = jsonp.indexOf('(');
    const endPos = jsonp.lastIndexOf(')');
    const json = jsonp.substring(startPos + 1, endPos);
    return JSON.parse(json);
  } catch (error) {
    console.error('JSONP parse error:', error);
    return null;
  }
};

export const api = {
  // 获取市场指数
  getMarketIndexes: async (): Promise<MarketIndex[]> => {
    const response = await instance.get('/api/sina?list=s_sh000001,s_sz399001,s_sz399006');
    const data = response.data.split('\n').filter(Boolean);
    return data.map((item: string) => {
      const [name, current, change, changePercent] = item.split(',');
      return {
        code: name.split('=')[0].split('_')[2],
        name: name.split('"')[1],
        current: Number(current),
        change: Number(change),
        changePercent: Number(changePercent),
        updateTime: new Date().toLocaleTimeString(),
      };
    });
  },

  // 搜索基金
  searchFunds: async (keyword: string): Promise<FundSearchItem[]> => {
    const response = await instance.get(
      `/api/fund?m=1&key=${encodeURIComponent(keyword)}`
    );
    const data = jsonpToJson(response.data);
    return data?.Datas?.map((item: any) => ({
      code: item.CODE,
      name: item.NAME,
      type: item.FundType,
    })) || [];
  },

  // 获取基金详情
  getFundDetail: async (code: string): Promise<FundDetail | null> => {
    try {
      const response = await instance.get(`/api/detail/${code}.js`);
      
      // 检查错误响应
      if (response.data.error) {
        console.error('获取基金详情失败:', response.data.error);
        return null;
      }

      // 处理JSONP响应
      const data = jsonpToJson(response.data);
      if (!data) {
        console.error('解析基金详情失败');
        return null;
      }
      
      return {
        code: data.fundcode,
        name: data.name,
        netWorth: Number(data.dwjz),
        accumulatedNetWorth: Number(data.ljjz || 0),
        estimatedNetWorth: Number(data.gsz),
        estimatedTime: data.gztime,
        updateTime: data.jzrq,
        dayGrowth: Number(data.gszzl || 0),
      };
    } catch (error) {
      console.error('获取基金详情失败:', error);
      return null;
    }
  },
};