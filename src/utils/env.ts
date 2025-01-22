// 判断是否是 Vercel 生产环境
export const isVercelProduction = process.env.VERCEL === '1';

// 判断是否是开发环境
export const isDevelopment = process.env.NODE_ENV === 'development';

// 判断是否是生产环境
export const isProduction = process.env.NODE_ENV === 'production'; 