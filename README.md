# Node Load Tester

A simple HTTP load testing tool built with TypeScript and Node.js.

## Features

- Configurable endpoint testing
- Concurrent users simulation
- Real-time statistics
- JSON configuration
- TypeScript support

## Installation

```bash
npm install
```

## Configuration

Create or modify the `config.json` file in the root directory:

```json
{
  "endpoint": "https://api.example.com/data",
  "concurrentUsers": 10,
  "frequencyMs": 1000,
  "headers": {
    "Accept": "application/json",
    "Content-Type": "application/json"
  },
  "auth": {
    "type": "bearer",
    "token": "your-jwt-token-here"
  }
}
```

### Configuration Options

- `endpoint`: The HTTP endpoint to test (required)
- `concurrentUsers`: Number of concurrent users/connections (minimum: 1)
- `frequencyMs`: Frequency of requests in milliseconds (minimum: 100ms)
- `headers`: Optional HTTP headers to include with each request
- `auth`: Optional authentication configuration (see Authentication Types below)
- `basicAuth`: Optional basic authentication (deprecated, use `auth` instead)

### Authentication Types

The `auth` configuration supports multiple authentication methods:

#### Basic Authentication

```json
{
  "auth": {
    "type": "basic",
    "username": "your-username",
    "password": "your-password"
  }
}
```

#### Bearer Token (JWT)

```json
{
  "auth": {
    "type": "bearer",
    "token": "your-jwt-token"
  }
}
```

#### API Key

```json
{
  "auth": {
    "type": "apikey",
    "apiKey": "your-api-key",
    "apiKeyHeader": "X-API-Key"
  }
}
```

Note: `apiKeyHeader` defaults to `"X-API-Key"` if not specified.

#### Custom Authentication

```json
{
  "auth": {
    "type": "custom",
    "customHeader": "X-Auth-Token",
    "customValue": "your-custom-token"
  }
}
```

## Usage

### Default Configuration

```bash
# Development mode (uses config.json in current directory)
npm run dev

# Production mode (uses config.json in current directory)
npm run build
npm start
```

### Custom Configuration File

```bash
# Development mode with custom config file
npm run dev -- ./my-config.json
npm run dev -- /path/to/custom-config.json

# Production mode with custom config file
npm run build
node dist/index.js ./my-config.json
node dist/index.js /path/to/custom-config.json
```

### Help

```bash
npm run dev -- --help
# or
node dist/index.js --help
```

## Example Output

```
Node Load Tester v1.0.0

Starting load test...
Endpoint: https://httpbin.org/get
Concurrent Users: 10
Frequency: 1000ms
Press Ctrl+C to stop

..........x....x......

--- Load Test Statistics ---
Total Requests: 156
Successful: 152 (97.4%)
Failed: 4 (2.6%)
Average Response Time: 245.67ms
Min Response Time: 123ms
Max Response Time: 1245ms
Requests/Second: 2.34
```

## Scripts

- `npm run build`: Compile TypeScript to JavaScript
- `npm run start`: Run the compiled application (uses default config.json)
- `npm run dev`: Run in development mode with ts-node (uses default config.json)
- `npm run dev:example`: Run in development mode using examples/config.example.json (Bearer auth)
- `npm run dev:basic`: Run with basic authentication example (examples/config.basic-auth.json)
- `npm run dev:apikey`: Run with API key authentication example (examples/config.apikey.json)
- `npm run dev:custom`: Run with custom authentication example (examples/config.custom-auth.json)
- `npm run dev:post`: Run with POST request example (examples/config.post.json)
- `npm run dev:put`: Run with PUT request example (examples/config.put.json)
- `npm run dev:patch`: Run with PATCH request example (examples/config.patch.json)
- `npm run dev:delete`: Run with DELETE request example (examples/config.delete.json)
- `npm run dev:head`: Run with HEAD request example (examples/config.head.json)
- `npm run dev:options`: Run with OPTIONS request example (examples/config.options.json)
- `npm run clean`: Remove compiled files
- `npm test`: Run the test suite
- `npm run test:watch`: Run tests in watch mode

## Testing

The project includes comprehensive tests using Jest and nock for HTTP mocking:

```bash
# Run all tests
npm test

# Run tests in watch mode during development
npm run test:watch
```

Tests cover:

- Basic load testing functionality
- Error handling scenarios
- Custom headers and basic authentication
- Configuration validation
- Performance metrics tracking

## Examples

The `examples/` directory contains pre-configured JSON files demonstrating various features:

### Authentication Examples

- `examples/config.example.json` - Bearer token authentication
- `examples/config.basic-auth.json` - Basic authentication (username/password)
- `examples/config.apikey.json` - API key authentication
- `examples/config.custom-auth.json` - Custom header authentication

### HTTP Method Examples

- `examples/config.post.json` - POST request with JSON body
- `examples/config.put.json` - PUT request example
- `examples/config.patch.json` - PATCH request example
- `examples/config.delete.json` - DELETE request example
- `examples/config.head.json` - HEAD request example
- `examples/config.options.json` - OPTIONS request example

You can run any example using:

```bash
npm run dev -- examples/config.post.json
# or use the predefined scripts
npm run dev:post
```

## Custom Configurations

For your personal/private configurations, use the `custom-configs/` directory:

- **Git-ignored**: Configs in this directory won't be committed to version control
- **Secure**: Safe place for configs with real endpoints, tokens, or sensitive data
- **Convenient**: Reference them in scripts or run directly

```bash
# Copy an example as a starting point
cp examples/config.post.json custom-configs/my-api-test.json

# Edit with your real settings
# Then run it
npm run dev -- custom-configs/my-api-test.json
```

## License

MIT
