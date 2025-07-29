import axios, { AxiosResponse } from 'axios';
import * as fs from 'fs';
import { LoadTestConfig, EndpointTestConfig, RequestResult, EndpointStats } from './types';
import { InteractiveDisplay } from './InteractiveDisplay';

export class LoadTester {
  private config: LoadTestConfig;
  private results: RequestResult[] = [];
  private isRunning = false;
  private intervals: NodeJS.Timeout[] = [];
  private csvInitialized = false;
  private display: InteractiveDisplay;

  constructor(config: LoadTestConfig) {
    this.config = config;
    const stopAfterMs = this.config.stopAfterMs || 20 * 60 * 1000; // Default to 20 minutes
    this.display = new InteractiveDisplay(config.endpoints, stopAfterMs);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('Load test is already running');
      return;
    }

    if (!this.config.endpoints || this.config.endpoints.length === 0) {
      throw new Error('No endpoints configured. Please provide "endpoints" array in your config.');
    }

    this.isRunning = true;
    this.results = [];

    // Initialize CSV if enabled
    this.initializeCsv();

    const stopAfterMs = this.config.stopAfterMs || 20 * 60 * 1000; // Default to 20 minutes
    const stopAfterMinutes = Math.round(stopAfterMs / 60000);
    const stopAfterSeconds = Math.round(stopAfterMs / 1000);

    console.log(`Starting load test with ${this.config.endpoints.length} endpoint(s)...`);
    if (stopAfterMs < 60000) {
      console.log(`Auto-stop: ${stopAfterSeconds} seconds`);
    } else {
      console.log(`Auto-stop: ${stopAfterMinutes} minutes`);
    }

    // Display brief configuration summary
    this.config.endpoints.forEach((endpointConfig, index) => {
      const name = endpointConfig.name || `Endpoint-${index + 1}`;
      console.log(`${name}: ${endpointConfig.concurrentUsers} users @
        ${endpointConfig.frequencyMs}ms -> ${endpointConfig.endpoint}`);
    });

    console.log('\nPress Ctrl+C to stop\n');

    // Start the interactive display
    this.display.start();

    // Start concurrent users for each endpoint
    this.config.endpoints.forEach((endpointConfig, endpointIndex) => {
      for (let i = 0; i < endpointConfig.concurrentUsers; i++) {
        const interval = setInterval(() => {
          this.makeRequest(endpointConfig, endpointIndex, i);
        }, endpointConfig.frequencyMs);

        this.intervals.push(interval);
      }
    });

    // Update display every 1 second for responsive UI
    const displayInterval = setInterval(() => {
      this.display.update(this.results);
    }, 1000);

    this.intervals.push(displayInterval);

    // Auto-stop after specified duration
    const stopTimeout = setTimeout(() => {
      if (this.isRunning) {
        if (stopAfterMs < 60000) {
          console.log(`\n⏰ Load test duration reached (${stopAfterSeconds} seconds).
             Stopping automatically...`);
        } else {
          console.log(`\n⏰ Load test duration reached (${stopAfterMinutes} minutes).
             Stopping automatically...`);
        }
        this.stop();
      }
    }, stopAfterMs);

