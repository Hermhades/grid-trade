import axios from 'axios';
import { MarketIndex } from '../types/market';

const SINA_API_BASE = '/api/sina/list=';

// 指数代码映射
export const MARKET_INDICES = {
  SH: 's_sh000001',    // 上证指数
  HS300: 's_sz399300', // 沪深300（注意：从sh改为sz）
  CYB: 's_sz399006',   // 创业板指
  KC50: 's_sh000688',  // 科创50
  BANK: 's_sz399986',  // 中证银行
  SEC: 's_sz399975',   // 证券公司
} as const;

// 解析新浪返回的数据
const parseSinaResponse = (code: string, data: string): MarketIndex => {
  // 新浪返回的数据格式：var hq_str_s_sh000001="上证指数,3000.000,50.000,1.20,1000000,1000000";
  const match = data.match(/"([^"]+)"/);
  if (!match) {
    throw new Error('Invalid response format');
  }

  const [name, current, change, changePercent, volume, amount] = match[1].split(',');
  
  return {
    code,
    name,
    current: parseFloat(current),
    change: parseFloat(changePercent),
    volume: parseFloat(volume),
    amount: parseFloat(amount)
  };
};

// 获取单个指数数据
export const fetchMarketIndex = async (code: string): Promise<MarketIndex> => {
  try {
    const response = await axios.get(`${SINA_API_BASE}${code}`);
    return parseSinaResponse(code, response.data);
  } catch (error) {
    throw new Error(`Failed to fetch market index: ${error}`);
  }
};

// 获取所有指数数据
export const fetchAllMarketIndices = async (): Promise<Record<string, MarketIndex>> => {
  const codes = Object.values(MARKET_INDICES).join(',');
  
  try {
    const response = await axios.get(`${SINA_API_BASE}${codes}`);
    const result: Record<string, MarketIndex> = {};
    const dataList = response.data.split(';').filter(Boolean);
    
    Object.entries(MARKET_INDICES).forEach(([key, code], index) => {
      result[key] = parseSinaResponse(code, dataList[index]);
    });
    
    return result;
  } catch (error) {
    throw new Error(`Failed to fetch market indices: ${error}`);
  }
};

// 基金搜索接口响应类型
export interface FundSearchResult {
  code: string;
  name: string;
  type: string;
  pinyin: string;
}

// 基金搜索函数
export const searchFunds = async (keyword: string): Promise<FundSearchResult[]> => {
  try {
    const response = await axios.get(
      `https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?callback=&m=1&key=${encodeURIComponent(
        keyword
      )}`
    );
    
    if (Array.isArray(response.data.Datas)) {
      return response.data.Datas.map((item: any) => ({
        code: item.CODE,
        name: item.NAME,
        type: item.FundType,
        pinyin: item.PINYIN
      }));
    }
    
    return [];
  } catch (error) {
    console.error('搜索基金失败:', error);
    return [];
  }
};

// 基金详情接口响应类型
export interface FundDetail {
  code: string;
  name: string;
  type: string;
  netWorth: number;
  totalWorth: number;
  dayGrowth: number;
  lastUpdate: string;
  fundScale: string;
  manager: string;
}

// 获取基金详情
export const getFundDetail = async (code: string): Promise<FundDetail> => {
  try {
    const response = await axios.get(
      `https://fundgz.1234567.com.cn/js/${code}.js?rt=${new Date().getTime()}`
    );
    
    // 移除 jsonpgz() 包装
    const jsonStr = response.data.replace('jsonpgz(', '').replace(');', '');
    const data = JSON.parse(jsonStr);
    
    return {
      code: data.fundcode,
      name: data.name,
      type: data.fundtype || '-',
      netWorth: parseFloat(data.dwjz) || 0,
      totalWorth: parseFloat(data.gsz) || 0,
      dayGrowth: parseFloat(data.gszzl) || 0,
      lastUpdate: data.gztime || '-',
      fundScale: data.fundScale || '-',
      manager: data.manager || '-'
    };
  } catch (error) {
    console.error('获取基金详情失败:', error);
    throw error;
  }
};

// 基金历史净值类型
export interface FundHistory {
  date: string;
  netWorth: number;
  totalWorth: number;
  dayGrowth: number;
  bonus?: string;
}

// 获取基金历史净值
export const getFundHistory = async (
  code: string,
  startDate: string,
  endDate: string,
  pageIndex = 1,
  pageSize = 20
): Promise<{ items: FundHistory[]; total: number }> => {
  try {
    const response = await axios.get(
      'https://api.fund.eastmoney.com/f10/lsjz',
      {
        params: {
          fundCode: code,
          pageIndex,
          pageSize,
          startDate,
          endDate,
        },
      }
    );
    
    const { LSJZList, TotalCount } = response.data.Data;
    
    return {
      items: LSJZList.map((item: any) => ({
        date: item.FSRQ,
        netWorth: parseFloat(item.DWJZ) || 0,
        totalWorth: parseFloat(item.LJJZ) || 0,
        dayGrowth: parseFloat(item.JZZZL) || 0,
        bonus: item.FHSP || '-'
      })),
      total: TotalCount
    };
  } catch (error) {
    console.error('获取基金历史净值失败:', error);
    throw error;
  }
}; 