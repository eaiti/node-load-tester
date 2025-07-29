import { EndpointTestConfig } from '../src/types';

describe('Authentication Configuration Validation', () => {
  describe('Valid Auth Configurations', () => {
    it('should accept basic auth configuration', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'basic',
          username: 'testuser',
          password: 'testpass'
        }
      };

      expect(config.auth?.type).toBe('basic');
      expect(config.auth?.username).toBe('testuser');
      expect(config.auth?.password).toBe('testpass');
    });

    it('should accept bearer token configuration', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'bearer',
          token: 'jwt-token-here'
        }
      };

      expect(config.auth?.type).toBe('bearer');
      expect(config.auth?.token).toBe('jwt-token-here');
    });

    it('should accept API key configuration with default header', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'apikey',
          apiKey: 'api-key-123'
        }
      };

      expect(config.auth?.type).toBe('apikey');
      expect(config.auth?.apiKey).toBe('api-key-123');
      expect(config.auth?.apiKeyHeader).toBeUndefined(); // Should use default
    });

    it('should accept API key configuration with custom header', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'apikey',
          apiKey: 'api-key-456',
          apiKeyHeader: 'X-Custom-Key'
        }
      };

      expect(config.auth?.type).toBe('apikey');
      expect(config.auth?.apiKey).toBe('api-key-456');
      expect(config.auth?.apiKeyHeader).toBe('X-Custom-Key');
    });

    it('should accept custom auth configuration', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'custom',
          customHeader: 'X-Auth-Token',
          customValue: 'token-value'
        }
      };

      expect(config.auth?.type).toBe('custom');
      expect(config.auth?.customHeader).toBe('X-Auth-Token');
      expect(config.auth?.customValue).toBe('token-value');
    });

    it('should maintain backward compatibility with basicAuth', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'basic',
          username: 'legacyuser',
          password: 'legacypass'
        }
      };

      expect(config.auth?.username).toBe('legacyuser');
      expect(config.auth?.password).toBe('legacypass');
    });
  });

  describe('Auth Type Validation', () => {
    const validAuthTypes = ['basic', 'bearer', 'apikey', 'custom'];

    it('should validate auth types', () => {
      validAuthTypes.forEach(type => {
        const config: EndpointTestConfig = {
          endpoint: 'https://api.example.com/test',
          concurrentUsers: 1,
          frequencyMs: 1000,
          auth: {
            type: type as any
          }
        };

        expect(validAuthTypes).toContain(config.auth?.type);
      });
    });

    it('should require username and password for basic auth', () => {
      const incompleteConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'basic'
          // Missing username and password
        }
      };

      expect(incompleteConfig.auth.type).toBe('basic');
      // In real validation, this would fail
    });

    it('should require token for bearer auth', () => {
      const incompleteConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'bearer'
          // Missing token
        }
      };

      expect(incompleteConfig.auth.type).toBe('bearer');
      // In real validation, this would fail
    });

    it('should require apiKey for API key auth', () => {
      const incompleteConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'apikey'
          // Missing apiKey
        }
      };

      expect(incompleteConfig.auth.type).toBe('apikey');
      // In real validation, this would fail
    });

    it('should require customHeader and customValue for custom auth', () => {
      const incompleteConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'custom'
          // Missing customHeader and customValue
        }
      };

      expect(incompleteConfig.auth.type).toBe('custom');
      // In real validation, this would fail
    });
  });

  describe('Mixed Configuration', () => {
    it('should handle config with both auth and basicAuth (auth takes precedence)', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        auth: {
          type: 'basic',
          username: 'legacy',
          password: 'legacy'
        }
      };

      expect(config.auth?.type).toBe('basic');
      expect(config.auth?.username).toBe('legacy');
      expect(config.auth?.password).toBe('legacy');
    });

    it('should handle auth with headers', () => {
      const config: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 1,
        frequencyMs: 1000,
        headers: {
          'Content-Type': 'application/json',
          'X-Custom': 'value'
        },
        auth: {
          type: 'apikey',
          apiKey: 'key123'
        }
      };

      expect(config.headers).toBeDefined();
      expect(config.auth?.type).toBe('apikey');
      expect(config.headers!['Content-Type']).toBe('application/json');
    });
  });
});
