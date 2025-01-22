import { NextRequest } from 'next/server';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: NextRequest) {
  const url = new URL(req.url);
  const searchParams = url.searchParams.toString();
  
  const response = await fetch(`https://fundsuggest.eastmoney.com/FundSearch/api/FundSearchAPI.ashx?${searchParams}`, {
    headers: {
      'Referer': 'https://fund.eastmoney.com',
      'Origin': 'https://fund.eastmoney.com',
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko)',
      'Accept': '*/*'
    }
  });

  const data = await response.text();
  
  return new Response(data, {
    headers: {
      'Content-Type': 'text/plain;charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
} 