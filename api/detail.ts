import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const code = url.pathname.split('/').pop()?.replace('.js', '') || '';
    
    if (!code) {
      return new Response('基金代码不能为空', {
        status: 400,
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
    }
    
    const response = await fetch(`https://fundgz.1234567.com.cn/js/${code}.js`, {
      headers: {
        'Referer': 'https://fund.eastmoney.com',
        'Origin': 'https://fund.eastmoney.com',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    
    return new Response(data, {
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  } catch (error) {
    console.error('基金详情获取失败:', error);
    return new Response(JSON.stringify({ error: '基金详情获取失败' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json;charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
} 