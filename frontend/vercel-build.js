const { execSync } = require('child_process');

// Run pnpm install without frozen-lockfile
execSync('pnpm install --no-frozen-lockfile', { stdio: 'inherit' });

// Then run the regular build command
execSync('pnpm run build', { stdio: 'inherit' }); 