    this.intervals.push(stopTimeout);
  }

  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // Stop the interactive display
    this.display.stop();

    // Clear all intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];

    console.log('\n\nLoad test stopped');
    this.displayFinalStats();
  }

  private async makeRequest(
    endpointConfig: EndpointTestConfig,
    endpointIndex: number,
    userId: number
  ): Promise<void> {
    const startTime = Date.now();
    const endpointName = endpointConfig.name || `Endpoint-${endpointIndex + 1}`;

    try {
      // Build request headers
      const headers: Record<string, string> = {
        'User-Agent': `LoadTester-${endpointName}-User-${userId}`,
        ...endpointConfig.headers
      };

      // Build axios config
      const axiosConfig: any = {
        method: endpointConfig.method || 'GET',
        url: endpointConfig.endpoint,
        timeout: 30000, // 30 second timeout
        headers
      };

      // Add request body for methods that support it
      if (endpointConfig.body && this.supportsRequestBody(endpointConfig.method || 'GET')) {
        if (typeof endpointConfig.body === 'string') {
          axiosConfig.data = endpointConfig.body;
        } else {
          axiosConfig.data = endpointConfig.body;
          // Set content-type to JSON if not already set and body is an object
          if (!headers['Content-Type'] && !headers['content-type']) {
            headers['Content-Type'] = 'application/json';
          }
        }
      }

      // Handle authentication
      this.applyAuthentication(axiosConfig, headers, endpointConfig);

      const response: AxiosResponse = await axios(axiosConfig);

      const responseTime = Date.now() - startTime;

      const result: RequestResult = {
        timestamp: startTime,
        responseTime,
        statusCode: response.status,
        success: true,
        endpointName,
        endpoint: endpointConfig.endpoint
      };

      this.results.push(result);

      // Write to CSV if enabled
      this.writeToCsv(result, endpointConfig.method || 'GET', headers['User-Agent']);

      // No console output to avoid interfering with interactive display
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      const userAgent = `LoadTester-${endpointName}-User-${userId}`;

      const result: RequestResult = {
        timestamp: startTime,
        responseTime,
        statusCode: error.response?.status || 0,
        success: false,
        error: error.message,
        endpointName,
        endpoint: endpointConfig.endpoint
      };

      this.results.push(result);

      // Write to CSV if enabled
      this.writeToCsv(result, endpointConfig.method || 'GET', userAgent);

      // No console output to avoid interfering with interactive display
    }
  }

  private supportsRequestBody(method: string): boolean {
    const methodsWithBody = ['POST', 'PUT', 'PATCH'];
    return methodsWithBody.includes(method.toUpperCase());
  }

  private applyAuthentication(
    axiosConfig: any,
    headers: Record<string, string>,
    endpointConfig: EndpointTestConfig
  ): void {
    // Handle auth format
    if (endpointConfig.auth) {
      switch (endpointConfig.auth.type) {
        case 'basic':
          if (endpointConfig.auth.username && endpointConfig.auth.password) {
            axiosConfig.auth = {
              username: endpointConfig.auth.username,
              password: endpointConfig.auth.password
            };
          }
          break;

        case 'bearer':
          if (endpointConfig.auth.token) {
            headers['Authorization'] = `Bearer ${endpointConfig.auth.token}`;
          }
          break;

        case 'apikey':
          if (endpointConfig.auth.apiKey) {
            const headerName = endpointConfig.auth.apiKeyHeader || 'X-API-Key';
            headers[headerName] = endpointConfig.auth.apiKey;
          }
          break;

        case 'custom':
          if (endpointConfig.auth.customHeader && endpointConfig.auth.customValue) {
            headers[endpointConfig.auth.customHeader] = endpointConfig.auth.customValue;
          }
          break;
      }
    }

    // Update headers in axiosConfig
    axiosConfig.headers = headers;
  }

  private displayStats(): void {
    if (this.results.length === 0) {
      return;
    }

    console.log('\n--- Load Test Statistics ---');

    // Overall stats
    const overallStats = this.calculateStats();
    console.log(`Total Requests: ${overallStats.totalRequests}`);
    console.log(
      `Successful: ${overallStats.successfulRequests} (${((overallStats.successfulRequests / overallStats.totalRequests) * 100).toFixed(1)}%)`
    );
    console.log(
      `Failed: ${overallStats.failedRequests} (${((overallStats.failedRequests / overallStats.totalRequests) * 100).toFixed(1)}%)`
    );
    console.log(`Average Response Time: ${overallStats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Requests/Second: ${overallStats.requestsPerSecond.toFixed(2)}`);

    // Per-endpoint stats
    const endpointStats = this.calculateEndpointStats();
    if (endpointStats.length > 1) {
      console.log('\n--- Per-Endpoint Statistics ---');
      endpointStats.forEach(stats => {
        console.log(
          `${stats.endpointName}: ${stats.totalRequests} requests, ${stats.successfulRequests} successful (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%), ${stats.averageResponseTime.toFixed(2)}ms avg`
        );
      });
    }
    console.log('');
  }

  private displayFinalStats(): void {
    if (this.results.length === 0) {
      console.log('No requests were made');
      return;
    }

    console.log('\n=== Final Load Test Results ===');

    // Overall stats
    const overallStats = this.calculateStats();
    console.log(`Total Requests: ${overallStats.totalRequests}`);
    console.log(
      `Successful: ${overallStats.successfulRequests} (${((overallStats.successfulRequests / overallStats.totalRequests) * 100).toFixed(1)}%)`
    );
    console.log(
      `Failed: ${overallStats.failedRequests} (${((overallStats.failedRequests / overallStats.totalRequests) * 100).toFixed(1)}%)`
    );
    console.log(`Average Response Time: ${overallStats.averageResponseTime.toFixed(2)}ms`);
    console.log(`Min Response Time: ${overallStats.minResponseTime}ms`);
    console.log(`Max Response Time: ${overallStats.maxResponseTime}ms`);
    console.log(`Requests/Second: ${overallStats.requestsPerSecond.toFixed(2)}`);

    // Per-endpoint detailed stats
    const endpointStats = this.calculateEndpointStats();
    if (endpointStats.length > 1) {
      console.log('\n=== Per-Endpoint Results ===');
      endpointStats.forEach(stats => {
        console.log(`\n--- ${stats.endpointName} ---`);
        console.log(`URL: ${stats.endpoint}`);
        console.log(`Total Requests: ${stats.totalRequests}`);
        console.log(
          `Successful: ${stats.successfulRequests} (${((stats.successfulRequests / stats.totalRequests) * 100).toFixed(1)}%)`
        );
        console.log(
          `Failed: ${stats.failedRequests} (${((stats.failedRequests / stats.totalRequests) * 100).toFixed(1)}%)`
        );
        console.log(`Average Response Time: ${stats.averageResponseTime.toFixed(2)}ms`);
        console.log(`Min Response Time: ${stats.minResponseTime}ms`);
        console.log(`Max Response Time: ${stats.maxResponseTime}ms`);
        console.log(`Requests/Second: ${stats.requestsPerSecond.toFixed(2)}`);
      });
    }

    // Show recent errors if any
    const recentErrors = this.results
      .filter(r => !r.success)
      .slice(-5)
      .map(r => `${r.endpointName}: ${r.error}`)
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

  private calculateEndpointStats(): EndpointStats[] {
    const endpointGroups = new Map<string, RequestResult[]>();

    // Group results by endpoint
    this.results.forEach(result => {
      const key = `${result.endpointName || 'Unknown'}|${result.endpoint}`;
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      endpointGroups.get(key)!.push(result);
    });

    // Calculate stats for each endpoint
    return Array.from(endpointGroups.entries()).map(([key, results]) => {
      const [endpointName, endpoint] = key.split('|');
      const totalRequests = results.length;
      const successfulRequests = results.filter(r => r.success).length;
      const failedRequests = totalRequests - successfulRequests;

      const responseTimes = results.map(r => r.responseTime);
      const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      // Calculate requests per second based on actual time elapsed
      const firstRequest = Math.min(...results.map(r => r.timestamp));
      const lastRequest = Math.max(...results.map(r => r.timestamp));
      const timeElapsedSeconds = (lastRequest - firstRequest) / 1000;
      const requestsPerSecond = timeElapsedSeconds > 0 ? totalRequests / timeElapsedSeconds : 0;

      return {
        endpointName,
        endpoint,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime,
        minResponseTime,
        maxResponseTime,
        requestsPerSecond
      };
    });
  }

  private initializeCsv(): void {
    if (!this.config.csvOutput || this.csvInitialized) {
      return;
    }

    const csvHeader =
      'Timestamp,EndpointName,Endpoint,Method,ResponseTime(ms),StatusCode,Success,Error,UserAgent\n';

    try {
      fs.writeFileSync(this.config.csvOutput, csvHeader);
      this.csvInitialized = true;
    } catch (error: any) {
      console.error(`Failed to initialize CSV file: ${error.message}`);
    }
  }

  private writeToCsv(result: RequestResult, method: string, userAgent: string): void {
    if (!this.config.csvOutput || !this.csvInitialized) {
      return;
    }

    const timestamp = new Date(result.timestamp).toISOString();
    const endpointName = result.endpointName || 'Unknown';
    const endpoint = result.endpoint;
    const responseTime = result.responseTime;
    const statusCode = result.statusCode;
    const success = result.success;
    const error = result.error ? `"${result.error.replace(/"/g, '""')}"` : ''; // Escape quotes in error messages

    const csvRow = `${timestamp},${endpointName},"${endpoint}",${method},${responseTime},${statusCode},${success},${error},"${userAgent}"\n`;

    try {
      fs.appendFileSync(this.config.csvOutput, csvRow);
    } catch (error: any) {
      console.error(`Failed to write to CSV file: ${error.message}`);
    }
  }
}
