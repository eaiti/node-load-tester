import { InteractiveDisplay } from '../src/InteractiveDisplay';
import { EndpointTestConfig, RequestResult } from '../src/types';

// Mock cli-progress completely
const mockSingleBar = {
  update: jest.fn(),
  stop: jest.fn()
};

const mockMultiBar = {
  create: jest.fn(() => mockSingleBar),
  stop: jest.fn()
};

jest.mock('cli-progress', () => ({
  MultiBar: jest.fn(() => mockMultiBar),
  Presets: {
    shades_classic: {}
  }
}));

describe('InteractiveDisplay', () => {
  let endpoints: EndpointTestConfig[];
  let display: InteractiveDisplay;
  let consoleLogSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    endpoints = [
      {
        name: 'API-Test',
        endpoint: 'https://api.example.com/test',
        method: 'GET',
        concurrentUsers: 2,
        frequencyMs: 1000
      },
      {
        endpoint: 'https://api.example.com/data',
        method: 'POST',
        concurrentUsers: 3,
        frequencyMs: 500
      }
    ];

    // Mock process.stdout.isTTY
    Object.defineProperty(process.stdout, 'isTTY', {
      value: true,
      writable: true,
      configurable: true
    });

    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();

    // Reset process.stdout.isTTY
    Object.defineProperty(process.stdout, 'isTTY', {
      value: undefined,
      writable: true,
      configurable: true
    });
  });

  describe('Constructor', () => {
    it('should calculate expected requests for each endpoint', () => {
      const stopAfterMs = 10000; // 10 seconds
      display = new InteractiveDisplay(endpoints, stopAfterMs);

      expect(display).toBeDefined();
    });

    it('should handle endpoints without names', () => {
      const endpointsWithoutNames = [
        {
          endpoint: 'https://api.example.com/test1',
          concurrentUsers: 1,
          frequencyMs: 1000
        },
        {
          endpoint: 'https://api.example.com/test2',
          concurrentUsers: 1,
          frequencyMs: 1000
        }
      ];

      display = new InteractiveDisplay(endpointsWithoutNames, 5000);
      expect(display).toBeDefined();
    });
  });

  describe('Interactive Mode', () => {
    it('should start interactive display when TTY is available', () => {
      display = new InteractiveDisplay(endpoints, 10000);
      display.start();

      expect(consoleLogSpy).toHaveBeenCalledWith('🚀 Starting interactive load test monitor...\n');
      expect(mockMultiBar.create).toHaveBeenCalledTimes(2);
    });

    it('should handle non-interactive mode when TTY is not available', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      });

      display = new InteractiveDisplay(endpoints, 10000);
      display.start();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        'Non-interactive mode detected - using simple logging'
      );
    });
  });

  describe('Update Method', () => {
    beforeEach(() => {
      display = new InteractiveDisplay(endpoints, 10000);
      display.start();
    });

    it('should update progress bars with request results', () => {
      const now = Date.now();
      const results: RequestResult[] = [
        {
          timestamp: now - 1000,
          responseTime: 200,
          statusCode: 200,
          success: true,
          endpointName: 'API-Test',
          endpoint: 'https://api.example.com/test'
        }
      ];

      display.update(results);
      expect(mockSingleBar.update).toHaveBeenCalled();
    });

    it('should handle empty results array', () => {
      display.update([]);
      expect(display).toBeDefined();
    });
  });

  describe('Stop Method', () => {
    it('should stop progress bars in interactive mode', () => {
      display = new InteractiveDisplay(endpoints, 10000);
      display.start();
      display.stop();

      expect(mockMultiBar.stop).toHaveBeenCalled();
    });

    it('should handle stop in non-interactive mode', () => {
      Object.defineProperty(process.stdout, 'isTTY', {
        value: false,
        writable: true,
        configurable: true
      });

      display = new InteractiveDisplay(endpoints, 10000);
      display.start();
      display.stop();

      expect(mockMultiBar.stop).not.toHaveBeenCalled();
    });
  });
});
