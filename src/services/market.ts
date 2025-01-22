import axios from 'axios';
import { MarketIndex } from '../types/market';
import { apiConfig } from '../config/api.config';

// 创建axios实例
const createAxiosInstance = (type: keyof typeof apiConfig) => {
  return axios.create({
    baseURL: apiConfig[type].baseUrl,
    headers: apiConfig[type].headers,
    timeout: 10000,
  });
};

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
    const sinaApi = createAxiosInstance('sina');
    const response = await sinaApi.get(`?list=${code}`);
    return parseSinaResponse(code, response.data);
  } catch (error) {
    throw new Error(`Failed to fetch market index: ${error}`);
  }
};

// 获取所有指数数据
export const fetchAllMarketIndices = async (): Promise<Record<string, MarketIndex>> => {
  const codes = Object.values(MARKET_INDICES).join(',');
  
  try {
    const sinaApi = createAxiosInstance('sina');
    const response = await sinaApi.get(`?list=${codes}`);
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
    const fundApi = createAxiosInstance('fund');
    const response = await fundApi.get(
      `/FundSearch/api/FundSearchAPI.ashx?m=1&key=${encodeURIComponent(keyword)}`
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
  dividend: string;      // 成立来分红
  managementFee: string; // 管理费率
  custodianFee: string; // 托管费率
  serviceFee: string;   // 销售服务费率
  subscriptionFee: string; // 最高认购费率
  purchaseFee: string;  // 最高申购费率
  redemptionFee: string; // 最高赎回费率
}

// 获取基金详情
export const getFundDetail = async (code: string): Promise<FundDetail> => {
  try {
    // 1. 获取实时数据
    const response = await axios.get(`/api/detail/${code}.js`);
    const data = response.data;
    
    // 检查响应格式
    if (typeof data === 'string') {
      // 尝试解析JSONP格式
      const match = data.match(/\{.*\}/);
      if (match) {
        const jsonData = JSON.parse(match[0]);
        return {
          code: jsonData.fundcode || code,
          name: jsonData.name || '-',
          type: jsonData.fundtype || '-',
          netWorth: parseFloat(jsonData.dwjz) || 0,
          totalWorth: parseFloat(jsonData.gsz) || 0,
          dayGrowth: parseFloat(jsonData.gszzl) || 0,
          lastUpdate: jsonData.gztime || '-',
          fundScale: '-',
          manager: '-',
          dividend: '-',
          managementFee: '-',
          custodianFee: '-',
          serviceFee: '-',
          subscriptionFee: '-',
          purchaseFee: '-',
          redemptionFee: '-'
        };
      }
    }

    throw new Error('无效的数据格式');
  } catch (error) {
    console.error('获取基金详情失败:', error);
    throw new Error('获取基金详情失败');
  }
};

// 获取基金完整详情
export const getFundFullDetail = async (code: string): Promise<FundDetail> => {
  try {
    // 1. 获取实时数据
    const basicDetail = await getFundDetail(code);
    
    // 2. 获取基金详细信息
    const response = await axios.get(
      `/api/fund/f10/jbgk_${code}.html`,
      {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      }
    );
    
    // 如果获取额外信息失败，至少返回基础信息
    if (!response.data) {
      return basicDetail;
    }

    // 解析HTML获取详细信息
    const html = response.data;
    const managerMatch = html.match(/基金经理人<\/th><td[^>]*><a[^>]*>([^<]+)<\/a>/);
    const dividendMatch = html.match(/成立来分红<\/th><td[^>]*><a[^>]*>([^<]+)<\/a>/);
    
    // 通用的费率提取函数
    const extractFeeRate = (label: string) => {
      const fullPattern = new RegExp(`${label}<\/th><td[^>]*>(?:.*?<span[^>]*>([^<]+)<\/span>)?(?:.*?天天基金优惠费率：<span[^>]*>([^<]+)<\/span>)?(?:.*?)<\/td>`);
      const fullMatch = html.match(fullPattern);
      
      if (fullMatch && (fullMatch[1] || fullMatch[2])) {
        const [_, originalRate, discountRate] = fullMatch;
        if (discountRate) {
          return `${discountRate}`;
        }
        return originalRate;
      }
      
      const simplePattern = new RegExp(`${label}<\/th><td[^>]*>([^<]+)<\/td>`);
      const simpleMatch = html.match(simplePattern);
      return simpleMatch ? simpleMatch[1].trim() : '-';
    };

    const scaleMatch = html.match(/资产规模<\/th><td[^>]*>([^<]+)<th>/);
    
    return {
      ...basicDetail,
      manager: managerMatch ? managerMatch[1].trim() : basicDetail.manager,
      fundScale: scaleMatch ? scaleMatch[1].trim() : basicDetail.fundScale,
      dividend: dividendMatch ? dividendMatch[1].trim() : '-',
      managementFee: extractFeeRate('管理费率'),
      custodianFee: extractFeeRate('托管费率'),
      serviceFee: extractFeeRate('销售服务费率'),
      subscriptionFee: extractFeeRate('最高认购费率'),
      purchaseFee: extractFeeRate('最高申购费率'),
      redemptionFee: extractFeeRate('最高赎回费率')
    };
  } catch (error) {
    console.error('获取基金完整详情失败:', error);
    // 如果获取详细信息失败，返回基础信息
    return getFundDetail(code);
  }
};

// 基金历史净值类型
export interface FundHistory {
  date: string;
  netWorth: number;
  totalWorth: number;
  dayGrowth: number;
  bonus?: string;
  isRealTime?: boolean;
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
    // 检查是否是当天
    const now = new Date();
    now.setHours(now.getHours() + 8);
    const today = now.toISOString().split('T')[0];
    if (startDate === today && endDate === today) {
      // 如果是当天，使用实时估值接口
      console.log('当天日期:', today);
      const realTimeData = await getFundDetail(code);
      return {
        items: [{
          date: realTimeData.lastUpdate,
          netWorth: realTimeData.totalWorth,
          totalWorth: 0,
          dayGrowth: realTimeData.dayGrowth,
          bonus: '-',
          isRealTime: true
        }],
        total: 1
      };
    }

    // 如果不是当天，使用历史净值接口
    const response = await axios.get(
      '/api/history/f10/lsjz',
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
        bonus: item.FHSP || '-',
        isRealTime: false
      })),
      total: TotalCount
    };
  } catch (error) {
    console.error('获取基金历史净值失败:', error);
    throw error;
  }
}; 