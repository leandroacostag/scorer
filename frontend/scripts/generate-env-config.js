const fs = require('fs');
const path = require('path');

// Try to load dotenv, but don't fail if it's not available
try {
  require('dotenv').config();
} catch (error) {
  console.warn('Warning: dotenv module not found, using process.env directly');
}

// Create a config object with environment variables
const envConfig = {
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN || '',
  AUTH0_CLIENT_ID: process.env.AUTH0_CLIENT_ID || '',
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE || '',
  REACT_APP_API_URL: process.env.REACT_APP_API_URL || ''
};

// Create the output directory if it doesn't exist
const outputDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Write the config to a file
fs.writeFileSync(
  path.resolve(outputDir, 'env-config.js'),
  `window.ENV = ${JSON.stringify(envConfig)};`
);

console.log('Environment config generated successfully');