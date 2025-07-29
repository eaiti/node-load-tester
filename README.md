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
  "endpoints": [
    {
      "name": "API-Test",
      "endpoint": "https://api.example.com/data",
      "method": "GET",
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
  ],
  "stopAfterMs": 300000,
  "csvOutput": "results.csv"
}
```

### Configuration Options

- `endpoints`: Array of endpoint configurations to test (required)
- `stopAfterMs`: Test duration in milliseconds (optional, defaults to 20 minutes)
- `csvOutput`: Optional path to export detailed request data to CSV file

For each endpoint in the `endpoints` array:
- `name`: Optional name for the endpoint (defaults to "Endpoint-N")
- `endpoint`: The HTTP endpoint to test (required)
- `method`: HTTP method to use (optional, defaults to "GET")
- `concurrentUsers`: Number of concurrent users/connections (minimum: 1)
- `frequencyMs`: Frequency of requests in milliseconds (minimum: 100ms)
- `headers`: Optional HTTP headers to include with each request
- `auth`: Optional authentication configuration (see Authentication Types below)

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

## CSV Output

The load tester can export detailed request data to a CSV file for further analysis. This feature captures comprehensive information about each individual request made during the test.

### Enabling CSV Output

You can enable CSV output in two ways:

#### 1. Configuration File

Add the `csvOutput` property to your config file:

```json
{
  "endpoints": [
    {
      "name": "API-Test",
      "endpoint": "https://api.example.com/data",
      "concurrentUsers": 5,
      "frequencyMs": 1000
    }
  ],
  "csvOutput": "load-test-results.csv"
}
```

#### 2. Command Line Argument

Use the `--csv-output` flag when running the test:

```bash
# Development mode
npm run dev -- config.json --csv-output results.csv

# Production mode  
node dist/index.js config.json --csv-output results.csv
```

### CSV Format

The CSV file contains the following columns:

- **Timestamp**: ISO 8601 timestamp of when the request was made
- **EndpointName**: Name of the endpoint (from config or auto-generated)
- **Endpoint**: Full URL that was requested
- **Method**: HTTP method used (GET, POST, etc.)
- **ResponseTime(ms)**: Response time in milliseconds
- **StatusCode**: HTTP status code returned
- **Success**: Boolean indicating if the request was successful
- **Error**: Error message (if any) for failed requests
- **UserAgent**: User agent string used for the request

### Example CSV Output

```csv
Timestamp,EndpointName,Endpoint,Method,ResponseTime(ms),StatusCode,Success,Error,UserAgent
2024-01-15T10:30:00.123Z,API-Test,"https://api.example.com/data",GET,245,200,true,"","Node-Load-Tester/1.0.0"
2024-01-15T10:30:01.456Z,API-Test,"https://api.example.com/data",GET,189,200,true,"","Node-Load-Tester/1.0.0"
2024-01-15T10:30:02.789Z,API-Test,"https://api.example.com/data",GET,0,0,false,"Request timeout","Node-Load-Tester/1.0.0"
```

### Use Cases

The CSV output is particularly useful for:

- **Performance Analysis**: Import into Excel, Python, or R for detailed statistical analysis
- **Trend Analysis**: Identify patterns in response times over the duration of the test
- **Error Investigation**: Filter and analyze failed requests to identify issues
- **Reporting**: Create custom reports and visualizations for stakeholders
- **Historical Comparison**: Compare results across different test runs

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

# With CSV output
npm run dev -- ./my-config.json --csv-output results.csv

# Production mode with custom config file
npm run build
node dist/index.js ./my-config.json
node dist/index.js /path/to/custom-config.json

# Production mode with CSV output
node dist/index.js ./my-config.json --csv-output detailed-results.csv
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
