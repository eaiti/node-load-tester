import axios, { AxiosResponse } from 'axios';
import { LoadTestConfig, RequestResult } from './types';

export class LoadTester {
  private config: LoadTestConfig;
  private results: RequestResult[] = [];
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];

  constructor(config: LoadTestConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Load test is already running');
      return;
    }

    this.isRunning = true;
    this.results = [];
    
    console.log(`Starting load test...`);
    console.log(`Endpoint: ${this.config.endpoint}`);
    console.log(`Method: ${this.config.method || 'GET'}`);
    console.log(`Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`Frequency: ${this.config.frequencyMs}ms`);
    if (this.config.body) {
      console.log(`Request Body: ${typeof this.config.body === 'string' ? 'String' : 'JSON Object'}`);
    }
    console.log('Press Ctrl+C to stop\n');

    // Start concurrent users
    for (let i = 0; i < this.config.concurrentUsers; i++) {
      const interval = setInterval(() => {
        this.makeRequest(i);
      }, this.config.frequencyMs);
      
      this.intervals.push(interval);
    }

    // Display stats every 5 seconds
    const statsInterval = setInterval(() => {
      this.displayStats();
    }, 5000);
    
    this.intervals.push(statsInterval);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    console.log('\nLoad test stopped');
    this.displayFinalStats();
  }

  private async makeRequest(userId: number): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Build request headers
      const headers: Record<string, string> = {
        'User-Agent': `LoadTester-User-${userId}`,
        ...this.config.headers
      };

      // Build axios config
      const axiosConfig: any = {
        method: this.config.method || 'GET',
        url: this.config.endpoint,
        timeout: 30000, // 30 second timeout
        headers
      };

      // Add request body for methods that support it
      if (this.config.body && this.supportsRequestBody(this.config.method || 'GET')) {
        if (typeof this.config.body === 'string') {
          axiosConfig.data = this.config.body;
        } else {
          axiosConfig.data = this.config.body;
          // Set content-type to JSON if not already set and body is an object
          if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json';
          }
        }
      }

      // Handle authentication
      this.applyAuthentication(axiosConfig, headers);

      const response: AxiosResponse = await axios(axiosConfig);
      
      const responseTime = Date.now() - startTime;
      
      this.results.push({
        timestamp: startTime,
        responseTime,
        statusCode: response.status,
        success: true
      });
      
      process.stdout.write('.');
      
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      this.results.push({
        timestamp: startTime,
        responseTime,
        statusCode: error.response?.status || 0,
        success: false,
        error: error.message
      });
      
      process.stdout.write('x');
    }
  }

  private supportsRequestBody(method: string): boolean {
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    return methodsWithBody.includes(method.toUpperCase());
  }

  private applyAuthentication(axiosConfig: any, headers: Record<string, string>): void {
    // Handle new auth format
    if (this.config.auth) {
      switch (this.config.auth.type) {
        case 'basic':
          if (this.config.auth.username && this.config.auth.password) {
            axiosConfig.auth = {
              username: this.config.auth.username,
              password: this.config.auth.password
            };
          }
          break;

        case 'bearer':
          if (this.config.auth.token) {
            headers['Authorization'] = `Bearer ${this.config.auth.token}`;
          }
          break;

        case 'apikey':
          if (this.config.auth.apiKey) {
            const headerName = this.config.auth.apiKeyHeader || 'X-API-Key';
            headers[headerName] = this.config.auth.apiKey;
          }
          break;

        case 'custom':
          if (this.config.auth.customHeader && this.config.auth.customValue) {
            headers[this.config.auth.customHeader] = this.config.auth.customValue;
          }
          break;
      }
    }

    // Handle legacy basicAuth format for backward compatibility
    if (this.config.basicAuth) {
      axiosConfig.auth = {
        username: this.config.basicAuth.username,
        password: this.config.basicAuth.password
      };
    }

    // Update headers in axiosConfig
    axiosConfig.headers = headers;
  }

  private displayStats(): void {
    if (this.results.length === 0) {
      return;
    }

    const stats = this.calculateStats();
    
    console.log('\n--- Load Test Statistics ---');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${stats.minResponseTime}ms`);
    console.log(`Max Response Time: ${stats.maxResponseTime}ms`);
    console.log(`Requests/Second: ${stats.requestsPerSecond.toFixed(2)}`);
    console.log('');
  }

  private displayFinalStats(): void {
    if (this.results.length === 0) {
      console.log('No requests were made');
      return;
    }

    const stats = this.calculateStats();
    
    console.log('\n=== Final Load Test Results ===');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`);
    console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${stats.minResponseTime}ms`);
    console.log(`Max Response Time: ${stats.maxResponseTime}ms`);
    console.log(`Requests/Second: ${stats.requestsPerSecond.toFixed(2)}`);
    
    // Show recent errors if any
    const recentErrors = this.results
      .filter(r => !r.success)
      .slice(-5)
      .map(r => r.error)
      .filter((error, index, arr) => arr.indexOf(error) === index);
    
    if (recentErrors.length > 0) {
      console.log('\nRecent Errors:');
      recentErrors.forEach(error => console.log(`  - ${error}`));
    }
  }

  private calculateStats() {
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.success).length;
    const failedRequests = totalRequests - successfulRequests;
    
    const responseTimes = this.results.map(r => r.responseTime);
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    
    // Calculate requests per second based on actual time elapsed
    const firstRequest = Math.min(...this.results.map(r => r.timestamp));
    const lastRequest = Math.max(...this.results.map(r => r.timestamp));
    const timeElapsedSeconds = (lastRequest - firstRequest) / 1000;
    const requestsPerSecond = timeElapsedSeconds > 0 ? totalRequests / timeElapsedSeconds : 0;
    
    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime,
      minResponseTime,
      maxResponseTime,
      requestsPerSecond
    };
  }
}
