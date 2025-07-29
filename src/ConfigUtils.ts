import * as fs from 'fs';
import * as path from 'path';
import { LoadTestConfig, EndpointTestConfig } from './types';

export interface ParsedArgs {
  configPath: string;
  csvOutputPath?: string;
  showHelp: boolean;
}

/**
 * Utility class for configuration loading and validation
 */
export class ConfigUtils {
  /**
   * Parse command line arguments
   */
  static parseCommandLineArgs(argv: string[]): ParsedArgs {
    const args = argv.slice(2);

    // Check for help flag
    const showHelp = args.includes('--help') || args.includes('-h');

    if (showHelp) {
      return { configPath: '', showHelp: true };
    }

    // Parse command line arguments
    const configFileArgs = args.filter(arg => !arg.startsWith('--'));
    const csvOutputIndex = args.findIndex(arg => arg === '--csv-output');

    let csvOutputPath: string | undefined;
    if (csvOutputIndex !== -1 && csvOutputIndex + 1 < args.length) {
      csvOutputPath = args[csvOutputIndex + 1];
    }

    const configPath =
      configFileArgs.length > 0
        ? path.resolve(configFileArgs[0])
        : path.join(process.cwd(), 'config.json');

    return { configPath, csvOutputPath, showHelp: false };
  }

  /**
   * Validate HTTP method
   */
  static validateHttpMethod(method: string): void {
    const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    if (!validMethods.includes(method.toUpperCase())) {
      throw new Error(`method must be one of: ${validMethods.join(', ')}`);
    }
  }

  /**
   * Validate authentication configuration
   */
  static validateAuthConfig(auth: NonNullable<EndpointTestConfig['auth']>): void {
    const validTypes = ['basic', 'bearer', 'apikey', 'custom'];

    if (!validTypes.includes(auth.type)) {
      throw new Error(`auth.type must be one of: ${validTypes.join(', ')}`);
    }

    switch (auth.type) {
      case 'basic':
        if (!auth.username || !auth.password) {
          throw new Error('auth.username and auth.password are required for basic auth');
        }
        break;

      case 'bearer':
        if (!auth.token) {
          throw new Error('auth.token is required for bearer auth');
        }
        break;

      case 'apikey':
        if (!auth.apiKey) {
          throw new Error('auth.apiKey is required for API key auth');
        }
        break;

      case 'custom':
        if (!auth.customHeader || !auth.customValue) {
          throw new Error('auth.customHeader and auth.customValue are required for custom auth');
        }
        break;
    }
  }

  /**
   * Validate a single endpoint configuration
   */
  static validateEndpoint(endpoint: EndpointTestConfig, index: number): void {
    if (!endpoint.endpoint || typeof endpoint.endpoint !== 'string') {
      throw new Error(`endpoints[${index}].endpoint must be a valid URL string`);
    }

    // Validate URL format
    try {
      new URL(endpoint.endpoint);
    } catch {
      throw new Error(`endpoints[${index}].endpoint must be a valid URL`);
    }

    if (!endpoint.concurrentUsers || endpoint.concurrentUsers < 1) {
      throw new Error(`endpoints[${index}].concurrentUsers must be a positive number`);
    }

    if (!endpoint.frequencyMs || endpoint.frequencyMs < 100) {
      throw new Error(`endpoints[${index}].frequencyMs must be at least 100ms`);
    }

    // Validate HTTP method
    if (endpoint.method) {
      this.validateHttpMethod(endpoint.method);
    }

    // Validate authentication configuration
    if (endpoint.auth) {
      this.validateAuthConfig(endpoint.auth);
    }
  }

  /**
   * Validate the entire configuration object
   */
  static validateConfig(config: LoadTestConfig): void {
    if (!config.endpoints || !Array.isArray(config.endpoints) || config.endpoints.length === 0) {
      throw new Error('endpoints must be a non-empty array of endpoint configurations');
    }

    // Validate each endpoint
    config.endpoints.forEach((endpoint, index) => {
      this.validateEndpoint(endpoint, index);
    });

    // Validate stopAfterMs if provided
    if (config.stopAfterMs !== undefined) {
      if (typeof config.stopAfterMs !== 'number' || config.stopAfterMs < 1000) {
        throw new Error('stopAfterMs must be a number >= 1000 (at least 1 second)');
      }
    }
  }

  /**
   * Load and parse configuration from file
   */
  static loadConfigFromFile(configPath: string): LoadTestConfig {
    if (!fs.existsSync(configPath)) {
      throw new Error(`Config file not found at: ${configPath}`);
    }

    try {
      const configData = fs.readFileSync(configPath, 'utf-8');
      const config: LoadTestConfig = JSON.parse(configData);

      // Set default stopAfterMs if not provided
      if (config.stopAfterMs === undefined) {
        config.stopAfterMs = 20 * 60 * 1000; // 20 minutes in milliseconds
      }

      return config;
    } catch (error: unknown) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid JSON in config file: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Generate help text
   */
  static getHelpText(): string {
    return `Node Load Tester v1.0.0

Usage:
  npm run dev                                    # Use default config.json
  npm run dev -- <config-file>                  # Use custom config file
  npm run dev -- <config-file> --csv-output <file> # Save detailed results to CSV
  node dist/index.js <config-file>               # Use custom config file (compiled)

Examples:
  npm run dev -- ./my-config.json
  npm run dev -- /path/to/config.json
  npm run dev -- config.json --csv-output results.csv
  node dist/index.js examples/config.example.json

Predefined Example Scripts:
  npm run dev:example     # Bearer token authentication example
  npm run dev:basic       # Basic authentication example
  npm run dev:apikey      # API key authentication example
  npm run dev:custom      # Custom header authentication example
  npm run dev:post        # POST request example
  npm run dev:put         # PUT request example
  npm run dev:patch       # PATCH request example
  npm run dev:delete      # DELETE request example
  npm run dev:head        # HEAD request example
  npm run dev:options     # OPTIONS request example

Options:
  -h, --help              Show this help message
  --csv-output <file>     Export detailed request data to CSV file`;
  }

  /**
   * Generate config file not found error message
   */
  static getConfigNotFoundError(configPath: string, hasArgs: boolean): string {
    let message = `Config file not found at: ${configPath}\n`;
    message += 'Please create a config file with the following structure:\n';
    message += `{
  "endpoints": [
    {
      "endpoint": "https://httpbin.org/get",
      "concurrentUsers": 10,
      "frequencyMs": 1000
    }
  ]
}`;

    if (!hasArgs) {
      message += '\n\nAlternatively, you can specify a config file path as an argument:\n';
      message += 'npm run dev -- /path/to/your/config.json\n';
      message += 'node dist/index.js /path/to/your/config.json';
    }

    return message;
  }
}
