export interface EndpointTestConfig {
  name?: string; // Optional name for the endpoint test
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
}

export interface LoadTestConfig {
  stopAfterMs?: number; // Optional, defaults to 20 minutes
  endpoints: EndpointTestConfig[];
  csvOutput?: string; // Optional CSV file path for detailed request logging
}

export interface RequestResult {
  timestamp: number;
  responseTime: number;
  statusCode: number;
  success: boolean;
  error?: string;
  endpointName?: string; // Track which endpoint this result is for
  endpoint: string; // Track the actual URL
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

export interface EndpointStats extends LoadTestStats {
  endpointName: string;
  endpoint: string;
}
