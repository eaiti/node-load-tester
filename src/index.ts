import * as fs from 'fs';
import { LoadTester } from './LoadTester';
import { LoadTestConfig } from './types';
import { ConfigUtils } from './ConfigUtils';

function loadConfig(): LoadTestConfig {
  const parsedArgs = ConfigUtils.parseCommandLineArgs(process.argv);

  if (!fs.existsSync(parsedArgs.configPath)) {
    console.error(
      ConfigUtils.getConfigNotFoundError(parsedArgs.configPath, process.argv.length > 2)
    );
    process.exit(1);
  }

  try {
    const config = ConfigUtils.loadConfigFromFile(parsedArgs.configPath);

    console.log(`Using config file: ${parsedArgs.configPath}`);

    // Validate config
    ConfigUtils.validateConfig(config);

    // Set CSV output path if provided via command line
    if (parsedArgs.csvOutputPath) {
      config.csvOutput = parsedArgs.csvOutputPath;
      console.log(`CSV output will be written to: ${parsedArgs.csvOutputPath}`);
    }

    return config;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error loading config:', errorMessage);
    process.exit(1);
  }
}

async function main() {
  const parsedArgs = ConfigUtils.parseCommandLineArgs(process.argv);

  // Check for help flag
  if (parsedArgs.showHelp) {
    console.log(ConfigUtils.getHelpText());
    process.exit(0);
  }

  console.log('Node Load Tester v1.0.0\n');

  const config = loadConfig();
  const loadTester = new LoadTester(config);

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nReceived SIGINT, stopping load test...');
    await loadTester.stop();
    // Give the terminal a moment to clean up
    setTimeout(() => process.exit(0), 100);
  });

  process.on('SIGTERM', async () => {
    console.log('\nReceived SIGTERM, stopping load test...');
    await loadTester.stop();
    // Give the terminal a moment to clean up
    setTimeout(() => process.exit(0), 100);
  });

  try {
    await loadTester.start();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error starting load test:', errorMessage);
    process.exit(1);
  }
}

// Run the application
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
