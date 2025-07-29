import * as fs from 'fs';
import { ConfigUtils } from '../src/ConfigUtils';
import { LoadTestConfig, EndpointTestConfig } from '../src/types';

// Mock fs module
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('ConfigUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock process.cwd() to return a consistent value
    jest.spyOn(process, 'cwd').mockReturnValue('/test/workspace');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseCommandLineArgs', () => {
    it('should parse default config path when no arguments provided', () => {
      const argv = ['node', 'index.js'];
      const result = ConfigUtils.parseCommandLineArgs(argv);

      expect(result).toEqual({
        configPath: '/test/workspace/config.json',
        showHelp: false
      });
    });

    it('should parse custom config file path', () => {
      const argv = ['node', 'index.js', 'custom-config.json'];
      const result = ConfigUtils.parseCommandLineArgs(argv);

      expect(result.configPath).toContain('custom-config.json');
      expect(result.showHelp).toBe(false);
    });

    it('should detect help flags', () => {
      const argvHelp = ['node', 'index.js', '--help'];
      const resultHelp = ConfigUtils.parseCommandLineArgs(argvHelp);
      expect(resultHelp.showHelp).toBe(true);

      const argvH = ['node', 'index.js', '-h'];
      const resultH = ConfigUtils.parseCommandLineArgs(argvH);
      expect(resultH.showHelp).toBe(true);
    });

    it('should parse CSV output path', () => {
      const argv = ['node', 'index.js', 'config.json', '--csv-output', 'results.csv'];
      const result = ConfigUtils.parseCommandLineArgs(argv);

      expect(result.csvOutputPath).toBe('results.csv');
      expect(result.configPath).toContain('config.json');
    });

    it('should handle CSV output flag without path', () => {
      const argv = ['node', 'index.js', 'config.json', '--csv-output'];
      const result = ConfigUtils.parseCommandLineArgs(argv);

      expect(result.csvOutputPath).toBeUndefined();
    });

    it('should resolve absolute paths for config files', () => {
      const argv = ['node', 'index.js', '/absolute/path/config.json'];
      const result = ConfigUtils.parseCommandLineArgs(argv);

      expect(result.configPath).toBe('/absolute/path/config.json');
    });
  });

  describe('validateHttpMethod', () => {
    it('should accept valid HTTP methods', () => {
      const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

      validMethods.forEach(method => {
        expect(() => ConfigUtils.validateHttpMethod(method)).not.toThrow();
        expect(() => ConfigUtils.validateHttpMethod(method.toLowerCase())).not.toThrow();
      });
    });

    it('should reject invalid HTTP methods', () => {
      const invalidMethods = ['INVALID', 'TEST', '', 'get post'];

      invalidMethods.forEach(method => {
        expect(() => ConfigUtils.validateHttpMethod(method)).toThrow();
      });
    });

    it('should provide helpful error message for invalid methods', () => {
      expect(() => ConfigUtils.validateHttpMethod('INVALID')).toThrow(
        'method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS'
      );
    });
  });

  describe('validateAuthConfig', () => {
    it('should validate basic auth configuration', () => {
      const validBasicAuth = {
        type: 'basic' as const,
        username: 'user',
        password: 'pass'
      };

      expect(() => ConfigUtils.validateAuthConfig(validBasicAuth)).not.toThrow();
    });

    it('should reject basic auth without username or password', () => {
      const invalidBasicAuth1 = {
        type: 'basic' as const,
        password: 'pass'
      } as Partial<EndpointTestConfig['auth']>;

      const invalidBasicAuth2 = {
        type: 'basic' as const,
        username: 'user'
      } as Partial<EndpointTestConfig['auth']>;

      expect(() =>
        ConfigUtils.validateAuthConfig(invalidBasicAuth1 as NonNullable<EndpointTestConfig['auth']>)
      ).toThrow('auth.username and auth.password are required for basic auth');
      expect(() =>
        ConfigUtils.validateAuthConfig(invalidBasicAuth2 as NonNullable<EndpointTestConfig['auth']>)
      ).toThrow('auth.username and auth.password are required for basic auth');
    });

    it('should validate bearer auth configuration', () => {
      const validBearerAuth = {
        type: 'bearer' as const,
        token: 'bearer-token'
      };

      expect(() => ConfigUtils.validateAuthConfig(validBearerAuth)).not.toThrow();
    });

    it('should reject bearer auth without token', () => {
      const invalidBearerAuth = {
        type: 'bearer' as const
      } as Partial<EndpointTestConfig['auth']>;

      expect(() =>
        ConfigUtils.validateAuthConfig(invalidBearerAuth as NonNullable<EndpointTestConfig['auth']>)
      ).toThrow('auth.token is required for bearer auth');
    });

    it('should validate API key auth configuration', () => {
      const validApiKeyAuth = {
        type: 'apikey' as const,
        apiKey: 'api-key-value'
      };

      expect(() => ConfigUtils.validateAuthConfig(validApiKeyAuth)).not.toThrow();
    });

    it('should reject API key auth without apiKey', () => {
      const invalidApiKeyAuth = {
        type: 'apikey' as const
      } as Partial<EndpointTestConfig['auth']>;

      expect(() =>
        ConfigUtils.validateAuthConfig(invalidApiKeyAuth as NonNullable<EndpointTestConfig['auth']>)
      ).toThrow('auth.apiKey is required for API key auth');
    });

    it('should validate custom auth configuration', () => {
      const validCustomAuth = {
        type: 'custom' as const,
        customHeader: 'X-Custom-Auth',
        customValue: 'custom-value'
      };

      expect(() => ConfigUtils.validateAuthConfig(validCustomAuth)).not.toThrow();
    });

    it('should reject custom auth without required fields', () => {
      const invalidCustomAuth1 = {
        type: 'custom' as const,
        customValue: 'custom-value'
      } as Partial<EndpointTestConfig['auth']>;

      const invalidCustomAuth2 = {
        type: 'custom' as const,
        customHeader: 'X-Custom-Auth'
      } as Partial<EndpointTestConfig['auth']>;

      expect(() =>
        ConfigUtils.validateAuthConfig(
          invalidCustomAuth1 as NonNullable<EndpointTestConfig['auth']>
        )
      ).toThrow('auth.customHeader and auth.customValue are required for custom auth');
      expect(() =>
        ConfigUtils.validateAuthConfig(
          invalidCustomAuth2 as NonNullable<EndpointTestConfig['auth']>
        )
      ).toThrow('auth.customHeader and auth.customValue are required for custom auth');
    });

    it('should reject invalid auth types', () => {
      const invalidAuth = {
        type: 'invalid'
      } as unknown as NonNullable<EndpointTestConfig['auth']>;

      expect(() => ConfigUtils.validateAuthConfig(invalidAuth)).toThrow(
        'auth.type must be one of: basic, bearer, apikey, custom'
      );
    });
  });

  describe('validateEndpoint', () => {
    it('should validate a complete endpoint configuration', () => {
      const validEndpoint: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 1000
      };

      expect(() => ConfigUtils.validateEndpoint(validEndpoint, 0)).not.toThrow();
    });

    it('should reject invalid endpoint URLs', () => {
      const invalidEndpoint = {
        endpoint: 'not-a-url',
        concurrentUsers: 5,
        frequencyMs: 1000
      };

      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint, 0)).toThrow(
        'endpoints[0].endpoint must be a valid URL'
      );
    });

    it('should reject missing or invalid endpoint', () => {
      const invalidEndpoint1 = {
        concurrentUsers: 5,
        frequencyMs: 1000
      } as Partial<EndpointTestConfig>;

      const invalidEndpoint2 = {
        endpoint: '',
        concurrentUsers: 5,
        frequencyMs: 1000
      };

      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint1 as EndpointTestConfig, 0)).toThrow(
        'endpoints[0].endpoint must be a valid URL string'
      );
      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint2, 0)).toThrow(
        'endpoints[0].endpoint must be a valid URL string'
      );
    });

    it('should reject invalid concurrentUsers values', () => {
      const invalidEndpoint1 = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 0,
        frequencyMs: 1000
      };

      const invalidEndpoint2 = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: -1,
        frequencyMs: 1000
      };

      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint1, 0)).toThrow(
        'endpoints[0].concurrentUsers must be a positive number'
      );
      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint2, 0)).toThrow(
        'endpoints[0].concurrentUsers must be a positive number'
      );
    });

    it('should reject invalid frequencyMs values', () => {
      const invalidEndpoint1 = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 99
      };

      const invalidEndpoint2 = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 0
      };

      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint1, 0)).toThrow(
        'endpoints[0].frequencyMs must be at least 100ms'
      );
      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint2, 0)).toThrow(
        'endpoints[0].frequencyMs must be at least 100ms'
      );
    });

    it('should validate HTTP method when provided', () => {
      const validEndpoint: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 1000,
        method: 'POST'
      };
      
      expect(() => ConfigUtils.validateEndpoint(validEndpoint, 0)).not.toThrow();
      
      const invalidEndpoint: EndpointTestConfig = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 1000,
        method: 'INVALID' as 'POST' // Type assertion for testing invalid values
      };
      
      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint, 0)).toThrow();
    });

    it('should validate auth configuration when provided', () => {
      const validEndpoint = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 1000,
        auth: {
          type: 'basic' as const,
          username: 'user',
          password: 'pass'
        }
      };

      expect(() => ConfigUtils.validateEndpoint(validEndpoint, 0)).not.toThrow();

      const invalidEndpoint = {
        endpoint: 'https://api.example.com/test',
        concurrentUsers: 5,
        frequencyMs: 1000,
        auth: {
          type: 'basic' as const,
          username: 'user'
        }
      } as EndpointTestConfig;

      expect(() => ConfigUtils.validateEndpoint(invalidEndpoint, 0)).toThrow();
    });
  });

  describe('validateConfig', () => {
    it('should validate a complete configuration', () => {
      const validConfig: LoadTestConfig = {
        endpoints: [
          {
            endpoint: 'https://api.example.com/test',
            concurrentUsers: 5,
            frequencyMs: 1000
          }
        ]
      };

      expect(() => ConfigUtils.validateConfig(validConfig)).not.toThrow();
    });

    it('should reject config without endpoints', () => {
      const invalidConfig1 = {} as Partial<LoadTestConfig>;
      const invalidConfig2 = { endpoints: [] } as LoadTestConfig;
      const invalidConfig3 = { endpoints: null } as unknown as LoadTestConfig;

      expect(() => ConfigUtils.validateConfig(invalidConfig1 as LoadTestConfig)).toThrow(
        'endpoints must be a non-empty array of endpoint configurations'
      );
      expect(() => ConfigUtils.validateConfig(invalidConfig2)).toThrow(
        'endpoints must be a non-empty array of endpoint configurations'
      );
      expect(() => ConfigUtils.validateConfig(invalidConfig3)).toThrow(
        'endpoints must be a non-empty array of endpoint configurations'
      );
    });

    it('should validate stopAfterMs when provided', () => {
      const validConfig: LoadTestConfig = {
        endpoints: [
          {
            endpoint: 'https://api.example.com/test',
            concurrentUsers: 5,
            frequencyMs: 1000
          }
        ],
        stopAfterMs: 30000
      };

      expect(() => ConfigUtils.validateConfig(validConfig)).not.toThrow();

      const invalidConfig: LoadTestConfig = {
        endpoints: [
          {
            endpoint: 'https://api.example.com/test',
            concurrentUsers: 5,
            frequencyMs: 1000
          }
        ],
        stopAfterMs: 500
      };

      expect(() => ConfigUtils.validateConfig(invalidConfig)).toThrow(
        'stopAfterMs must be a number >= 1000 (at least 1 second)'
      );
    });

    it('should validate all endpoints in the array', () => {
      const invalidConfig: LoadTestConfig = {
        endpoints: [
          {
            endpoint: 'https://api.example.com/test',
            concurrentUsers: 5,
            frequencyMs: 1000
          },
          {
            endpoint: 'not-a-url',
            concurrentUsers: 5,
            frequencyMs: 1000
          }
        ]
      };

      expect(() => ConfigUtils.validateConfig(invalidConfig)).toThrow(
        'endpoints[1].endpoint must be a valid URL'
      );
    });
  });

  describe('loadConfigFromFile', () => {
    it('should load and parse valid configuration file', () => {
      const configData = JSON.stringify({
        endpoints: [
          {
            endpoint: 'https://api.example.com/test',
            concurrentUsers: 5,
            frequencyMs: 1000
          }
        ]
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(configData);

      const result = ConfigUtils.loadConfigFromFile('/test/config.json');

      expect(result.endpoints).toHaveLength(1);
      expect(result.endpoints[0].endpoint).toBe('https://api.example.com/test');
      expect(result.stopAfterMs).toBe(20 * 60 * 1000); // Default value
    });

    it('should throw error for non-existent file', () => {
      mockFs.existsSync.mockReturnValue(false);

      expect(() => ConfigUtils.loadConfigFromFile('/test/missing.json')).toThrow(
        'Config file not found at: /test/missing.json'
      );
    });

    it('should throw error for invalid JSON', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('{ invalid json');

      expect(() => ConfigUtils.loadConfigFromFile('/test/config.json')).toThrow(
        'Invalid JSON in config file:'
      );
    });

    it('should preserve existing stopAfterMs value', () => {
      const configData = JSON.stringify({
        endpoints: [
          {
            endpoint: 'https://api.example.com/test',
            concurrentUsers: 5,
            frequencyMs: 1000
          }
        ],
        stopAfterMs: 60000
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(configData);

      const result = ConfigUtils.loadConfigFromFile('/test/config.json');

      expect(result.stopAfterMs).toBe(60000);
    });
  });

  describe('getHelpText', () => {
    it('should return formatted help text', () => {
      const helpText = ConfigUtils.getHelpText();

      expect(helpText).toContain('Node Load Tester v1.0.0');
      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('Examples:');
      expect(helpText).toContain('Options:');
      expect(helpText).toContain('--help');
      expect(helpText).toContain('--csv-output');
    });
  });

  describe('getConfigNotFoundError', () => {
    it('should generate error message with config path', () => {
      const errorMessage = ConfigUtils.getConfigNotFoundError('/test/config.json', false);

      expect(errorMessage).toContain('Config file not found at: /test/config.json');
      expect(errorMessage).toContain('Please create a config file');
      expect(errorMessage).toContain('"endpoints"');
    });

    it('should include alternative usage when no args provided', () => {
      const errorMessage = ConfigUtils.getConfigNotFoundError('/test/config.json', false);

      expect(errorMessage).toContain('you can specify a config file path as an argument');
      expect(errorMessage).toContain('npm run dev --');
    });

    it('should not include alternative usage when args provided', () => {
      const errorMessage = ConfigUtils.getConfigNotFoundError('/test/config.json', true);

      expect(errorMessage).not.toContain('you can specify a config file path as an argument');
    });
  });
});
