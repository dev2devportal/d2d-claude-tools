#!/usr/bin/env node

/**
 * setup.js
 * 
 * This script performs initial setup tasks after npm install
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

console.log('Running Claude tools setup...');

// Here we are trying to ensure all bin scripts are executable
const binDir = path.join(__dirname, '..', 'bin');
const binFiles = fs.readdirSync(binDir);

binFiles.forEach(file => {
    const filePath = path.join(binDir, file);
    // This attempts to make each bin script executable
    try {
        fs.chmodSync(filePath, '755');
        console.log(`✓ Made ${file} executable`);
    } catch (error) {
        console.error(`✗ Failed to make ${file} executable: ${error.message}`);
    }
});

// Check if nvm is available
try {
    execSync('command -v nvm', { stdio: 'ignore' });
    console.log('✓ nvm is available');
} catch {
    console.log('\n⚠️  nvm not found. Run ./scripts/setup-nvm.sh to install it.');
}

console.log('\nSetup complete! Use ./claude-env to start the isolated environment.');