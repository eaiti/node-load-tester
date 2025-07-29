import * as fs from 'fs';
import * as path from 'path';
import { LoadTester } from './LoadTester';
import { LoadTestConfig, EndpointTestConfig } from './types';

function validateHttpMethod(method: string): void {
  const validMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

  if (!validMethods.includes(method.toUpperCase())) {
    throw new Error(`method must be one of: ${validMethods.join(', ')}`);
  }
}

function validateAuthConfig(auth: NonNullable<EndpointTestConfig['auth']>): void {
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

function loadConfig(): LoadTestConfig {
  // Check if a config file path was provided as command line argument
  const args = process.argv.slice(2);
  let configPath: string;
  let csvOutputPath: string | undefined;

  // Parse command line arguments
  const configFileArgs = args.filter(arg => !arg.startsWith('--'));
  const csvOutputIndex = args.findIndex(arg => arg === '--csv-output');

  if (csvOutputIndex !== -1 && csvOutputIndex + 1 < args.length) {
    csvOutputPath = args[csvOutputIndex + 1];
  }

  if (configFileArgs.length > 0) {
    // Use the provided config file path
    configPath = path.resolve(configFileArgs[0]);
  } else {
    // Use default config.json in current directory
    configPath = path.join(process.cwd(), 'config.json');
  }

  if (!fs.existsSync(configPath)) {
    console.error('Config file not found at:', configPath); console.error('Please create a config file with the following structure:');
    console.error(`{
  "endpoints": [
    {
      "endpoint": "https://httpbin.org/get",
      "concurrentUsers": 10,
      "frequencyMs": 1000
    }
  ]
}`);
    if (args.length === 0) {
      console.error('\nAlternatively, you can specify a config file path as an argument:');
      console.error('npm run dev -- /path/to/your/config.json');
      console.error('node dist/index.js /path/to/your/config.json');
    }
    process.exit(1);
  }

  try {
    const configData = fs.readFileSync(configPath, 'utf-8');
    const config: LoadTestConfig = JSON.parse(configData);

    console.log(`Using config file: ${configPath}`);

    // Validate config
    if (!config.endpoints || !Array.isArray(config.endpoints) || config.endpoints.length === 0) {
      throw new Error('endpoints must be a non-empty array of endpoint configurations');
    }

    // Validate each endpoint
    config.endpoints.forEach((endpoint, index) => {
      if (!endpoint.endpoint || typeof endpoint.endpoint !== 'string') {
        throw new Error(`endpoints[${index}].endpoint must be a valid URL string`);
      }

      if (!endpoint.concurrentUsers || endpoint.concurrentUsers < 1) {
        throw new Error(`endpoints[${index}].concurrentUsers must be a positive number`);
      }

      if (!endpoint.frequencyMs || endpoint.frequencyMs < 100) {
        throw new Error(`endpoints[${index}].frequencyMs must be at least 100ms`);
      }

      // Validate HTTP method
      if (endpoint.method) {
        validateHttpMethod(endpoint.method);
      }

      // Validate authentication configuration
      if (endpoint.auth) {
        validateAuthConfig(endpoint.auth);
      }
    });

    // Validate stopAfterMs if provided, otherwise set default
    if (config.stopAfterMs !== undefined) {
      if (typeof config.stopAfterMs !== 'number' || config.stopAfterMs < 1000) {
        throw new Error('stopAfterMs must be a number >= 1000 (at least 1 second)');
      }
    } else {
      // Set default to 20 minutes if not provided
      config.stopAfterMs = 20 * 60 * 1000; // 20 minutes in milliseconds
    }

    // Set CSV output path if provided via command line
    if (csvOutputPath) {
      config.csvOutput = csvOutputPath;
      console.log(`CSV output will be written to: ${csvOutputPath}`);
    }

    return config;
  } catch (error: any) {
    console.error('Error loading config:', error.message);
    process.exit(1);
  }
}

async function main() {
  const args = process.argv.slice(2);

  // Check for help flag
  if (args.includes('--help') || args.includes('-h')) {
    console.log('Node Load Tester v1.0.0\n');
    console.log('Usage:');
    console.log('  npm run dev                                    # Use default config.json');
    console.log('  npm run dev -- <config-file>                  # Use custom config file');
    console.log('  npm run dev -- <config-file> --csv-output <file> # Save detailed results to CSV');
    console.log('  node dist/index.js <config-file>               # Use custom config file (compiled)');
    console.log('\nExamples:');
    console.log('  npm run dev -- ./my-config.json');
    console.log('  npm run dev -- /path/to/config.json');
    console.log('  npm run dev -- config.json --csv-output results.csv');
    console.log('  node dist/index.js config.example.json');
    console.log('\nOptions:');
    console.log('  -h, --help              Show this help message');
    console.log('  --csv-output <file>     Export detailed request data to CSV file');
    process.exit(0);
  }

  console.log('Node Load Tester v1.0.0\n');

  const config = loadConfig();
  const loadTester = new LoadTester(config);

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nReceived SIGINT, stopping load test...');
    loadTester.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\nReceived SIGTERM, stopping load test...');
    loadTester.stop();
    process.exit(0);
  });

  try {
    await loadTester.start();
  } catch (error: any) {
    console.error('Error starting load test:', error.message);
    process.exit(1);
  }
}

// Run the application
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
