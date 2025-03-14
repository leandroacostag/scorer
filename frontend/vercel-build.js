const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Log the current directory
console.log('Current directory:', process.cwd());

// Run the build with CI=false to prevent warnings from failing the build
process.env.CI = 'false';

try {
  // Run the build command
  console.log('Running build command...');
  execSync('npm run build', { stdio: 'inherit' });
  
  // Check if build directory exists
  const buildDir = path.join(__dirname, 'build');
  if (fs.existsSync(buildDir)) {
    console.log('Build directory exists:', buildDir);
    // List files in build directory
    const files = fs.readdirSync(buildDir);
    console.log('Files in build directory:', files);
  } else {
    console.error('Build directory does not exist:', buildDir);
  }
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 