import nock from 'nock';
import { LoadTester } from '../src/LoadTester';
import { LoadTestConfig } from '../src/types';

describe('LoadTester', () => {
  let loadTester: LoadTester;
  const mockEndpoint = 'http://test-api.example.com';

  beforeEach(() => {
    // Setup fresh state for each test
  });

  afterEach(() => {
    if (loadTester) {
      loadTester.stop();
    }
    // Clean up after each test
  });

  describe('Basic Load Testing', () => {
    it('should make successful requests to the endpoint', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/test`,
        concurrentUsers: 2,
        frequencyMs: 500
      };

      // Mock the API endpoint
      const scope = nock(mockEndpoint)
        .get('/api/test')
        .times(4) // Allow multiple requests
        .reply(200, { success: true, timestamp: Date.now() });

      loadTester = new LoadTester(config);

      // Start the load test
      await loadTester.start();

      // Let it run for a short time
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Stop the load test
      loadTester.stop();

      // Verify that requests were made
      expect(scope.pendingMocks().length).toBeLessThan(4);
    });

    it('should handle failed requests gracefully', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/error`,
        concurrentUsers: 1,
        frequencyMs: 500
      };

      // Mock the API endpoint to return errors
      const scope = nock(mockEndpoint)
        .get('/api/error')
        .times(2)
        .reply(500, { error: 'Internal Server Error' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      // Verify that requests were attempted
      expect(scope.pendingMocks().length).toBeLessThan(2);
    });
  });

  describe('Authentication Types', () => {
    it('should send basic auth credentials using new auth format', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/auth`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'basic',
          username: 'testuser',
          password: 'testpass'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/auth')
        .basicAuth({ user: 'testuser', pass: 'testpass' })
        .reply(200, { authenticated: true });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });

    it('should send bearer token authentication', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/bearer`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'bearer',
          token: 'test-bearer-token-123'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/bearer')
        .matchHeader('Authorization', 'Bearer test-bearer-token-123')
        .reply(200, { authenticated: true, type: 'bearer' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });

    it('should send API key authentication with default header', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/apikey`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'apikey',
          apiKey: 'test-api-key-456'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/apikey')
        .matchHeader('X-API-Key', 'test-api-key-456')
        .reply(200, { authenticated: true, type: 'apikey' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });

    it('should send API key authentication with custom header', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/apikey`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'apikey',
          apiKey: 'test-api-key-789',
          apiKeyHeader: 'X-Custom-API-Key'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/apikey')
        .matchHeader('X-Custom-API-Key', 'test-api-key-789')
        .reply(200, { authenticated: true, type: 'apikey' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });

    it('should send custom authentication header', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/custom`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'custom',
          customHeader: 'X-Auth-Token',
          customValue: 'custom-token-abc123'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/custom')
        .matchHeader('X-Auth-Token', 'custom-token-abc123')
        .reply(200, { authenticated: true, type: 'custom' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });

    it('should maintain backward compatibility with basicAuth format', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/legacy`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        basicAuth: {
          username: 'legacyuser',
          password: 'legacypass'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/legacy')
        .basicAuth({ user: 'legacyuser', pass: 'legacypass' })
        .reply(200, { authenticated: true, legacy: true });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });

    it('should handle authentication failures for different auth types', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/auth-fail`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'bearer',
          token: 'invalid-token'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/auth-fail')
        .matchHeader('Authorization', 'Bearer invalid-token')
        .reply(401, { error: 'Invalid token' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });
  });

  describe('Configuration Validation', () => {
    it('should work with minimal valid configuration', () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/test`,
        concurrentUsers: 1,
        frequencyMs: 100
      };

      expect(() => new LoadTester(config)).not.toThrow();
    });

    it('should work with full configuration including optional fields', () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/test`,
        concurrentUsers: 5,
        frequencyMs: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key'
        },
        basicAuth: {
          username: 'user',
          password: 'pass'
        }
      };

      expect(() => new LoadTester(config)).not.toThrow();
    });
  });

  describe('Performance Metrics', () => {
    it('should track response times', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/timing`,
        concurrentUsers: 1,
        frequencyMs: 500
      };

      // Mock with delay to test response time tracking
      const scope = nock(mockEndpoint)
        .get('/api/timing')
        .times(2)
        .delay(100) // Add 100ms delay
        .reply(200, { data: 'test' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      // Response times should be tracked (though we can't easily test private methods)
      expect(scope.pendingMocks().length).toBeLessThan(2);
    });
  });

  describe('Headers and Legacy Authentication', () => {
    it('should send custom headers with requests', async () => {
      const config: LoadTestConfig = {
        endpoint: `${mockEndpoint}/api/headers`,
        concurrentUsers: 1,
        frequencyMs: 1000,
        headers: {
          'X-Custom-Header': 'test-value',
          Accept: 'application/json'
        }
      };

      const scope = nock(mockEndpoint)
        .get('/api/headers')
        .matchHeader('X-Custom-Header', 'test-value')
        .matchHeader('Accept', 'application/json')
        .reply(200, { received: 'headers' });

      loadTester = new LoadTester(config);

      await loadTester.start();
      await new Promise(resolve => setTimeout(resolve, 1200));
      loadTester.stop();

      expect(scope.isDone()).toBe(true);
    });
  });
});
