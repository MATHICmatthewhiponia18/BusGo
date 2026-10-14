// Test script to verify the entire Bus Reservation System data flow and logic
const { execSync } = require('child_process');
try {
  execSync('npx -y tsx --env-file=.env scripts/test-flow.ts', { encoding: 'utf-8', stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
