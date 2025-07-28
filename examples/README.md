# Configuration Examples

This directory contains example configuration files demonstrating various features of the Node Load Tester.

## Authentication Examples

### Basic Authentication (`config.basic-auth.json`)
Demonstrates username/password authentication using HTTP Basic Auth.

### Bearer Token (`config.example.json`)
Shows how to use JWT or other bearer tokens for API authentication.

### API Key (`config.apikey.json`)
Example of API key authentication with custom headers.

### Custom Authentication (`config.custom-auth.json`)
Demonstrates custom header-based authentication.

## HTTP Method Examples

### GET Requests
Default method when no `method` is specified in config.

### POST Requests (`config.post.json`)
Example POST request with JSON body and Bearer authentication.

### PUT Requests (`config.put.json`)
Example PUT request for updating resources.

### PATCH Requests (`config.patch.json`)
Example PATCH request for partial updates.

### DELETE Requests (`config.delete.json`)
Example DELETE request with API key authentication.

### HEAD Requests (`config.head.json`)
Example HEAD request for checking resource headers without body.

### OPTIONS Requests (`config.options.json`)
Example OPTIONS request for CORS preflight or API discovery.

## Specialized Use Cases

### DDoS Shield Testing (`config.ddos-shield.json`)
High-concurrency load test configuration for DDoS protection services:
- 30 concurrent users
- Request every 10 seconds (10000ms frequency)
- Custom Verizon headers (VZ_UID, VZ_USER, VZ_ROLE)
- Tests traffic enhancement API endpoint

## Usage

Run any example configuration:

```bash
# Using npm scripts (recommended)
npm run dev:post
npm run dev:basic
npm run dev:apikey

# Or directly with config file path
npm run dev -- examples/config.post.json
node dist/index.js examples/config.basic-auth.json
```

## Customizing Examples

Feel free to modify these example files or create new ones based on your testing needs. All examples use public testing endpoints like httpbin.org for demonstration purposes.

For production use, replace the endpoints and authentication credentials with your actual API details.
