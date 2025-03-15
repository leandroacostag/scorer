const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Determine environment
const isProduction = process.env.NODE_ENV === 'production';
console.log(`Running in ${isProduction ? 'production' : 'development'} mode`);

// Load environment variables from the root .env file for local development
if (!isProduction) {
  const rootEnvPath = path.resolve(__dirname, '../../.env');
  const result = dotenv.config({ path: rootEnvPath });
  
  if (result.error) {
    console.warn('Warning: Could not load .env file from root directory');
  } else {
    console.log('Loaded environment variables from root .env file');
  }
}

// Create a config object with environment variables
// In production, these will come from actual environment variables
// In development, they will come from the .env file
const envConfig = {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || '',
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || '',
  API_URL: process.env.API_URL || 'http://localhost:8000/api'
};

// Log environment variables (without showing actual values in production)
if (isProduction) {
  console.log('Environment variables loaded:', {
    AUTH0_DOMAIN: envConfig.AUTH0_DOMAIN ? 'Set' : 'Not set',
    AUTH0_CLIENT_ID: envConfig.AUTH0_CLIENT_ID ? 'Set' : 'Not set',
    AUTH0_AUDIENCE: envConfig.AUTH0_AUDIENCE ? 'Set' : 'Not set',
    API_URL: envConfig.API_URL ? 'Set' : 'Not set'
  });
} else {
  console.log('Environment variables loaded:', {
    AUTH0_DOMAIN: envConfig.AUTH0_DOMAIN ? 'Set' : 'Not set',
    AUTH0_CLIENT_ID: envConfig.AUTH0_CLIENT_ID ? 'Set' : 'Not set',
    AUTH0_AUDIENCE: envConfig.AUTH0_AUDIENCE ? 'Set' : 'Not set',
    API_URL: envConfig.API_URL ? 'Set': 'Not Set'
  });
}

// Create the output directory if it doesn't exist
const outputDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the config to a file that works in the browser
fs.writeFileSync(
  path.resolve(outputDir, 'env-config.js'),
  `window.ENV = ${JSON.stringify(envConfig)};`
);

console.log('Environment config generated successfully'); 