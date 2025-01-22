interface ApiEndpoint {
  baseUrl: string;
  headers?: Record<string, string>;
}

interface ApiConfig {
  sina: ApiEndpoint;
  fund: ApiEndpoint;
  fundDetail: ApiEndpoint;
  fundHistory: ApiEndpoint;
}

// API配置
const config: ApiConfig = {
  sina: {
    baseUrl: '/api/sina'
  },
  fund: {
    baseUrl: '/api/fund'
  },
  fundDetail: {
    baseUrl: '/api/detail'
  },
  fundHistory: {
    baseUrl: '/api/history'
  }
};

export const apiConfig = config; 