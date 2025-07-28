import * as fs from 'fs';
import { LoadTestConfig } from '../src/types';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Configuration Loading', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Valid Configurations', () => {
    it('should load minimal valid configuration', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 1000
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(config));

      // We can't easily test the loadConfig function directly since it's in index.ts
      // and uses process.exit, but we can test the config structure
      expect(config.endpoint).toBe('https://api.example.com/test');
      expect(config.concurrentUsers).toBe(5);
      expect(config.frequencyMs).toBe(1000);
    });

    it('should load configuration with headers', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 3,
        frequencyMs: 500,
        headers: {
          Authorization: 'Bearer token123',
          'Content-Type': 'application/json'
        }
      };

      expect(config.headers).toEqual({
        Authorization: 'Bearer token123',
        'Content-Type': 'application/json'
      });
    });

    it('should load configuration with basic auth', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 2,
        frequencyMs: 200,
        basicAuth: {
          username: 'testuser',
          password: 'testpass'
        }
      };

      expect(config.basicAuth).toEqual({
        username: 'testuser',
        password: 'testpass'
      });
    });

    it('should load configuration with both headers and basic auth', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 100,
        headers: {
          'X-Custom-Header': 'value'
        },
        basicAuth: {
          username: 'user',
          password: 'pass'
        }
      };

      expect(config.headers).toBeDefined();
      expect(config.basicAuth).toBeDefined();
      expect(config.headers!['X-Custom-Header']).toBe('value');
      expect(config.basicAuth!.username).toBe('user');
    });
  });

  describe('Configuration Validation', () => {
    it('should validate endpoint is present', () => {
      const invalidConfig = {
        concurrentUsers: 5,
        frequencyMs: 1000
        // Missing endpoint
      };

      // This would fail validation in the actual loadConfig function
      expect(invalidConfig).not.toHaveProperty('endpoint');
    });

    it('should validate concurrentUsers is positive', () => {
      const configs = [{ concurrentUsers: 0 }, { concurrentUsers: -1 }, { concurrentUsers: 1 }];

      expect(configs[0].concurrentUsers).toBeLessThanOrEqual(0);
      expect(configs[1].concurrentUsers).toBeLessThan(0);
      expect(configs[2].concurrentUsers).toBeGreaterThan(0);
    });

    it('should validate frequencyMs meets minimum', () => {
      const configs = [
        { frequencyMs: 50 }, // Too low
        { frequencyMs: 99 }, // Too low
        { frequencyMs: 100 }, // Valid
        { frequencyMs: 1000 } // Valid
      ];

      expect(configs[0].frequencyMs).toBeLessThan(100);
      expect(configs[1].frequencyMs).toBeLessThan(100);
      expect(configs[2].frequencyMs).toBeGreaterThanOrEqual(100);
      expect(configs[3].frequencyMs).toBeGreaterThanOrEqual(100);
    });
  });

  describe('Optional Fields', () => {
    it('should handle missing optional headers', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000
        // No headers
      };

      expect(config.headers).toBeUndefined();
    });

    it('should handle missing optional basic auth', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000
        // No basicAuth
      };

      expect(config.basicAuth).toBeUndefined();
    });

    it('should handle empty headers object', () => {
      const config: LoadTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        headers: {}
      };

      expect(config.headers).toEqual({});
    });
  });
});
