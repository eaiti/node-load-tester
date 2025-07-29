import * as cliProgress from 'cli-progress';
import { EndpointTestConfig, RequestResult } from './types';

interface EndpointStats {
  name: string;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  requestsPerSecond: number;
  latencyChart: string;
  recentLatencies: number[];
}

export class InteractiveDisplay {
  private multibar: cliProgress.MultiBar | null = null;
  private endpointBars: Map<string, cliProgress.SingleBar> = new Map();
  private endpointExpectedTotals: Map<string, number> = new Map();
  private isInteractive: boolean = false;
  private startTime: number = Date.now();
  private lastUpdateTime: number = Date.now();
  private previousTotalRequests: number = 0;

  constructor(
    private endpoints: EndpointTestConfig[],
    private stopAfterMs: number
  ) {
    // Calculate expected total requests for each endpoint
    this.endpoints.forEach((endpoint, index) => {
      const endpointName = endpoint.name || `Endpoint-${index + 1}`;
      const expectedRequests = this.calculateExpectedRequests(endpoint, stopAfterMs);
      this.endpointExpectedTotals.set(endpointName, expectedRequests);
    });
  }

  private calculateExpectedRequests(endpoint: EndpointTestConfig, stopAfterMs: number): number {
    // Calculate how many requests each user will make
    const requestsPerUser = Math.floor(stopAfterMs / endpoint.frequencyMs);
    // Total requests = requests per user * number of concurrent users
    return requestsPerUser * endpoint.concurrentUsers;
  }

  public start(): void {
    // Check if we're in an interactive terminal
    this.isInteractive = process.stdout.isTTY === true;

    if (!this.isInteractive) {
      console.log('Non-interactive mode detected - using simple logging');
      return;
    }

    console.log('🚀 Starting interactive load test monitor...\n');

    this.multibar = new cliProgress.MultiBar(
      {
        clearOnComplete: false,
        hideCursor: true,
        format: ' {bar} | {endpoint} | {percentage}% | {value}/{total} | {remaining} | {stats}',
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        barsize: 15
      },
      cliProgress.Presets.shades_grey
    );

    // Create a progress bar for each endpoint with calculated totals
    this.endpoints.forEach((endpoint, index) => {
      const endpointName = endpoint.name || `Endpoint-${index + 1}`;
      const expectedTotal = this.endpointExpectedTotals.get(endpointName) || 100;

      if (this.multibar) {
        const remainingSeconds = Math.ceil(this.stopAfterMs / 1000);
        const bar = this.multibar.create(expectedTotal, 0, {
          endpoint: endpointName.substring(0, 12).padEnd(12),
          remaining: `${remainingSeconds}s`,
          stats: 'Starting...'
        });
        this.endpointBars.set(endpointName, bar);
      }
    });
  }

  public update(results: RequestResult[]): void {
    if (!this.isInteractive || !this.multibar) {
      // Simple logging for non-interactive mode
      const currentTime = Date.now();
      const totalRequests = results.length;

      // Only log every 5 seconds to reduce memory usage
      if (currentTime - this.lastUpdateTime >= 5000) {
        const elapsedSeconds = (currentTime - this.startTime) / 1000;
        const requestsSinceLastUpdate = totalRequests - this.previousTotalRequests;
        const currentRps = requestsSinceLastUpdate / ((currentTime - this.lastUpdateTime) / 1000);

        console.log(
          `[${elapsedSeconds.toFixed(0)}s] Total: ${totalRequests} requests | RPS: ${currentRps.toFixed(1)}`
        );

        this.lastUpdateTime = currentTime;
        this.previousTotalRequests = totalRequests;
      }
      return;
    }

    const endpointStats = this.calculateEndpointStats(results);

    endpointStats.forEach(stats => {
      const bar = this.endpointBars.get(stats.name);
      if (bar) {
        const successRate = (
          (stats.successfulRequests / Math.max(stats.totalRequests, 1)) *
          100
        ).toFixed(0);
        const statsText = `${successRate}% | ${stats.averageResponseTime.toFixed(0)}ms | ${stats.latencyChart}`;

        // Calculate remaining time based on test duration
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.stopAfterMs - elapsed);
        const remainingSeconds = Math.ceil(remaining / 1000);
        const remainingText = remainingSeconds > 0 ? `${remainingSeconds}s` : '0s';

        bar.update(stats.totalRequests, {
          stats: statsText,
          remaining: remainingText,
          value: stats.totalRequests,
          total: this.endpointExpectedTotals.get(stats.name) || stats.totalRequests
        });
      }
    });
  }

  public stop(): void {
    if (this.multibar) {
      this.multibar.stop();
      this.multibar = null;
    }
    // Clear the bars map
    this.endpointBars.clear();
  }

  private calculateEndpointStats(results: RequestResult[]): EndpointStats[] {
    const endpointGroups = new Map<string, RequestResult[]>();

    // Group results by endpoint
    results.forEach(result => {
      const key = result.endpointName || 'Unknown';
      if (!endpointGroups.has(key)) {
        endpointGroups.set(key, []);
      }
      const group = endpointGroups.get(key);
      if (group) {
        group.push(result);
      }
    });

    return Array.from(endpointGroups.entries()).map(([endpointName, endpointResults]) => {
      const totalRequests = endpointResults.length;
      const successfulRequests = endpointResults.filter(r => r.success).length;
      const failedRequests = totalRequests - successfulRequests;

      const responseTimes = endpointResults.map(r => r.responseTime);
      const averageResponseTime =
        responseTimes.reduce((sum, time) => sum + time, 0) / totalRequests;
      const minResponseTime = Math.min(...responseTimes);
      const maxResponseTime = Math.max(...responseTimes);

      // Calculate requests per second based on last 10 seconds of data
      const now = Date.now();
      const recentResults = endpointResults.filter(r => now - r.timestamp <= 10000);
      const requestsPerSecond = recentResults.length / 10;

      // Get recent latencies for chart (last 20 requests)
      const recentLatencies = endpointResults.slice(-20).map(r => r.responseTime);

      const latencyChart = this.generateLatencyChart(recentLatencies);

      // Find the endpoint config to get the actual endpoint URL
      const endpointConfig = this.endpoints.find(
        e => (e.name || `Endpoint-${this.endpoints.indexOf(e) + 1}`) === endpointName
      );
      const endpoint = endpointConfig?.endpoint || 'Unknown';

      return {
        name: endpointName,
        endpoint,
        totalRequests,
        successfulRequests,
        failedRequests,
        averageResponseTime: isNaN(averageResponseTime) ? 0 : averageResponseTime,
        minResponseTime: isNaN(minResponseTime) ? 0 : minResponseTime,
        maxResponseTime: isNaN(maxResponseTime) ? 0 : maxResponseTime,
        requestsPerSecond,
        latencyChart,
        recentLatencies
      };
    });
  }

  private generateLatencyChart(latencies: number[]): string {
    if (latencies.length === 0) return '░░░░░░░░';

    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);
    const range = maxLatency - minLatency;

    if (range === 0) return '▄▄▄▄▄▄▄▄'; // All latencies are the same

    // Create a simple 8-character chart
    const chartLength = 8;
    const chart: string[] = latencies.slice(-chartLength).map(latency => {
      const normalized = (latency - minLatency) / range;
      if (normalized < 0.2) return '▁';
      if (normalized < 0.4) return '▂';
      if (normalized < 0.6) return '▄';
      if (normalized < 0.8) return '▆';
      return '█';
    });

    // Pad with spaces if we don't have enough data
    while (chart.length < chartLength) {
      chart.unshift('░');
    }

    return chart.join('');
  }
}
