# GitHub Copilot Instructions for Node Load Tester

## Project Overview
This is a TypeScript-based HTTP load testing tool that simulates concurrent users making requests to a specified endpoint. The tool provides real-time statistics and supports custom headers and basic authentication.

## Key Architecture
- **Main Entry**: `src/index.ts` - Configuration loading and application startup
- **Core Logic**: `src/LoadTester.ts` - Load testing implementation with statistics
- **Types**: `src/types.ts` - TypeScript interfaces for configuration and results
- **Config**: `config.json` - Default JSON configuration for endpoints, concurrency, and auth
- **Examples**: `examples/` - Example configurations for different HTTP methods and auth types
- **Tests**: `tests/` - Jest tests with mocked HTTP endpoints using nock

## Code Style Guidelines
1. **TypeScript First**: Always use proper TypeScript types and interfaces
2. **Error Handling**: Wrap async operations in try-catch blocks with meaningful error messages
3. **Configuration**: All runtime behavior should be configurable via `config.json`
4. **Statistics**: Track and display performance metrics (response times, success rates, etc.)
5. **Graceful Shutdown**: Handle SIGINT/SIGTERM for clean exit with final statistics

## Key Patterns
- Use `axios` for HTTP requests with proper timeout and error handling
- Implement concurrent execution using `setInterval` for each simulated user
- Display real-time progress with `.` for success and `x` for failures
- Calculate statistics every 5 seconds and show final results on exit
- Support optional headers and basic authentication in requests

## Testing Approach
- Use `nock` to mock HTTP endpoints for deterministic testing
- Test both successful and failed request scenarios
- Validate configuration loading and validation logic
- Test authentication and header injection
- Ensure proper cleanup of intervals and resources

## Configuration Schema
```typescript
interface LoadTestConfig {
  endpoint: string;           // Required: Target URL
  concurrentUsers: number;    // Required: Number of concurrent connections (min: 1)
  frequencyMs: number;        // Required: Request frequency in ms (min: 100)
  headers?: Record<string, string>;  // Optional: Custom HTTP headers
  auth?: {                    // Optional: Authentication configuration
    type: 'basic' | 'bearer' | 'apikey' | 'custom';
    // Basic Auth
    username?: string;
    password?: string;
    // Bearer Token
    token?: string;
    // API Key
    apiKey?: string;
    apiKeyHeader?: string;    // Default: 'X-API-Key'
    // Custom Auth
    customHeader?: string;
    customValue?: string;
  };
  basicAuth?: {               // Deprecated: Use auth instead
    username: string;
    password: string;
  };
}
```

## Command Line Usage
The application supports flexible configuration file loading:
- Default: Uses `config.json` in current directory
- Custom: Accepts config file path as first argument
- Help: Use `--help` or `-h` flag for usage information
- Error handling: Provides clear messages for missing or invalid configs

## Development Commands
- `npm run dev` - Run in development mode with ts-node (default config.json)
- `npm run dev -- <config-file>` - Run with custom config file
- `npm run dev:example` - Run with config.example.json (Bearer auth)
- `npm run dev:basic` - Run with basic authentication example
- `npm run dev:apikey` - Run with API key authentication example
- `npm run dev:custom` - Run with custom authentication example
- `npm run dev:post` - Run with config.post.json (POST method)
- `npm run dev:put` - Run with config.put.json (PUT method)
- `npm run dev:patch` - Run with config.patch.json (PATCH method)
- `npm run dev:delete` - Run with config.delete.json (DELETE method)
- `npm run dev:head` - Run with config.head.json (HEAD method)
- `npm run dev:options` - Run with config.options.json (OPTIONS method)
- `npm start` - Run compiled version (default config.json)
- `node dist/index.js <config-file>` - Run compiled version with custom config
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## When Adding Features
1. Update TypeScript interfaces in `src/types.ts` first
2. Implement logic in `src/LoadTester.ts` with proper error handling
3. Add configuration validation in `src/index.ts`
4. Update `config.json` with example usage
5. Create example configs in `examples/` directory if needed
6. Write comprehensive tests in `tests/` directory
7. Update README.md with documentation

## Common Extension Points
- **Response Validation**: Could add response body validation or assertions
- **Output Formats**: Could add CSV/JSON export of results
- **Advanced Statistics**: Could add percentiles, histograms, etc.
- **Dynamic Load**: Could support ramping up/down concurrent users over time

## Dependencies
- **Runtime**: `axios` for HTTP requests
- **Development**: `typescript`, `ts-node`, `@types/node`
- **Testing**: `jest`, `ts-jest`, `nock`, `@types/jest`

Focus on maintainable, well-tested code that follows the existing patterns and provides clear error messages for configuration issues.
