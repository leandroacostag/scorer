const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const envConfig = `window.env = {
    AUTH0_DOMAIN: '${process.env.AUTH0_DOMAIN}',
    AUTH0_CLIENT_ID: '${process.env.AUTH0_CLIENT_ID}',
    AUTH0_AUDIENCE: '${process.env.AUTH0_AUDIENCE}'
};`;

fs.writeFileSync(
    path.resolve(__dirname, '../public/env-config.js'),
    envConfig
);

console.log('Environment config generated'); 