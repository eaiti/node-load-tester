export interface LoadTestConfig {
  endpoint: string;
  concurrentUsers: number;
  frequencyMs: number;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  headers?: Record<string, string>;
  body?: string | object;
  auth?: {
    type: 'basic' | 'bearer' | 'apikey' | 'custom';
    // Basic Auth
    username?: string;
    password?: string;
    // Bearer Token
    token?: string;
    // API Key
    apiKey?: string;
    apiKeyHeader?: string; // Default: 'X-API-Key'
    // Custom Auth
    customHeader?: string;
    customValue?: string;
  };
  // Deprecated: keeping for backward compatibility
  basicAuth?: {
    username: string;
    password: string;
  };
}

export interface RequestResult {
  timestamp: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
}

export interface LoadTestStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
}
