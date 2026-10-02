// scripts/update.js
// Checks for and applies updates from the GitHub repository, updates dependencies, and rebuilds the executable.

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('=== Hangly Application Updater ===\n');

const rootDir = path.resolve(__dirname, '..');

// 1. Check Git status
console.log('1. Checking for updates from GitHub...');
try {
  execSync('git fetch', { cwd: rootDir, stdio: 'inherit' });
  const status = execSync('git status -uno', { cwd: rootDir, encoding: 'utf8' });
  
  if (status.includes('Your branch is behind') || status.includes('have diverged')) {
    console.log('\n2. New version available! Pulling latest updates...');
    execSync('git pull', { cwd: rootDir, stdio: 'inherit' });
    
    console.log('\n3. Updating dependencies...');
    execSync('npm install', { cwd: rootDir, stdio: 'inherit' });

    console.log('\n4. Rebuilding standalone executable...');
    execSync('npm run build:portable', { cwd: rootDir, stdio: 'inherit' });

    console.log('\n✓ Hangly has been successfully updated to the latest version!');
  } else {
    console.log('\n✓ You are already running the latest version of Hangly.');
  }
} catch (err) {
  console.warn(`\n⚠ Update check failed: ${err.message}`);
}
