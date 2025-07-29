#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Debug script starting...');

// Test config loading
const configPath = path.join(__dirname, 'config.json');
console.log('Config path:', configPath);
console.log('Config exists:', fs.existsSync(configPath));

try {
  const configData = fs.readFileSync(configPath, 'utf-8');
  console.log('Config file read successfully');
  
  const config = JSON.parse(configData);
  console.log('Config parsed successfully');
  console.log('Config structure:', {
    hasEndpoints: !!config.endpoints,
    endpointCount: config.endpoints ? config.endpoints.length : 0,
    firstEndpoint: config.endpoints ? config.endpoints[0] : null
  });
  
  if (config.endpoints && config.endpoints[0]) {
    const endpoint = config.endpoints[0];
    console.log('First endpoint details:', {
      hasEndpoint: !!endpoint.endpoint,
      endpointType: typeof endpoint.endpoint,
      endpointValue: endpoint.endpoint,
      hasConcurrentUsers: !!endpoint.concurrentUsers,
      hasFrequencyMs: !!endpoint.frequencyMs
    });
  }
  
} catch (error) {
  console.error('Error during config processing:', error.message);
}

console.log('Debug script completed');
